/**
 * Radix UI Type and Utility Re-exports
 *
 * Re-exports types and utilities from Radix UI packages for use in apps/web.
 * This allows apps/web to import these without directly depending on Radix packages.
 */

// Re-export CheckedState type from react-checkbox
export type { CheckedState } from '@radix-ui/react-checkbox';

// Re-export useControllableState hook from react-use-controllable-state
export { useControllableState } from '@radix-ui/react-use-controllable-state';

// Re-export Portal primitive from react-portal
export * as PortalPrimitive from '@radix-ui/react-portal';

