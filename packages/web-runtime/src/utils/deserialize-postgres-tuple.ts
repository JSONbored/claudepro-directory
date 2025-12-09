/**
 * Utility to deserialize PostgreSQL tuple strings
 *
 * PostgreSQL composite types can sometimes be serialized as tuple strings
 * like: (ghost,"","","","",{},t,t,"2025-10-10 02:48:44.548772+00")
 *
 * This utility extracts the first field (typically display_name) from such tuples.
 */

/**
 * Extracts the first field from a PostgreSQL tuple string
 *
 * @param tupleString - The tuple string like (value,"","",...)
 * @returns The first field value, or null if parsing fails
 *
 * @example
 * extractFirstFieldFromTuple('(ghost,"","","","",{},t,t,"2025-10-10 02:48:44.548772+00")')
 * // Returns: 'ghost'
 */
export function extractFirstFieldFromTuple(tupleString: string): string | null {
  if (!tupleString || typeof tupleString !== 'string') {
    return null;
  }

  // Must start with '(' and contain at least one comma
  if (!tupleString.startsWith('(') || !tupleString.includes(',')) {
    return null;
  }

  // Remove the opening parenthesis
  const withoutOpening = tupleString.slice(1);

  // Find the first comma that's not inside quotes
  let inQuotes = false;
  let escapeNext = false;
  let firstFieldEnd = -1;

  for (let i = 0; i < withoutOpening.length; i++) {
    const char = withoutOpening[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === ',') {
      firstFieldEnd = i;
      break;
    }
  }

  if (firstFieldEnd === -1) {
    // No comma found (shouldn't happen for valid tuples, but handle gracefully)
    return null;
  }

  // Extract the first field
  const firstField = withoutOpening.slice(0, firstFieldEnd).trim();

  // Remove surrounding quotes if present
  if (firstField.startsWith('"') && firstField.endsWith('"')) {
    return firstField.slice(1, -1);
  }

  return firstField;
}

/**
 * Checks if a value is a PostgreSQL tuple string
 *
 * @param value - The value to check
 * @returns True if the value appears to be a tuple string
 */
export function isPostgresTupleString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('(') &&
    value.includes(',') &&
    value.length > 2
  );
}
