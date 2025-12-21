/**
 * Database introspection for PostgreSQL functions and composite types
 *
 * Uses direct PostgreSQL client connection for better Prisma integration.
 */

import { Client } from 'pg';

import type { CompositeTypeAttribute, FunctionMeta } from '../toolkit/introspection.ts';

export interface DatabaseMetadata {
  functions: Record<string, FunctionMeta>;
  compositeTypes: Record<string, CompositeTypeAttribute[]>;
  enums: Record<string, string[]>;
  /** Function-specific return structures for SETOF record functions */
  functionReturnStructures: Record<string, CompositeTypeAttribute[]>;
}

/**
 * Introspect PostgreSQL database for functions and composite types
 *
 * Uses direct PostgreSQL client connection for better error handling
 * and Prisma integration.
 */
/**
 * Validate PostgreSQL connection string format
 */
function validateConnectionString(connectionString: string): { valid: boolean; error?: string } {
  if (!connectionString || typeof connectionString !== 'string') {
    return { valid: false, error: 'Connection string must be a non-empty string' };
  }

  // Check for basic PostgreSQL connection string format
  // Supports: postgresql://, postgres://, pgsql://
  const postgresPattern = /^(postgresql|postgres|pgsql):\/\//i;
  if (!postgresPattern.test(connectionString)) {
    return {
      valid: false,
      error: 'Connection string must start with postgresql://, postgres://, or pgsql://',
    };
  }

  // Check for required components (basic validation)
  try {
    const url = new URL(connectionString.replace(/^(postgresql|postgres|pgsql):/i, 'https:'));
    if (!url.hostname) {
      return { valid: false, error: 'Connection string must include a hostname' };
    }
    if (!url.pathname || url.pathname === '/') {
      // Database name is optional in some cases, but warn
      // Most Supabase connections include database name
    }
  } catch {
    return { valid: false, error: 'Connection string is not a valid URL format' };
  }

  return { valid: true };
}

