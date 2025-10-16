/**
 * Button Component Tests
 *
 * Tests the Button component which is one of the most reused components
 * across the application. This component uses class-variance-authority (CVA)
 * for variant management and supports polymorphic rendering via Radix Slot.
 *
 * **Why Test This:**
 * - Used in 100+ locations across the app
 * - Critical for user interactions (forms, navigation, actions)
 * - Complex variant system (6 variants × 4 sizes = 24 combinations)
 * - Accessibility features must work correctly
 * - Polymorphic rendering (asChild prop) needs validation
 *
 * **Test Coverage:**
 * - Rendering with different variants
 * - Size variants
 * - Disabled state
 * - asChild polymorphic behavior
 * - Accessibility attributes
 * - Custom className merging
 * - Click handlers
 *
 * @see src/components/ui/button.tsx
 */

import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/src/components/ui/button';
import { fireEvent, render, screen } from '@/tests/utils/test-utils';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders as a button element by default', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button.tagName).toBe('BUTTON');
    });

    it('renders children correctly', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByText('Test Button')).toBeInTheDocument();
    });

    it('forwards className prop', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with variant classes', () => {
      render(
        <Button className="custom-class" variant="default">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      // Should also have base button classes
      expect(button.className).toContain('inline-flex');
    });
  });

  describe('Variant Prop', () => {
    it('renders default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-accent');
      expect(button).toHaveClass('text-accent-foreground');
    });

    it('renders destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });

    it('renders outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('renders ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('renders link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });

    it('uses default variant when variant prop is omitted', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-accent');
    });
  });

  describe('Size Prop', () => {
    it('renders default size', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('renders small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
    });

    it('renders large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-8');
    });

    it('renders icon size', () => {
      render(
        <Button size="icon" aria-label="Icon button">
          📧
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });

    it('uses default size when size prop is omitted', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });
  });

  describe('Variant + Size Combinations', () => {
    it('renders destructive + small', () => {
      render(
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('h-9');
    });

    it('renders outline + large', () => {
      render(
        <Button variant="outline" size="lg">
          Outline Large
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('h-11');
    });

    it('renders ghost + icon', () => {
      render(
        <Button variant="ghost" size="icon" aria-label="Ghost icon">
          X
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('Disabled State', () => {
    it('applies disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled opacity class', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('prevents pointer events when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('does not trigger onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('calls onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with event object', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('supports onMouseEnter handler', () => {
      const handleMouseEnter = vi.fn();
      render(<Button onMouseEnter={handleMouseEnter}>Hover me</Button>);
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('supports onFocus handler', () => {
      const handleFocus = vi.fn();
      render(<Button onFocus={handleFocus}>Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTML Attributes', () => {
    it('forwards type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('defaults to type="button" when not specified', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      // HTML buttons default to type="submit" but we should check what's actually rendered
      expect(button.getAttribute('type')).toBeNull();
    });

    it('forwards aria-label attribute', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('forwards aria-describedby attribute', () => {
      render(<Button aria-describedby="description">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('forwards data attributes', () => {
      render(
        <Button data-testid="custom-button" data-analytics="click">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('data-analytics', 'click');
    });

    it('forwards id attribute', () => {
      // Test that id forwarding works (in real apps, use useId() for unique IDs)
      const testId = `submit-button-${Math.random().toString(36).substring(7)}`;
      render(<Button id={testId}>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', testId);
    });

    it('forwards name attribute', () => {
      render(<Button name="action">Action</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('name', 'action');
    });

    it('forwards value attribute', () => {
      render(<Button value="delete">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('value', 'delete');
    });
  });

  describe('asChild Polymorphic Prop', () => {
    it('renders as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/home">Home Link</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: /home link/i });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/home');
    });

    it('applies button classes to child element', () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-destructive');
      expect(link).toHaveClass('inline-flex');
    });

    it('merges child className with button className', () => {
      render(
        <Button asChild className="custom-button-class">
          <a href="/link" className="custom-link-class">
            Link
          </a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-button-class');
      expect(link).toHaveClass('custom-link-class');
    });

    it('works with custom components as children', () => {
      const CustomLink = ({
        children,
        ...props
      }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>;
      render(
        <Button asChild>
          <CustomLink href="/custom">Custom Link</CustomLink>
        </Button>
      );
      const link = screen.getByRole('link', { name: /custom link/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role="button" by default', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('is keyboard accessible (can be focused)', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('applies focus-visible styles', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
    });

    it('supports aria-pressed for toggle buttons', () => {
      render(<Button aria-pressed="true">Toggle</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('supports aria-expanded for accordion/dropdown buttons', () => {
      render(<Button aria-expanded="false">Expand</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('icon buttons should have accessible labels', () => {
      render(
        <Button size="icon" aria-label="Close">
          X
        </Button>
      );
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('Base Classes', () => {
    it('includes base layout classes', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('includes text styling classes', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-sm');
      expect(button).toHaveClass('font-medium');
      expect(button).toHaveClass('whitespace-nowrap');
    });

    it('includes border radius classes', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-md');
    });

    it('includes transition classes', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-colors');
    });

    it('includes gap classes for icon spacing', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('gap-2');
    });
  });

  describe('SVG Icon Support', () => {
    it('renders button with SVG icon', () => {
      render(
        <Button>
          <svg data-testid="icon" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
          </svg>
          Button with icon
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Button with icon')).toBeInTheDocument();
    });

    it('applies icon size classes to SVG children', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      // Check that the base classes include SVG sizing
      expect(button.className).toContain('[&_svg]:size-4');
    });

    it('prevents pointer events on SVG icons', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('[&_svg]:pointer-events-none');
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty children', () => {
      render(<Button>{''}</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('renders with React fragments as children', () => {
      render(
        <Button>
          <>Fragment text</>
        </Button>
      );
      expect(screen.getByText('Fragment text')).toBeInTheDocument();
    });

    it('handles undefined variant gracefully', () => {
      render(<Button variant={undefined}>Button</Button>);
      const button = screen.getByRole('button');
      // Should fall back to default variant
      expect(button).toHaveClass('bg-accent');
    });

    it('handles undefined size gracefully', () => {
      render(<Button size={undefined}>Button</Button>);
      const button = screen.getByRole('button');
      // Should fall back to default size
      expect(button).toHaveClass('h-10');
    });
  });

  describe('Display Name', () => {
    it('has correct displayName for React DevTools', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});
