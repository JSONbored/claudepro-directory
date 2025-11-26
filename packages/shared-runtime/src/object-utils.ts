/**
 * Object Utilities
 * Shared utilities for safely accessing object properties
 */

/**
 * Safely get a property from an unknown object
 * Uses Object.getOwnPropertyDescriptor to safely access properties
 * without triggering getters or accessing prototype chain
 *
 * @param obj - The object to get the property from
 * @param key - The property key to access
 * @returns The property value, or undefined if not found or obj is not an object
 *
 * @example
 * ```ts
 * const value = getProperty(someUnknownObject, 'someKey');
 * if (typeof value === 'string') {
 *   // TypeScript knows value is string here
 * }
 * ```
 */
export function getProperty(obj: unknown, key: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc?.value;
}
