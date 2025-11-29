/**
 * BookmarkButton Component Tests
 *
 * Tests bookmark functionality, loading states, animations, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookmarkButton } from './bookmark-button';

// Mock dependencies
vi.mock('../../../actions/add-bookmark.generated', () => ({
  addBookmark: vi.fn(),
}));

vi.mock('../../../actions/remove-bookmark.generated', () => ({
  removeBookmark: vi.fn(),
}));

vi.mock('../../../config/static-configs', () => ({
  checkConfettiEnabled: vi.fn(() => false),
}));

vi.mock('../../../hooks/index', () => ({
  useLoggedAsync: vi.fn(() => vi.fn((fn) => fn())),
  usePulse: vi.fn(() => ({
    bookmark: vi.fn().mockResolvedValue(undefined),
  })),
  useConfetti: vi.fn(() => ({
    celebrateBookmark: vi.fn(),
  })),
}));

vi.mock('../../../client/toast', () => ({
  toasts: {
    success: {
      bookmarkAdded: vi.fn(),
      bookmarkRemoved: vi.fn(),
    },
    error: {
      fromError: vi.fn(),
    },
    raw: {
      error: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

describe('BookmarkButton', () => {
  const defaultProps = {
    contentType: 'mcp' as const,
    contentSlug: 'test-mcp-server',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders bookmark button', () => {
      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /add bookmark/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with initial bookmarked state', () => {
      render(<BookmarkButton {...defaultProps} initialBookmarked={true} />);
      const button = screen.getByRole('button', { name: /remove bookmark/i });
      expect(button).toBeInTheDocument();
    });

    it('renders with label when showLabel is true', () => {
      render(<BookmarkButton {...defaultProps} showLabel={true} />);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('renders "Saved" label when bookmarked', () => {
      render(<BookmarkButton {...defaultProps} initialBookmarked={true} showLabel={true} />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('renders loading spinner when pending', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      (addBookmark as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Button should show loading spinner
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label for unbookmarked state', () => {
      render(<BookmarkButton {...defaultProps} />);
      expect(screen.getByLabelText('Add bookmark')).toBeInTheDocument();
    });

    it('has proper aria-label for bookmarked state', () => {
      render(<BookmarkButton {...defaultProps} initialBookmarked={true} />);
      expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
    });

    it('has title attribute for tooltip', () => {
      const { container } = render(<BookmarkButton {...defaultProps} />);
      const button = container.querySelector('[title="Add bookmark"]');
      expect(button).toBeInTheDocument();
    });

    it('is keyboard accessible', () => {
      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('can be disabled', () => {
      render(<BookmarkButton {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Bookmark Actions', () => {
    it('adds bookmark on click', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      (addBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(addBookmark).toHaveBeenCalledWith({
          content_type: 'mcp',
          content_slug: 'test-mcp-server',
          notes: '',
        });
      });
    });

    it('removes bookmark on click when bookmarked', async () => {
      const { removeBookmark } = await import('../../../actions/remove-bookmark.generated');
      (removeBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} initialBookmarked={true} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(removeBookmark).toHaveBeenCalledWith({
          content_type: 'mcp',
          content_slug: 'test-mcp-server',
        });
      });
    });

    it('shows success toast on bookmark add', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      const { toasts } = await import('../../../client/toast');
      (addBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toasts.success.bookmarkAdded).toHaveBeenCalled();
      });
    });

    it('shows success toast on bookmark remove', async () => {
      const { removeBookmark } = await import('../../../actions/remove-bookmark.generated');
      const { toasts } = await import('../../../client/toast');
      (removeBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} initialBookmarked={true} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toasts.success.bookmarkRemoved).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('disables button during async operation', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      (addBookmark as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('hides label during loading when showLabel is true', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      (addBookmark as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      render(<BookmarkButton {...defaultProps} showLabel={true} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Label should be hidden during loading
      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on bookmark failure', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      const { toasts } = await import('../../../client/toast');
      (addBookmark as any).mockRejectedValue(new Error('Network error'));

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toasts.error.fromError).toHaveBeenCalled();
      });
    });

    it('shows sign-in prompt for unauthenticated users', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      const { toasts } = await import('../../../client/toast');
      (addBookmark as any).mockRejectedValue(new Error('User must be signed in'));

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toasts.raw.error).toHaveBeenCalledWith(
          'Please sign in to bookmark content',
          expect.objectContaining({
            action: expect.objectContaining({
              label: 'Sign In',
            }),
          })
        );
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks bookmark addition', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      const { usePulse } = await import('../../../hooks/index');
      const mockPulse = {
        bookmark: vi.fn().mockResolvedValue(undefined),
      };
      (usePulse as any).mockReturnValue(mockPulse);
      (addBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPulse.bookmark).toHaveBeenCalledWith({
          category: 'mcp',
          slug: 'test-mcp-server',
          action: 'add',
        });
      });
    });

    it('tracks bookmark removal', async () => {
      const { removeBookmark } = await import('../../../actions/remove-bookmark.generated');
      const { usePulse } = await import('../../../hooks/index');
      const mockPulse = {
        bookmark: vi.fn().mockResolvedValue(undefined),
      };
      (usePulse as any).mockReturnValue(mockPulse);
      (removeBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} initialBookmarked={true} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPulse.bookmark).toHaveBeenCalledWith({
          category: 'mcp',
          slug: 'test-mcp-server',
          action: 'remove',
        });
      });
    });
  });

  describe('Confetti', () => {
    it('triggers confetti on bookmark add when enabled', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      const { checkConfettiEnabled } = await import('../../../config/static-configs');
      const { useConfetti } = await import('../../../hooks/index');
      const mockCelebrateBookmark = vi.fn();
      (useConfetti as any).mockReturnValue({ celebrateBookmark: mockCelebrateBookmark });
      (checkConfettiEnabled as any).mockReturnValue(true);
      (addBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCelebrateBookmark).toHaveBeenCalled();
      });
    });

    it('does not trigger confetti when disabled', async () => {
      const { addBookmark } = await import('../../../actions/add-bookmark.generated');
      const { checkConfettiEnabled } = await import('../../../config/static-configs');
      const { useConfetti } = await import('../../../hooks/index');
      const mockCelebrateBookmark = vi.fn();
      (useConfetti as any).mockReturnValue({ celebrateBookmark: mockCelebrateBookmark });
      (checkConfettiEnabled as any).mockReturnValue(false);
      (addBookmark as any).mockResolvedValue({ data: { success: true } });

      render(<BookmarkButton {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockCelebrateBookmark).not.toHaveBeenCalled();
      });
    });
  });
});
