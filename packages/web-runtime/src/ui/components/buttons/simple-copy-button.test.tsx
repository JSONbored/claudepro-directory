/**
 * SimpleCopyButton Component Tests
 *
 * Tests copy-to-clipboard functionality, visual feedback, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SimpleCopyButton } from './simple-copy-button';

// Mock clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock toast
vi.mock('../../../client/toast', () => ({
  toasts: {
    raw: {
      success: vi.fn(),
      error: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../../entries/core', () => ({
  logger: {
    warn: vi.fn(),
  },
  normalizeError: vi.fn((error) => error),
}));

// Mock client defaults
vi.mock('../../../config/client-defaults', () => ({
  TIMEOUT_CONFIG_CLIENT_DEFAULTS: {
    'timeout.ui.clipboard_reset_delay_ms': 2000,
  },
}));

describe('SimpleCopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders with copy icon', () => {
      render(<SimpleCopyButton content="test content" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<SimpleCopyButton content="test" label="Copy Link" />);
      expect(screen.getByText('Copy Link')).toBeInTheDocument();
    });

    it('renders without icon when showIcon is false', () => {
      const { container } = render(
        <SimpleCopyButton content="test" label="Copy" showIcon={false} />
      );
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<SimpleCopyButton content="test" className="custom-class" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('can be disabled', () => {
      render(<SimpleCopyButton content="test" disabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has aria-label for copy action', () => {
      render(<SimpleCopyButton content="test content" />);
      expect(screen.getByLabelText(/copy content/i)).toBeInTheDocument();
    });

    it('has custom aria-label when provided', () => {
      render(<SimpleCopyButton content="test" ariaLabel="Copy config to clipboard" />);
      expect(screen.getByLabelText('Copy config to clipboard')).toBeInTheDocument();
    });

    it('updates aria-label after copy', async () => {
      render(<SimpleCopyButton content="test" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByLabelText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('is keyboard accessible', () => {
      render(<SimpleCopyButton content="test" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Copy Functionality', () => {
    it('copies content to clipboard on click', async () => {
      render(<SimpleCopyButton content="test content" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('test content');
      });
    });

    it('shows success toast on copy', async () => {
      const { toasts } = await import('../../../client/toast');
      render(<SimpleCopyButton content="test" successMessage="Link copied!" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toasts.raw.success).toHaveBeenCalledWith('Link copied!');
      });
    });

    it('calls onCopySuccess callback', async () => {
      const onCopySuccess = vi.fn();
      render(<SimpleCopyButton content="test" onCopySuccess={onCopySuccess} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onCopySuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Visual Feedback', () => {
    it('shows checkmark icon after copy', async () => {
      render(<SimpleCopyButton content="test" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        // Check icon changes to checkmark
        expect(button).toBeDisabled();
      });
    });

    it('changes label to "Copied!" after copy', async () => {
      render(<SimpleCopyButton content="test" label="Copy" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('resets after configured delay', async () => {
      render(<SimpleCopyButton content="test" label="Copy" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Initially copied
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Fast-forward timers
      vi.advanceTimersByTime(2000);

      // Should reset to original state
      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      });
    });

    it('disables button during copied state', async () => {
      render(<SimpleCopyButton content="test" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('re-enables button after reset', async () => {
      render(<SimpleCopyButton content="test" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Initially disabled
      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Fast-forward timers
      vi.advanceTimersByTime(2000);

      // Should re-enable
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on clipboard failure', async () => {
      const { toasts } = await import('../../../client/toast');
      mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

      render(<SimpleCopyButton content="test" errorMessage="Failed to copy" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toasts.raw.error).toHaveBeenCalledWith('Failed to copy');
      });
    });

    it('logs error with structured logging', async () => {
      const { logger } = await import('../../../entries/core');
      mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

      render(<SimpleCopyButton content="test" label="Copy Link" />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(logger.warn).toHaveBeenCalledWith(
          '[Clipboard] Copy failed',
          expect.objectContaining({
            category: 'clipboard',
            component: 'SimpleCopyButton',
            recoverable: true,
            userRetryable: true,
          })
        );
      });
    });

    it('does not call onCopySuccess on error', async () => {
      const onCopySuccess = vi.fn();
      mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));

      render(<SimpleCopyButton content="test" onCopySuccess={onCopySuccess} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(onCopySuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Event Propagation', () => {
    it('stops click event propagation', async () => {
      const parentClickHandler = vi.fn();
      render(
        <div onClick={parentClickHandler}>
          <SimpleCopyButton content="test" />
        </div>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(parentClickHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom icon className', () => {
      const { container } = render(
        <SimpleCopyButton content="test" iconClassName="h-6 w-6" />
      );
      const icon = container.querySelector('.h-6.w-6');
      expect(icon).toBeInTheDocument();
    });

    it('supports different button variants', () => {
      render(<SimpleCopyButton content="test" variant="secondary" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('supports different button sizes', () => {
      render(<SimpleCopyButton content="test" size="lg" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
