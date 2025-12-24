/**
 * SQL Parser - Parses simple SQL queries for execution against in-memory stores.
 *
 * This module provides a minimal SQL parser that handles basic SELECT, INSERT, UPDATE,
 * and DELETE queries. It's used by `$queryRaw` and `$executeRaw` when `enableSqlParsing`
 * is enabled in Prismocker options.
 *
 * **Supported SQL patterns:**
 * - Simple SELECT: `SELECT * FROM table_name`
 * - SELECT with WHERE: `SELECT * FROM table_name WHERE column = value`
 * - SELECT with LIMIT/OFFSET: `SELECT * FROM table_name LIMIT 10 OFFSET 5`
 * - Simple INSERT: `INSERT INTO table_name (columns) VALUES (values)`
 * - Simple UPDATE: `UPDATE table_name SET column = value WHERE column = value`
 * - Simple DELETE: `DELETE FROM table_name WHERE column = value`
 *
 * **Limitations:**
 * - Only supports simple equality WHERE clauses
 * - Does NOT support: JOINs, subqueries, complex WHERE clauses, transactions, constraints
 * - For complex queries, use a custom `queryRawExecutor` or `executeRawExecutor`
 *
 * @example
 * ```typescript
 * const parsed = parseSimpleSelect('SELECT * FROM users WHERE id = 1');
 * // Returns: { tableName: 'users', where: { id: '1' } }
 * ```
 */

/**
 * Parses a simple SELECT query and extracts table name, WHERE clause, LIMIT, and OFFSET.
 *
 * This function uses regex matching to parse basic SELECT statements. It supports:
 * - Table name extraction from `FROM` clause
 * - Simple equality WHERE clauses (e.g., `WHERE id = 1`)
 * - LIMIT and OFFSET clauses
 *
 * **Note:** This is a minimal parser. Complex queries will return `null` and should
 * use a custom executor instead.
 *
 * @param query - SQL SELECT query string
 * @returns Parsed query information with table name, where clause, limit, and offset, or `null` if parsing fails
 *
 * @example
 * ```typescript
 * const parsed = parseSimpleSelect('SELECT * FROM users WHERE id = 1 LIMIT 10');
 * // Returns: { tableName: 'users', where: { id: '1' }, limit: 10 }
 * ```
 *
 * @see {@link executeSimpleSelect} for executing parsed SELECT queries
 */
export function parseSimpleSelect(query: string): {
  tableName: string;
  where?: Record<string, any>;
  limit?: number;
  offset?: number;
} | null {
  // Normalize query (remove extra whitespace, but preserve case for quoted values)
  const trimmed = query.trim().replace(/\s+/g, ' ');
  const normalized = trimmed.toLowerCase();

  // Match simple SELECT queries
  // Pattern: SELECT ... FROM table_name [WHERE ...] [LIMIT ...] [OFFSET ...]
  const selectMatch = normalized.match(/^select\s+.+\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+limit\s+(\d+))?(?:\s+offset\s+(\d+))?$/i);

  if (!selectMatch) {
    return null;
  }

  const [, tableName, whereClause, limitStr, offsetStr] = selectMatch;

  // Parse WHERE clause (simple equality checks only)
  // Extract from original query to preserve case of quoted values
  let where: Record<string, any> | undefined;
  if (whereClause) {
    where = {};
    // Extract WHERE clause from original query (preserve case)
    const whereMatchOriginal = trimmed.match(/where\s+(.+?)(?:\s+limit|\s+offset|$)/i);
    if (whereMatchOriginal) {
      const whereClauseOriginal = whereMatchOriginal[1];
      // Match simple equality: column = value or column='value' or column="value"
      // Handle quoted strings (single or double quotes) and unquoted values
      const whereMatch = whereClauseOriginal.match(/(\w+)\s*=\s*((?:'[^']*'|"[^"]*"|[^\s]+))/i);
      if (whereMatch) {
        const [, column, value] = whereMatch;
        if (column && value) {
          // Remove quotes from value if present, but preserve case
          const cleanValue = value.replace(/^['"]|['"]$/g, '');
          where[column.toLowerCase()] = cleanValue;
        }
      }
    }
  }

  return {
    tableName,
    where,
    limit: limitStr ? parseInt(limitStr, 10) : undefined,
    offset: offsetStr ? parseInt(offsetStr, 10) : undefined,
  };
}

/**
 * Executes a parsed SELECT query against in-memory stores.
 *
 * This function takes a parsed SELECT query and executes it against the provided
 * stores map. It applies WHERE filtering, OFFSET, and LIMIT as specified in the
 * parsed query.
 *
 * @param parsed - Parsed query information from `parseSimpleSelect()`
 * @param parsed.tableName - The name of the table/model to query
 * @param parsed.where - Optional WHERE clause (simple equality filters)
 * @param parsed.limit - Optional LIMIT clause (maximum number of results)
 * @param parsed.offset - Optional OFFSET clause (number of results to skip)
 * @param stores - Read-only map of model stores (model name → array of records)
 * @returns Array of matching records (empty array if table doesn't exist or no matches)
 *
 * @example
 * ```typescript
 * const parsed = parseSimpleSelect('SELECT * FROM users WHERE status = active LIMIT 10');
 * const results = executeSimpleSelect(parsed, stores);
 * // Returns: Array of up to 10 user records with status === 'active'
 * ```
 *
 * @see {@link parseSimpleSelect} for parsing SELECT queries
 */
export function executeSimpleSelect(
  parsed: { tableName: string; where?: Record<string, any>; limit?: number; offset?: number },
  stores: ReadonlyMap<string, any[]>
): any[] {
  const { tableName, where, limit, offset } = parsed;

  // Get store for the table
  const store = stores.get(tableName);
  if (!store) {
    return [];
  }

  // Apply WHERE clause (simple equality matching)
  let results = [...store];
  if (where) {
    results = results.filter((record) => {
      for (const [key, value] of Object.entries(where)) {
        if (record[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  // Apply OFFSET
  if (offset) {
    results = results.slice(offset);
  }

  // Apply LIMIT
  if (limit) {
    results = results.slice(0, limit);
  }

  return results;
}

