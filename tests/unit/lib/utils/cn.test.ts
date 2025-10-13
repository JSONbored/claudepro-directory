/**
 * cn Utility Tests
 *
 * Tests the cn() utility function which merges Tailwind CSS classes.
 * This utility is used throughout the codebase for className composition.
 *
 * **Why Test This:**
 * - Used in 100+ components
 * - Critical for UI consistency
 * - Tailwind class conflicts must be handled correctly
 * - Conditional classes must work properly
 *
 * **Test Coverage:**
 * - Basic class merging
 * - Tailwind class conflict resolution
 * - Conditional class handling
 * - Empty/undefined/null handling
 * - Array and object syntax
 *
 * @see src/lib/utils/cn.ts
 */

import { describe, expect, it } from 'vitest';
import { cn } from '@/src/lib/utils';

describe('cn() utility', () => {
  describe('Basic Functionality', () => {
    it('merges multiple class names', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('handles single class name', () => {
      expect(cn('single-class')).toBe('single-class');
    });

    it('handles empty input', () => {
      expect(cn()).toBe('');
    });

    it('handles undefined values', () => {
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    });

    it('handles null values', () => {
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
    });

    it('handles empty strings', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });
  });

  describe('Conditional Classes', () => {
    it('includes class when condition is true', () => {
      expect(cn('base', 'active')).toBe('base active');
    });

    it('excludes class when condition is false', () => {
      expect(cn('base', false)).toBe('base');
    });

    it('handles multiple conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('handles ternary conditions', () => {
      const variant = 'primary';
      expect(cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary')).toBe(
        'btn btn-primary'
      );
    });
  });

  describe('Tailwind Class Conflicts (tailwind-merge)', () => {
    it('resolves padding conflicts (later wins)', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('resolves margin conflicts', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
    });

    it('resolves background color conflicts', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('resolves text color conflicts', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('keeps non-conflicting classes', () => {
      expect(cn('px-2 py-1', 'text-blue-500')).toBe('px-2 py-1 text-blue-500');
    });

    it('handles complex Tailwind conflicts', () => {
      // p-4 sets padding all sides, px-2 overrides left/right, py-8 overrides top/bottom
      // tailwind-merge keeps p-4 as it doesn't fully conflict
      expect(cn('p-4 px-2', 'py-8')).toBe('p-4 px-2 py-8');
    });
  });

  describe('Array Syntax', () => {
    it('handles array of class names', () => {
      expect(cn(['class1', 'class2', 'class3'])).toBe('class1 class2 class3');
    });

    it('handles nested arrays', () => {
      expect(cn(['class1', ['class2', 'class3']])).toBe('class1 class2 class3');
    });

    it('handles array with conditional classes', () => {
      expect(cn(['base', 'active', false])).toBe('base active');
    });
  });

  describe('Object Syntax (clsx)', () => {
    it('includes keys with truthy values', () => {
      expect(cn({ active: true, disabled: false })).toBe('active');
    });

    it('handles multiple truthy keys', () => {
      expect(cn({ primary: true, large: true, disabled: false })).toBe('primary large');
    });

    it('handles object with conditional values', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn({ active: isActive, disabled: isDisabled })).toBe('active');
    });
  });

  describe('Real-World Use Cases', () => {
    it('handles button variant composition', () => {
      const variant = 'primary';
      const size = 'large';
      const disabled = false;

      const result = cn(
        'btn',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-900',
        size === 'large' && 'px-6 py-3',
        size === 'small' && 'px-2 py-1',
        disabled && 'opacity-50 cursor-not-allowed'
      );

      expect(result).toBe('btn bg-blue-500 text-white px-6 py-3');
    });

    it('handles responsive classes with conflicts', () => {
      expect(cn('p-2 md:p-4', 'p-3')).toBe('md:p-4 p-3');
    });

    it('handles hover/focus states', () => {
      expect(cn('text-gray-900', 'hover:text-blue-500', 'focus:text-blue-600')).toBe(
        'text-gray-900 hover:text-blue-500 focus:text-blue-600'
      );
    });

    it('handles dark mode variants', () => {
      expect(cn('bg-white text-black', 'dark:bg-black dark:text-white')).toBe(
        'bg-white text-black dark:bg-black dark:text-white'
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles only falsy values', () => {
      expect(cn(false, null, undefined, '')).toBe('');
    });

    it('handles very long class strings', () => {
      const longClass = 'class1 class2 class3 class4 class5 class6 class7 class8';
      expect(cn(longClass)).toBe(longClass);
    });

    it('handles special characters in class names', () => {
      expect(cn('class-with-dash', 'class_with_underscore', 'class:with:colon')).toContain(
        'class-with-dash'
      );
    });

    it('handles numeric values (should be ignored)', () => {
      expect(cn('class1', 0, 'class2')).toBe('class1 class2');
    });
  });

  describe('Type Safety', () => {
    it('accepts string literals', () => {
      const result: string = cn('class1', 'class2');
      expect(typeof result).toBe('string');
    });

    it('accepts template literals', () => {
      const variant = 'primary';
      const result = cn(`btn-${variant}`);
      expect(result).toBe('btn-primary');
    });

    it('returns string type', () => {
      const result = cn('test');
      expect(typeof result).toBe('string');
    });
  });
});
