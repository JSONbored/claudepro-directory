/**
 * Database introspection for PostgreSQL functions and composite types
 * 
 * Uses direct PostgreSQL client connection for better Prisma integration.
 */

import { Client } from 'pg';

import type {
  CompositeTypeAttribute,
  FunctionMeta,
} from '../toolkit/introspection.ts';

export interface DatabaseMetadata {
  functions: Record<string, FunctionMeta>;
  compositeTypes: Record<string, CompositeTypeAttribute[]>;
  enums: Record<string, string[]>;
}

/**
 * Introspect PostgreSQL database for functions and composite types
 * 
 * Uses direct PostgreSQL client connection for better error handling
 * and Prisma integration.
 */
export async function introspectDatabase(
  connectionString: string,
  schema: string = 'public'
): Promise<DatabaseMetadata> {
  // Configure SSL for Supabase connections
  // Supabase requires SSL connections for security
  // Always enable SSL unless explicitly disabled in connection string
  const needsSSL = !connectionString.includes('sslmode=disable');
  const client = new Client({
    connectionString,
    ssl: needsSSL
      ? { rejectUnauthorized: false } // Supabase uses self-signed certificates
      : false, // Explicitly disable SSL only if sslmode=disable is in connection string
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
        CASE 
          WHEN r.data_type = 'USER-DEFINED' THEN COALESCE(r.type_udt_name, 'void')
          WHEN r.data_type = 'SETOF' THEN '_' || COALESCE(r.type_udt_name, 'record')
          WHEN r.type_udt_name IS NULL THEN 'void'
          ELSE r.type_udt_name
        END
      ),
      'args', COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'name', p.parameter_name,
              'mode', p.parameter_mode,
              'type', p.data_type,
              'udtName', p.udt_name,
              'ordinal', p.ordinal_position,
              'hasDefault', p.parameter_default IS NOT NULL
            ) ORDER BY p.ordinal_position
          )
          FROM information_schema.parameters p
          WHERE p.specific_name = r.specific_name
            AND p.parameter_mode IN ('IN', 'INOUT')
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

    return {
      functions: metadata.functions || {},
      compositeTypes: metadata.compositeTypes || {},
      enums: metadata.enums || {},
    };
  } catch (error) {
    throw new Error(
      `Failed to introspect database: ${(error as Error).message}`
    );
  } finally {
    await client.end();
  }
}
