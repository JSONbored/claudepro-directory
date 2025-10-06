/**
 * Umami Analytics utilities
 * Provides Umami availability check
 */

/**
 * Check if we're in a browser environment and Umami is loaded
 */
export const isUmamiAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.umami !== 'undefined';
};