export async function introspectDatabase(
  connectionString: string,
  schema: string = 'public'
): Promise<DatabaseMetadata> {
  // Validate connection string before attempting connection
  const validation = validateConnectionString(connectionString);
  if (!validation.valid) {
    throw new Error(
      `Invalid connection string: ${validation.error}. ` +
        `Please check your DIRECT_URL or POSTGRES_PRISMA_URL environment variable. ` +
        `Expected format: postgresql://user:password@host:port/database`
    );
  }

  // Configure SSL for Supabase connections
  // Supabase ALWAYS requires SSL connections, even in development/build
  // Supabase uses self-signed certificates, so we must set rejectUnauthorized: false
  // This matches the pattern used in packages/data-layer/src/prisma/client.ts
  //
  // Use connection string as-is (Supabase connection strings include sslmode=require)
  // The pg Client will use the ssl config we provide, and sslmode in the URL is fine

  // Create pg Client with SSL configuration
  // Always enable SSL for Supabase (required for all connections)
  // Add connection timeout and better error handling
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }, // Accept self-signed certificates (Supabase uses self-signed certs)
    connectionTimeoutMillis: 10000, // 10 second connection timeout
  });

  try {
    await client.connect();

    const query = `
WITH enums AS (
  SELECT
    t.typname,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = $1
  GROUP BY t.typname
),
functions_agg AS (
  SELECT
    r.routine_name,
    r.specific_name,
    json_build_object(
      'name', r.routine_name,
      'returnType', COALESCE(
        -- Try to get return type from pg_proc for better SETOF handling
        (
          SELECT 
            CASE 
              WHEN p.prorettype = 'pg_catalog.void'::regtype THEN 'void'
              WHEN p.proretset THEN '_' || format_type(p.prorettype, NULL)
              ELSE format_type(p.prorettype, NULL)
            END
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = $1
            AND p.proname = r.routine_name
            AND (
              -- Match by specific_name (more reliable than parameter count)
              EXISTS (
                SELECT 1 
                FROM information_schema.parameters p2 
                WHERE p2.specific_name = r.specific_name
                LIMIT 1
              )
            )
          ORDER BY p.oid
          LIMIT 1
        ),
        -- Fallback to information_schema (simpler, more reliable)
        -- FIX: Also check pg_proc.proretset directly as fallback for SETOF detection
        COALESCE(
          (
            SELECT 
              CASE 
                WHEN p.prorettype = 'pg_catalog.void'::regtype THEN 'void'
                WHEN p.proretset THEN '_' || format_type(p.prorettype, NULL)
                ELSE format_type(p.prorettype, NULL)
              END
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = $1
              AND p.proname = r.routine_name
            ORDER BY p.oid
            LIMIT 1
          ),
          -- Final fallback to information_schema
          CASE 
            WHEN r.data_type = 'USER-DEFINED' THEN COALESCE(r.type_udt_name, 'void')
            WHEN r.data_type = 'SETOF' THEN '_' || COALESCE(r.type_udt_name, 'record')
            WHEN r.type_udt_name IS NULL THEN 'void'
            ELSE r.type_udt_name
          END
        )
      ),
      'args', COALESCE(
        (
          -- Use pg_proc to correctly detect function parameter defaults
          -- information_schema.parameters.parameter_default is unreliable for functions
          -- pg_proc.proargdefaults contains OIDs of default expressions for parameters with defaults
          -- Parameters with defaults are always the LAST N parameters, where N = array_length(proargdefaults)
          WITH proc_info AS (
            SELECT 
              p.pronargs,
              -- Count DEFAULT keywords in function arguments string
              -- pg_get_function_arguments returns the full signature including defaults
              -- We count occurrences of 'DEFAULT' to determine how many parameters have defaults
              COALESCE(
                (length(pg_get_function_arguments(p.oid)) - length(replace(pg_get_function_arguments(p.oid), 'DEFAULT', ''))) / length('DEFAULT'),
                0
              ) as num_defaults
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = $1
              AND p.proname = r.routine_name
              AND EXISTS (
                SELECT 1 
                FROM information_schema.parameters p2 
                WHERE p2.specific_name = r.specific_name
                LIMIT 1
              )
            ORDER BY p.oid
            LIMIT 1
          ),
          param_info AS (
            SELECT 
              p.parameter_name,
              p.parameter_mode,
              p.data_type,
              p.udt_name,
              p.ordinal_position,
              -- Determine if parameter has default:
              -- Parameters with defaults are the last N parameters where N = num_defaults
              -- Formula: parameter has default if ordinal_position > (pronargs - num_defaults)
              -- Example: 5 params, 2 defaults -> positions 4 and 5 have defaults
              --          position 4 > (5 - 2) = 4 > 3 = true ✓
              CASE 
                WHEN pi.num_defaults IS NULL OR pi.num_defaults = 0 THEN false
                ELSE p.ordinal_position > (pi.pronargs - pi.num_defaults)
              END as has_default
            FROM information_schema.parameters p
            CROSS JOIN proc_info pi
            WHERE p.specific_name = r.specific_name
              AND p.parameter_mode IN ('IN', 'INOUT')
          )
          SELECT json_agg(
            json_build_object(
              'name', parameter_name,
              'mode', parameter_mode,
              'type', data_type,
              'udtName', udt_name,
              'ordinal', ordinal_position,
              'hasDefault', has_default
            ) ORDER BY ordinal_position
          )
          FROM param_info
        ),
        '[]'::json
      )
    ) as func_meta
  FROM information_schema.routines r
  WHERE r.routine_schema = $1
    AND r.routine_type = 'FUNCTION'
  GROUP BY r.routine_name, r.type_udt_name, r.data_type, r.specific_name
),
composite_types_agg AS (
  SELECT
    t.typname,
    json_agg(
      json_build_object(
        'name', a.attname,
        'udtName', rt.typname,
        'nullable', NOT a.attnotnull,
        'ordinal', a.attnum
      ) ORDER BY a.attnum
    ) as attributes
  FROM pg_type t
  JOIN pg_attribute a ON a.attrelid = t.typrelid
  JOIN pg_type rt ON a.atttypid = rt.oid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = $1
    AND t.typtype = 'c'
    AND a.attnum > 0
  GROUP BY t.typname
)
SELECT
  json_build_object(
    'enums', COALESCE((SELECT json_object_agg(typname, values) FROM enums), '{}'::json),
    'functions', COALESCE((SELECT json_object_agg(routine_name, func_meta) FROM functions_agg), '{}'::json),
    'compositeTypes', COALESCE((SELECT json_object_agg(typname, attributes) FROM composite_types_agg), '{}'::json)
  )::text as result
`;

    const result = await client.query(query, [schema]);
    const metadata = JSON.parse(result.rows[0]?.result || '{}') as {
      enums: Record<string, string[]>;
      functions: Record<string, FunctionMeta>;
      compositeTypes: Record<string, CompositeTypeAttribute[]>;
    };

    /**
     * Strip schema prefix from type name
     */
    function stripSchemaPrefix(typeName: string): string {
      if (!typeName) return typeName;
      let cleaned = typeName.replace(/["']/g, '');
      const schemaMatch = cleaned.match(/^[a-z_][a-z0-9_]*\.([a-z_][a-z0-9_]*)$/i);
      return schemaMatch && schemaMatch[1] ? schemaMatch[1] : cleaned;
    }

    // Introspect SETOF record functions to get actual return structure
    // OPTIMIZATION: Process in parallel batches for better performance
    const functionReturnStructures: Record<string, CompositeTypeAttribute[]> = {};

    // Collect all SETOF record functions first
    const setofFunctions: Array<[string, FunctionMeta]> = [];
    for (const [functionName, functionMeta] of Object.entries(metadata.functions || {})) {
      const returnType = functionMeta.returnType || '';
      // Detect SETOF record (dynamic return structure)
      const baseReturnType = returnType.startsWith('_')
        ? stripSchemaPrefix(returnType.slice(1))
        : stripSchemaPrefix(returnType);

      const isRecordType =
        baseReturnType === 'record' || baseReturnType.toLowerCase() === 'pg_catalog.record';

      if (isRecordType) {
        setofFunctions.push([functionName, functionMeta]);
      }
    }

    // Process SETOF functions in parallel batches (with concurrency limit)
    // Note: We use a single client connection, but PostgreSQL can handle concurrent queries
    // We limit concurrency to avoid overwhelming the connection
    const CONCURRENCY_LIMIT = 5;
    const batches: Array<Array<[string, FunctionMeta]>> = [];
    for (let i = 0; i < setofFunctions.length; i += CONCURRENCY_LIMIT) {
      batches.push(setofFunctions.slice(i, i + CONCURRENCY_LIMIT));
    }

    // Process each batch in parallel
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async ([functionName, functionMeta]) => {
          try {
            // Build function call with appropriate argument values
            // For required arguments, we'll use safe default values based on type
            const argValues: unknown[] = functionMeta.args.map((arg) => {
              // If argument has default, use null (will use default)
              if (arg.hasDefault) {
                return null;
              }

              // For required arguments, use safe defaults based on type
              const udtName = (arg.udtName || '').toLowerCase();
              if (udtName.includes('uuid') || udtName === 'uuid') {
                // Use a test UUID for UUID arguments
                return '00000000-0000-0000-0000-000000000000';
              } else if (
                udtName.includes('text') ||
                udtName.includes('varchar') ||
                udtName.includes('string')
              ) {
                // Use empty string for text arguments
                return '';
              } else if (
                udtName.includes('int') ||
                udtName.includes('numeric') ||
                udtName.includes('number')
              ) {
                // Use 0 for numeric arguments
                return 0;
              } else if (udtName.includes('bool') || udtName === 'boolean') {
                // Use false for boolean arguments
                return false;
              } else {
                // Default to null for unknown types
                return null;
              }
            });

            const argPlaceholders = functionMeta.args.map((_, i) => `$${i + 1}`).join(', ');
            const functionCall = argPlaceholders
              ? `SELECT * FROM ${schema}.${functionName}(${argPlaceholders}) LIMIT 0`
              : `SELECT * FROM ${schema}.${functionName}() LIMIT 0`;

            // Execute to get result set metadata (LIMIT 0 means no rows returned, just metadata)
            // This is safe even with test arguments because LIMIT 0 prevents actual data processing
            const testResult = await client.query(functionCall, argValues);

            // Extract column information from result fields
            // pg library provides field metadata in result.fields
            if (testResult.fields && testResult.fields.length > 0) {
              // OPTIMIZATION: Batch all type lookups together for this function
              // Collect all unique type OIDs first
              const uniqueOids = new Set(testResult.fields.map((field) => field.dataTypeID));

              // Batch query all types at once
              const typeOids = Array.from(uniqueOids);
              const typeResults =
                typeOids.length > 0
                  ? await client.query('SELECT oid, typname FROM pg_type WHERE oid = ANY($1)', [
                      typeOids,
                    ])
                  : { rows: [] };

              // Create a map for quick lookup
              const typeMap = new Map(typeResults.rows.map((row) => [row.oid, row.typname]));

              // Build attributes using the type map
              const attributes: CompositeTypeAttribute[] = testResult.fields.map((field, index) => {
                const udtName = typeMap.get(field.dataTypeID) || 'unknown';

                return {
                  name: field.name,
                  udtName,
                  nullable: true, // Assume nullable for safety (can't determine from result set)
                  ordinal: index + 1,
                };
              });

              return { functionName, attributes };
            }

            return { functionName, attributes: null };
          } catch (error) {
            // If introspection fails (function has side effects, requires specific args, etc.),
            // we'll fall back to Record<string, unknown>
            // This is safe and expected for some functions
            // Return null to indicate failure (will be handled by Promise.allSettled)
            return { functionName, attributes: null, error };
          }
        })
      );

      // Process batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.attributes) {
          functionReturnStructures[result.value.functionName] = result.value.attributes;
        }
        // Silently ignore failures - the generator will handle missing return structures
      }
    }

    return {
      functions: metadata.functions || {},
      compositeTypes: metadata.compositeTypes || {},
      enums: metadata.enums || {},
      functionReturnStructures,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    // Sanitize connection string for error message (hide password)
    const sanitizedConnectionString = connectionString.replace(/:[^:@]+@/, ':****@');

    // Provide more helpful error messages for common connection issues
    if (errorMessage.includes('EHOSTUNREACH') || errorMessage.includes('ENOTFOUND')) {
      throw new Error(
        `Failed to connect to database. Please check:\n` +
          `1. Network connectivity to the database host\n` +
          `2. DIRECT_URL is correct: ${sanitizedConnectionString}\n` +
          `3. Database is accessible from your network\n` +
          `4. Firewall rules allow connections from your IP\n` +
          `5. For Supabase: Ensure you're using the correct project reference and region\n` +
          `Original error: ${errorMessage}`
      );
    }

    if (
      errorMessage.includes('password authentication failed') ||
      errorMessage.includes('authentication failed')
    ) {
      throw new Error(
        `Database authentication failed. Please check:\n` +
          `1. DIRECT_URL contains correct username and password\n` +
          `2. Database user has proper permissions\n` +
          `3. For Supabase: Ensure you're using the correct connection string from dashboard\n` +
          `Connection string (sanitized): ${sanitizedConnectionString}\n` +
          `Original error: ${errorMessage}`
      );
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      throw new Error(
        `Database connection timed out. Please check:\n` +
          `1. Database host is reachable\n` +
          `2. Network connection is stable\n` +
          `3. Firewall allows connections on the database port\n` +
          `4. For Supabase: Check if the project is paused or experiencing issues\n` +
          `Connection string (sanitized): ${sanitizedConnectionString}\n` +
          `Original error: ${errorMessage}`
      );
    }

    throw new Error(
      `Failed to introspect database: ${errorMessage}\n` +
        `Connection string (sanitized): ${sanitizedConnectionString}\n` +
        `Schema: ${schema}\n` +
        `Suggestion: Verify DIRECT_URL is set correctly and database is accessible.`
    );
  } finally {
    // Ensure client is properly closed even if connection failed
    try {
      await client.end();
    } catch {
      // Ignore errors when closing (client might not be connected)
    }
  }
}
