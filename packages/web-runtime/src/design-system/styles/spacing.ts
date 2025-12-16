/**
 * Spacing Utilities
 * Semantic spacing patterns using Tailwind classes
 * 
 * Maps to SPACING design tokens.
 * Provides semantic names for margin, padding, and space utilities.
 */

export const marginBottom = {
  zero: 'mb-0',          // 0rem = 0px
  micro: 'mb-0.5',      // 0.125rem = 2px
  tight: 'mb-1',         // 0.25rem = 4px
  '1.5': 'mb-1.5',       // 0.375rem = 6px (common pattern found in codebase)
  compact: 'mb-2',       // 0.5rem = 8px
  default: 'mb-4',       // 1rem = 16px
  '4.5': 'mb-4.5',       // 1.125rem = 18px (common pattern found in codebase)
  '5': 'mb-5',           // 1.25rem = 20px (unmapped value found in codebase)
  comfortable: 'mb-6',   // 1.5rem = 24px
  '7': 'mb-7',           // 1.75rem = 28px (unmapped value found in codebase)
  relaxed: 'mb-8',       // 2rem = 32px
  loose: 'mb-12',        // 3rem = 48px
  section: 'mb-12',      // 3rem = 48px
  hero: 'mb-16',         // 4rem = 64px
  px: 'mb-px',           // 1px (if found in codebase)
  py: 'mb-py',           // Padding Y (if found in codebase)
} as const satisfies Record<string, string>;

export const marginTop = {
  zero: 'mt-0',
  micro: 'mt-0.5',
  tight: 'mt-1',
  compact: 'mt-2',
  default: 'mt-4',
  '4.5': 'mt-4.5',       // 1.125rem = 18px (common pattern found in codebase)
  '5': 'mt-5',           // 1.25rem = 20px (unmapped value found in codebase)
  comfortable: 'mt-6',
  relaxed: 'mt-8',
  loose: 'mt-12',        // 3rem = 48px (matches marginBottom.loose)
  section: 'mt-12',      // 3rem = 48px (matches marginBottom.section)
  px: 'mt-px',           // 1px (if found in codebase)
  py: 'mt-py',           // Padding Y (if found in codebase)
} as const;

export const spaceY = {
  tight: 'space-y-1',
  '1.5': 'space-y-1.5', // 0.375rem = 6px (common pattern found in codebase)
  compact: 'space-y-2',
  default: 'space-y-3',
  comfortable: 'space-y-4',
  relaxed: 'space-y-6',
  loose: 'space-y-8',
  hero: 'space-y-16',   // 4rem = 64px (matches marginBottom.hero)
} as const;

export const spaceX = {
  tight: 'space-x-1',
  compact: 'space-x-2',
  default: 'space-x-3',
  comfortable: 'space-x-4',
  relaxed: 'space-x-6',
} as const;

export const padding = {
  micro: 'p-1',
  tight: 'p-2',
  compact: 'p-3',
  default: 'p-4',
  comfortable: 'p-6',
  relaxed: 'p-8',
  section: 'p-12',
} as const;

export const paddingX = {
  micro: 'px-1',
  '1.5': 'px-1.5', // 0.375rem = 6px (common pattern found in codebase)
  tight: 'px-2',
  '2.5': 'px-2.5', // 0.625rem = 10px (common pattern found in codebase)
  compact: 'px-3',
  default: 'px-4',
  '5': 'px-5',     // 1.25rem = 20px (common pattern found in codebase)
  comfortable: 'px-6',
  relaxed: 'px-8',
} as const satisfies Record<string, string>;

export const paddingY = {
  zero: 'py-0',          // 0rem = 0px
  micro: 'py-1',
  '1.5': 'py-1.5', // 0.375rem = 6px (common pattern found in codebase)
  tight: 'py-2',
  '2.5': 'py-2.5', // 0.625rem = 10px (common pattern found in codebase)
  compact: 'py-3',
  default: 'py-4',
  '5': 'py-5',     // 1.25rem = 20px (common pattern found in codebase)
  comfortable: 'py-6',
  relaxed: 'py-8',
  section: 'py-12',
} as const satisfies Record<string, string>;

export const paddingTop = {
  micro: 'pt-1',
  tight: 'pt-2',
  compact: 'pt-3',
  default: 'pt-4',
  comfortable: 'pt-6',
  relaxed: 'pt-8',
  hero: 'pt-16',        // 4rem = 64px (hero section base)
  heroLarge: 'pt-20',  // 5rem = 80px (hero section sm breakpoint)
  heroXLarge: 'pt-28', // 7rem = 112px (hero section lg breakpoint)
} as const;

export const paddingBottom = {
  micro: 'pb-1',
  tight: 'pb-2',
  compact: 'pb-3',
  default: 'pb-4',
  comfortable: 'pb-6',
  relaxed: 'pb-8',
  hero: 'pb-12',       // 3rem = 48px (hero section base)
  heroLarge: 'pb-16',  // 4rem = 64px (hero section sm breakpoint)
  heroXLarge: 'pb-20', // 5rem = 80px (hero section lg breakpoint)
} as const;

export const paddingLeft = {
  micro: 'pl-1',
  tight: 'pl-2',
  compact: 'pl-3',
  default: 'pl-4',
  comfortable: 'pl-6',
  relaxed: 'pl-8',
} as const;

export const paddingRight = {
  micro: 'pr-1',
  tight: 'pr-2',
  compact: 'pr-3',
  default: 'pr-4',
  comfortable: 'pr-6',
  relaxed: 'pr-8',
} as const;

export const marginX = {
  micro: 'mx-1',
  tight: 'mx-2',
  compact: 'mx-3',
  default: 'mx-4',
  comfortable: 'mx-6',
  relaxed: 'mx-8',
  auto: 'mx-auto',
} as const;

export const marginY = {
  micro: 'my-1',
  tight: 'my-2',
  compact: 'my-3',
  default: 'my-4',
  comfortable: 'my-6',
  relaxed: 'my-8',
} as const;

export const marginLeft = {
  micro: 'ml-1',
  tight: 'ml-2',
  compact: 'ml-3',
  default: 'ml-4',
  comfortable: 'ml-6',
  relaxed: 'ml-8',
  auto: 'ml-auto',
} as const;

export const marginRight = {
  micro: 'mr-1',
  tight: 'mr-2',
  compact: 'mr-3',
  default: 'mr-4',
  comfortable: 'mr-6',
  relaxed: 'mr-8',
  auto: 'mr-auto',
} as const;
