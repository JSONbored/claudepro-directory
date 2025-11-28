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

/**
 * Safely get a string property from an unknown object
 * Uses Object.getOwnPropertyDescriptor to safely access properties
 * without triggering getters or accessing prototype chain
 *
 * @param obj - The object to get the property from
 * @param key - The property key to access
 * @returns The property value as a string, or undefined if not found, not an object, or not a string
 *
 * @example
 * ```ts
 * const value = getStringProperty(someUnknownObject, 'someKey');
 * if (value !== undefined) {
 *   // TypeScript knows value is string here
 * }
 * ```
 */
export function getStringProperty(obj: unknown, key: string): string | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  if (desc && typeof desc.value === 'string') {
    return desc.value;
  }
  return undefined;
}

/**
 * Safely get a number property from an unknown object
 * Uses Object.getOwnPropertyDescriptor to safely access properties
 * without triggering getters or accessing prototype chain
 *
 * @param obj - The object to get the property from
 * @param key - The property key to access
 * @returns The property value as a number, or undefined if not found, not an object, or not a number
 *
 * @example
 * ```ts
 * const value = getNumberProperty(someUnknownObject, 'someKey');
 * if (value !== undefined) {
 *   // TypeScript knows value is number here
 * }
 * ```
 */
export function getNumberProperty(obj: unknown, key: string): number | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  if (desc && typeof desc.value === 'number') {
    return desc.value;
  }
  return undefined;
}

/**
 * Safely get an object property from an unknown object
 * Uses Object.getOwnPropertyDescriptor to safely access properties
 * without triggering getters or accessing prototype chain
 *
 * @param obj - The object to get the property from
 * @param key - The property key to access
 * @returns The property value as an object, or undefined if not found, not an object, or not an object value
 *
 * @example
 * ```ts
 * const value = getObjectProperty(someUnknownObject, 'someKey');
 * if (value !== undefined) {
 *   // TypeScript knows value is an object here
 * }
 * ```
 */
export function getObjectProperty(obj: unknown, key: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  if (desc && typeof desc.value === 'object' && desc.value !== null) {
    return desc.value;
  }
  return undefined;
}
