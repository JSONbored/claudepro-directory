/**
 * FormData Utility Functions
 *
 * Type-safe FormData extraction utilities that eliminate the need for type assertions.
 * These functions properly handle null/undefined values and provide type safety.
 */

/**
 * Safely extract a string value from FormData.
 * Returns null if the value is missing, not a string, or empty.
 *
 * @param formData - The FormData object
 * @param key - The form field key
 * @returns The string value or null
 *
 * @example
 * ```typescript
 * const name = getFormDataString(formData, 'name') ?? 'Unknown';
 * ```
 */
export function getFormDataString(
  formData: FormData,
  key: string
): string | null {
  const value = formData.get(key);
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  // FormData.get can return File objects, but we only want strings
  return null;
}

/**
 * Safely extract a required string value from FormData.
 * Throws an error if the value is missing or not a string.
 *
 * @param formData - The FormData object
 * @param key - The form field key
 * @returns The string value (never null)
 * @throws Error if value is missing or not a string
 *
 * @example
 * ```typescript
 * const name = getFormDataStringRequired(formData, 'name');
 * ```
 */
export function getFormDataStringRequired(
  formData: FormData,
  key: string
): string {
  const value = getFormDataString(formData, key);
  if (value === null) {
    throw new Error(`Required form field '${key}' is missing or empty`);
  }
  return value;
}

/**
 * Safely extract an enum value from FormData using a type guard.
 * Returns null if the value is missing, not a string, or doesn't pass the validator.
 *
 * @param formData - The FormData object
 * @param key - The form field key
 * @param validator - Type guard function that validates the value
 * @returns The validated enum value or null
 *
 * @example
 * ```typescript
 * const workplace = getFormDataEnum(
 *   formData,
 *   'workplace',
 *   isWorkplaceType
 * ) ?? 'remote';
 * ```
 */
export function getFormDataEnum<T extends string>(
  formData: FormData,
  key: string,
  validator: (value: unknown) => value is T
): T | null {
  const value = formData.get(key);
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' && validator(value)) {
    return value;
  }
  return null;
}

/**
 * Safely extract a boolean value from FormData.
 * Returns true if the value is 'on' or 'true', false otherwise.
 *
 * @param formData - The FormData object
 * @param key - The form field key
 * @returns The boolean value
 *
 * @example
 * ```typescript
 * const isRemote = getFormDataBoolean(formData, 'remote');
 * ```
 */
export function getFormDataBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === 'on' || value === 'true';
}

/**
 * Safely extract a number value from FormData.
 * Returns null if the value is missing, not a valid number, or empty.
 *
 * @param formData - The FormData object
 * @param key - The form field key
 * @returns The number value or null
 *
 * @example
 * ```typescript
 * const limit = getFormDataNumber(formData, 'limit') ?? 10;
 * ```
 */
export function getFormDataNumber(formData: FormData, key: string): number | null {
  const value = getFormDataString(formData, key);
  if (value === null) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}
