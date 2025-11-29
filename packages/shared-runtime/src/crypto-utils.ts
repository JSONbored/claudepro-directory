/**
 * Timing-safe string comparison to prevent timing attacks
 * Uses constant-time comparison by XORing all character codes
 * 
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 * 
 * @remarks
 * This function performs a constant-time comparison to prevent timing attacks.
 * It returns false immediately if the lengths differ, then compares all characters
 * using XOR to ensure the comparison takes the same amount of time regardless of
 * where the first difference occurs.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    // Use charCodeAt for timing-safe comparison: JavaScript strings are UTF-16
    // code units, and charCodeAt provides consistent execution time for constant-time comparison
    // We compare UTF-16 code units (not code points) to maintain constant-time execution
    // eslint-disable-next-line unicorn/prefer-code-point
    const codeUnitA = a.charCodeAt(i);
    // eslint-disable-next-line unicorn/prefer-code-point
    const codeUnitB = b.charCodeAt(i);
    result |= codeUnitA ^ codeUnitB;
  }

  return result === 0;
}
