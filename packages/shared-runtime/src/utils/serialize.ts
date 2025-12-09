/**
 * Serialization Utilities
 * 
 * Provides utilities for safely serializing data to plain objects that can be
 * passed to Client Components or returned from API routes.
 * 
 * **Key Principle:**
 * - Client Components can only receive plain objects (no classes, no Date objects)
 * - API routes should return serializable data
 * - Use these utilities to ensure compatibility
 * 
 * @module shared-runtime/utils/serialize
 */

/**
 * Replacer function for JSON.stringify that handles non-serializable values.
 * 
 * Converts:
 * - Date objects → ISO strings
 * - undefined → null (or omits if in array)
 * - Functions → undefined (omitted)
 * - Other non-serializable values → safe representations
 * 
 * @param _key - The object key (unused, but required by JSON.stringify signature)
 * @param value - The value to serialize
 * @returns A serializable value
 * 
 * @example
 * ```typescript
 * const serialized = JSON.stringify(data, serializeReplacer);
 * ```
 */
export function serializeReplacer(_key: string, value: unknown): unknown {
  // Convert Date objects to ISO strings
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Remove undefined values (JSON.stringify omits them, but we want to be explicit)
  // Note: In arrays, undefined becomes null. In objects, it's omitted.
  if (value === undefined) {
    return null;
  }

  // Remove functions (not serializable)
  if (typeof value === 'function') {
    return undefined;
  }

  // Return other values as-is (JSON.stringify handles most cases)
  return value;
}

/**
 * Serialize data to plain objects for Client Component compatibility.
 * 
 * This function:
 * - Converts Date objects to ISO strings
 * - Removes functions and non-serializable values
 * - Ensures all objects are plain (no classes, no null prototypes)
 * - Handles nested objects and arrays
 * 
 * **Use this when:**
 * - Passing data from Server Components to Client Components
 * - Returning data from API routes
 * - Ensuring data is serializable for Next.js build/prerender
 * 
 * @param data - The data to serialize
 * @returns A deeply serialized plain object
 * 
 * @example
 * ```typescript
 * import { serializeForClient } from '@heyclaude/shared-runtime/utils/serialize';
 * 
 * async function MyServerComponent() {
 *   const data = await fetchData(); // May contain Date objects
 *   const serialized = serializeForClient(data);
 *   return <ClientComponent data={serialized} />;
 * }
 * ```
 */
export function serializeForClient<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, serializeReplacer)) as T;
}

/**
 * Serialize data with custom replacer function.
 * 
 * Allows custom handling of specific value types during serialization.
 * 
 * @param data - The data to serialize
 * @param customReplacer - Custom replacer function (merged with default replacer)
 * @returns A deeply serialized plain object
 * 
 * @example
 * ```typescript
 * import { serializeWithReplacer } from '@heyclaude/shared-runtime/utils/serialize';
 * 
 * const serialized = serializeWithReplacer(data, (key, value) => {
 *   if (key === 'sensitive') return '[REDACTED]';
 *   return serializeReplacer(key, value);
 * });
 * ```
 */
export function serializeWithReplacer<T>(
  data: T,
  customReplacer?: (key: string, value: unknown) => unknown
): T {
  const combinedReplacer = (key: string, value: unknown): unknown => {
    // First apply custom replacer if provided
    if (customReplacer) {
      const customResult = customReplacer(key, value);
      // If custom replacer returns undefined, use default
      if (customResult === undefined && value !== undefined) {
        return serializeReplacer(key, value);
      }
      return customResult;
    }
    // Otherwise use default replacer
    return serializeReplacer(key, value);
  };

  return JSON.parse(JSON.stringify(data, combinedReplacer)) as T;
}

/**
 * Type guard to check if a value is a plain object (not a class instance).
 * 
 * @param value - The value to check
 * @returns true if the value is a plain object
 * 
 * @example
 * ```typescript
 * import { isPlainObject } from '@heyclaude/shared-runtime/utils/serialize';
 * 
 * if (isPlainObject(data)) {
 *   // Safe to pass to Client Component
 * }
 * ```
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  // Check if it's a plain object (not a class instance)
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Check if data is already serializable (safe for Client Components).
 * 
 * @param data - The data to check
 * @returns true if the data is serializable
 * 
 * @example
 * ```typescript
 * import { isSerializable } from '@heyclaude/shared-runtime/utils/serialize';
 * 
 * if (!isSerializable(data)) {
 *   data = serializeForClient(data);
 * }
 * ```
 */
export function isSerializable(data: unknown): boolean {
  try {
    // Try to serialize - if it works, it's serializable
    JSON.stringify(data, serializeReplacer);
    return true;
  } catch {
    return false;
  }
}
