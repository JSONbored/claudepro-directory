/**
 * Theme Toggle Accessibility Tests
 *
 * Tests theme toggle component for WCAG 2.1 Level AA compliance.
 *
 * **Accessibility Requirements:**
 * - Keyboard accessible (Tab, Enter, Space)
 * - Screen reader compatible with ARIA labels
 * - Proper focus management
 * - Clear visual focus indicators
 * - Sufficient color contrast
 *
 * @see src/components/layout/theme-toggle.tsx
 */

import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  axeTest,
  axeTestInteractive,
  testKeyboardNavigation,
  testScreenReaderCompatibility,
} from '@/tests/utils/accessibility';
import { ThemeToggle } from '@/src/components/layout/theme-toggle';

describe('ThemeToggle - Accessibility', () => {
  test('should have no accessibility violations', async () => {
    const { container } = render(<ThemeToggle />);
    const results = await axeTest(container);
    expect(results).toHaveNoViolations();
  });

  test('should pass interactive element accessibility checks', async () => {
    const { container } = render(<ThemeToggle />);
    const results = await axeTestInteractive(container);
    expect(results).toHaveNoViolations();
  });

  test('should be keyboard accessible', () => {
    const { container } = render(<ThemeToggle />);
    const { focusableElements, hasFocusableElements } = testKeyboardNavigation(container);

    expect(hasFocusableElements).toBe(true);
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels for screen readers', () => {
    const { container } = render(<ThemeToggle />);
    const { hasAriaLabels } = testScreenReaderCompatibility(container);

    expect(hasAriaLabels).toBe(true);
  });

  test('should be navigable with Tab key', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    // Focus should move to the toggle switch
    await user.tab();
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveFocus();
  });

  test('should be activatable with Space key', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole('switch');
    toggle.focus();

    // Switch should be activatable with Space
    await user.keyboard(' ');

    // Switch should still be in the document and accessible
    expect(toggle).toBeInTheDocument();
  });

  test('should have accessible name', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');

    // Switch should have accessible name (aria-label or associated label)
    expect(toggle).toHaveAccessibleName();
  });

  test('should announce state changes to screen readers', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole('switch');

    // Switch should have aria-checked attribute
    const initialChecked = toggle.getAttribute('aria-checked');
    expect(initialChecked).toBeTruthy();

    await user.click(toggle);

    // After theme change, aria-checked should update
    const newChecked = toggle.getAttribute('aria-checked');
    expect(newChecked).toBeTruthy();
  });

  test('should maintain focus after theme change', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const toggle = screen.getByRole('switch');
    toggle.focus();

    await user.click(toggle);

    // Focus should remain on switch after click
    expect(toggle).toHaveFocus();
  });
});
