/**
 * Tests for ESLint design system rules
 *
 * These tests verify that the design system enforcement rules correctly:
 * 1. Detect inline Tailwind patterns that have design system equivalents
 * 2. Skip patterns with responsive/state prefixes
 * 3. Skip patterns in SVG elements (for icon-size rule)
 * 4. Provide correct replacement suggestions
 */

import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import designSystemPlugin from '../eslint-plugin-design-system-rules.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

// ============================================
// prefer-icon-size Tests
// ============================================

describe('design-system/prefer-icon-size', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-icon-size', designSystemPlugin.rules['prefer-icon-size'], {
      valid: [
        // Already using design system utility
        {
          code: '<Icon className={iconSize.sm} />',
        },
        // Only height, no width
        {
          code: '<div className="h-4" />',
        },
        // Only width, no height
        {
          code: '<div className="w-4" />',
        },
        // Different sizes for h and w
        {
          code: '<div className="h-4 w-6" />',
        },
        // Responsive prefix should be skipped
        {
          code: '<div className="md:h-4 md:w-4" />',
        },
        // Inside SVG should be skipped
        {
          code: '<svg><rect className="h-4 w-4" /></svg>',
        },
      ],
      invalid: [
        {
          code: '<Icon className="h-4 w-4" />',
          errors: [
            {
              messageId: 'preferIconSize',
              data: { pattern: 'h-4 w-4', replacement: 'iconSize.sm' },
            },
          ],
        },
        {
          code: '<Icon className="h-5 w-5" />',
          errors: [
            {
              messageId: 'preferIconSize',
              data: { pattern: 'h-5 w-5', replacement: 'iconSize.md' },
            },
          ],
        },
        {
          code: '<Icon className="h-6 w-6" />',
          errors: [
            {
              messageId: 'preferIconSize',
              data: { pattern: 'h-6 w-6', replacement: 'iconSize.lg' },
            },
          ],
        },
        {
          code: '<Icon className="h-3 w-3 text-red-500" />',
          errors: [
            {
              messageId: 'preferIconSize',
              data: { pattern: 'h-3 w-3', replacement: 'iconSize.xs' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-radius Tests
// ============================================

describe('design-system/prefer-radius', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-radius', designSystemPlugin.rules['prefer-radius'], {
      valid: [
        // Already using design system utility
        {
          code: '<div className={radius.lg} />',
        },
        // Responsive prefix should be skipped
        {
          code: '<div className="sm:rounded-lg" />',
        },
        // Directional patterns should be skipped
        {
          code: '<div className="rounded-t-lg" />',
        },
        {
          code: '<div className="rounded-bl-lg" />',
        },
      ],
      invalid: [
        {
          code: '<div className="rounded-lg" />',
          errors: [
            {
              messageId: 'preferRadius',
              data: { pattern: 'rounded-lg', replacement: 'radius.lg' },
            },
          ],
        },
        {
          code: '<div className="rounded-full" />',
          errors: [
            {
              messageId: 'preferRadius',
              data: { pattern: 'rounded-full', replacement: 'radius.full' },
            },
          ],
        },
        {
          code: '<div className="rounded-xl border" />',
          errors: [
            {
              messageId: 'preferRadius',
              data: { pattern: 'rounded-xl', replacement: 'radius.xl' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-shadow Tests
// ============================================

describe('design-system/prefer-shadow', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-shadow', designSystemPlugin.rules['prefer-shadow'], {
      valid: [
        {
          code: '<div className={shadow.lg} />',
        },
        {
          code: '<div className="hover:shadow-lg" />',
        },
      ],
      invalid: [
        {
          code: '<div className="shadow-lg" />',
          errors: [
            {
              messageId: 'preferShadow',
              data: { pattern: 'shadow-lg', replacement: 'shadow.lg' },
            },
          ],
        },
        {
          code: '<div className="shadow-md" />',
          errors: [
            {
              messageId: 'preferShadow',
              data: { pattern: 'shadow-md', replacement: 'shadow.md' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-z-layer Tests
// ============================================

describe('design-system/prefer-z-layer', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-z-layer', designSystemPlugin.rules['prefer-z-layer'], {
      valid: [
        {
          code: '<div className={zLayer.modal} />',
        },
        {
          code: '<div className="md:z-50" />',
        },
      ],
      invalid: [
        {
          code: '<div className="z-50" />',
          errors: [
            {
              messageId: 'preferZLayer',
              data: { pattern: 'z-50', replacement: 'zLayer.modal' },
            },
          ],
        },
        {
          code: '<div className="z-10" />',
          errors: [
            {
              messageId: 'preferZLayer',
              data: { pattern: 'z-10', replacement: 'zLayer.raised' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-muted-text Tests
// ============================================

describe('design-system/prefer-muted-text', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-muted-text', designSystemPlugin.rules['prefer-muted-text'], {
      valid: [
        {
          code: '<p className={muted.default} />',
        },
        {
          code: '<p className="hover:text-muted-foreground" />',
        },
      ],
      invalid: [
        {
          code: '<p className="text-muted-foreground" />',
          errors: [
            {
              messageId: 'preferMutedText',
              data: { pattern: 'text-muted-foreground', replacement: 'muted.default' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-cursor Tests
// ============================================

describe('design-system/prefer-cursor', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-cursor', designSystemPlugin.rules['prefer-cursor'], {
      valid: [
        {
          code: '<button className={cursor.pointer} />',
        },
        {
          code: '<button className="disabled:cursor-not-allowed" />',
        },
      ],
      invalid: [
        {
          code: '<button className="cursor-pointer" />',
          errors: [
            {
              messageId: 'preferCursor',
              data: { pattern: 'cursor-pointer', replacement: 'cursor.pointer' },
            },
          ],
        },
        {
          code: '<button className="cursor-not-allowed" />',
          errors: [
            {
              messageId: 'preferCursor',
              data: { pattern: 'cursor-not-allowed', replacement: 'cursor.notAllowed' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-overflow Tests
// ============================================

describe('design-system/prefer-overflow', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-overflow', designSystemPlugin.rules['prefer-overflow'], {
      valid: [
        {
          code: '<div className={overflow.hidden} />',
        },
        {
          code: '<div className="sm:overflow-hidden" />',
        },
      ],
      invalid: [
        {
          code: '<div className="overflow-hidden" />',
          errors: [
            {
              messageId: 'preferOverflow',
              data: { pattern: 'overflow-hidden', replacement: 'overflow.hidden' },
            },
          ],
        },
        {
          code: '<div className="overflow-y-auto" />',
          errors: [
            {
              messageId: 'preferOverflow',
              data: { pattern: 'overflow-y-auto', replacement: 'overflow.yAuto' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-weight Tests
// ============================================

describe('design-system/prefer-weight', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-weight', designSystemPlugin.rules['prefer-weight'], {
      valid: [
        {
          code: '<span className={weight.bold} />',
        },
        {
          code: '<span className="hover:font-bold" />',
        },
      ],
      invalid: [
        {
          code: '<span className="font-bold" />',
          errors: [
            {
              messageId: 'preferWeight',
              data: { pattern: 'font-bold', replacement: 'weight.bold' },
            },
          ],
        },
        {
          code: '<span className="font-semibold" />',
          errors: [
            {
              messageId: 'preferWeight',
              data: { pattern: 'font-semibold', replacement: 'weight.semibold' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-animate Tests
// ============================================

describe('design-system/prefer-animate', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-animate', designSystemPlugin.rules['prefer-animate'], {
      valid: [
        {
          code: '<div className={animate.spin} />',
        },
      ],
      invalid: [
        {
          code: '<div className="animate-spin" />',
          errors: [
            {
              messageId: 'preferAnimate',
              data: { pattern: 'animate-spin', replacement: 'animate.spin' },
            },
          ],
        },
        {
          code: '<div className="animate-pulse" />',
          errors: [
            {
              messageId: 'preferAnimate',
              data: { pattern: 'animate-pulse', replacement: 'animate.pulse' },
            },
          ],
        },
      ],
    });
  });
});

// ============================================
// prefer-pointer-events Tests
// ============================================

describe('design-system/prefer-pointer-events', () => {
  it('should pass all test cases', () => {
    ruleTester.run('prefer-pointer-events', designSystemPlugin.rules['prefer-pointer-events'], {
      valid: [
        {
          code: '<div className={pointerEvents.none} />',
        },
      ],
      invalid: [
        {
          code: '<div className="pointer-events-none" />',
          errors: [
            {
              messageId: 'preferPointerEvents',
              data: { pattern: 'pointer-events-none', replacement: 'pointerEvents.none' },
            },
          ],
        },
      ],
    });
  });
});
