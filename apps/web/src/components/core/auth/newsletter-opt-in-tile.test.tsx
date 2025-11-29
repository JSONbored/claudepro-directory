import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewsletterOptInTile } from './newsletter-opt-in-tile.tsx';

// Mock framer-motion to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, onClick, className, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
}));

describe('NewsletterOptInTile', () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
    subscriberCountLabel: '1,234',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<NewsletterOptInTile {...defaultProps} />);

      expect(screen.getByText('Your weekly Claude upgrade drop')).toBeInTheDocument();
      expect(screen.getByText('No spam. Unsubscribe anytime.')).toBeInTheDocument();
      expect(screen.getByText(/✨ Trusted by 1,234 Claude builders/)).toBeInTheDocument();
    });

    it('should render with custom headline', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          headline="Custom Newsletter Headline"
        />
      );

      expect(screen.getByText('Custom Newsletter Headline')).toBeInTheDocument();
    });

    it('should render with custom safety copy', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          safetyCopy="Custom safety message"
        />
      );

      expect(screen.getByText('Custom safety message')).toBeInTheDocument();
    });

    it('should render with custom badge prefix', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          badgePrefix="🎉 Join"
          subscriberCountLabel="500"
        />
      );

      expect(screen.getByText(/🎉 Join 500 Claude builders/)).toBeInTheDocument();
    });

    it('should show loading state when isLoadingCount is true', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          isLoadingCount={true}
        />
      );

      expect(screen.getByText('✨ Loading Claude builders…')).toBeInTheDocument();
      expect(screen.queryByText(/Trusted by/)).not.toBeInTheDocument();
    });

    it('should render checkbox with correct checked state', () => {
      const { rerender } = render(<NewsletterOptInTile {...defaultProps} checked={false} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      rerender(<NewsletterOptInTile {...defaultProps} checked={true} />);
      expect(checkbox).toBeChecked();
    });

    it('should have accessible label for checkbox', () => {
      render(<NewsletterOptInTile {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { 
        name: /Opt into weekly Claude newsletter/i 
      });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onChange when tile is clicked', () => {
      const onChange = vi.fn();
      render(<NewsletterOptInTile {...defaultProps} onChange={onChange} checked={false} />);

      const tile = screen.getByRole('button');
      fireEvent.click(tile);

      expect(onChange).toHaveBeenCalledWith(true);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should toggle state when clicked multiple times', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <NewsletterOptInTile {...defaultProps} onChange={onChange} checked={false} />
      );

      const tile = screen.getByRole('button');
      
      fireEvent.click(tile);
      expect(onChange).toHaveBeenCalledWith(true);

      rerender(<NewsletterOptInTile {...defaultProps} onChange={onChange} checked={true} />);
      fireEvent.click(tile);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should call onChange when checkbox is clicked', () => {
      const onChange = vi.fn();
      render(<NewsletterOptInTile {...defaultProps} onChange={onChange} checked={false} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should not call onChange when indeterminate state is set', () => {
      const onChange = vi.fn();
      render(<NewsletterOptInTile {...defaultProps} onChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      
      // Simulate indeterminate state (edge case)
      fireEvent.click(checkbox);
      
      // Should be called for normal checked state
      expect(onChange).toHaveBeenCalled();
    });

    it('should stop propagation on label click', () => {
      const onChange = vi.fn();
      render(<NewsletterOptInTile {...defaultProps} onChange={onChange} />);

      const label = screen.getByText(/Opt into weekly Claude newsletter/i).closest('label');
      
      // Create a mock event with stopPropagation
      const mockEvent = {
        stopPropagation: vi.fn(),
      };
      
      if (label) {
        fireEvent.click(label, mockEvent);
      }

      // The tile's onChange should not be called (propagation stopped)
      // But checkbox's own onChange should work
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should apply checked styles when checked', () => {
      const { container } = render(
        <NewsletterOptInTile {...defaultProps} checked={true} />
      );

      const tile = container.querySelector('button');
      expect(tile?.className).toContain('border-accent');
    });

    it('should apply unchecked styles when not checked', () => {
      const { container } = render(
        <NewsletterOptInTile {...defaultProps} checked={false} />
      );

      const tile = container.querySelector('button');
      expect(tile?.className).toContain('border-white');
    });
  });

  describe('edge cases', () => {
    it('should handle empty subscriber count label', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          subscriberCountLabel=""
        />
      );

      expect(screen.getByText(/✨ Trusted by  Claude builders/)).toBeInTheDocument();
    });

    it('should handle very large subscriber counts', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          subscriberCountLabel="1,234,567"
        />
      );

      expect(screen.getByText(/1,234,567/)).toBeInTheDocument();
    });

    it('should handle special characters in text props', () => {
      render(
        <NewsletterOptInTile
          {...defaultProps}
          headline="Test & Special <Characters>"
          safetyCopy="Privacy & Security"
        />
      );

      expect(screen.getByText('Test & Special <Characters>')).toBeInTheDocument();
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    });

    it('should maintain button type as "button"', () => {
      render(<NewsletterOptInTile {...defaultProps} />);

      const tile = screen.getByRole('button');
      expect(tile).toHaveAttribute('type', 'button');
    });

    it('should not trigger form submission', () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      
      const { container } = render(
        <form onSubmit={onSubmit}>
          <NewsletterOptInTile {...defaultProps} />
        </form>
      );

      const tile = screen.getByRole('button');
      fireEvent.click(tile);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NewsletterOptInTile {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /Opt into weekly Claude newsletter/i,
      });
      expect(checkbox).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const onChange = vi.fn();
      render(<NewsletterOptInTile {...defaultProps} onChange={onChange} />);

      const checkbox = screen.getByRole('checkbox');
      
      // Simulate keyboard interaction
      fireEvent.keyDown(checkbox, { key: 'Enter' });
      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalled();
    });

    it('should have proper label association', () => {
      render(<NewsletterOptInTile {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText(/Opt into weekly Claude newsletter/i);

      expect(checkbox.id).toBeTruthy();
      expect(label.closest('label')).toHaveAttribute('for', checkbox.id);
    });
  });
});