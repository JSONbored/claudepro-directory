import { execFileSync } from 'node:child_process';

export interface ColumnMeta {
  default: null | string;
  maxLength: null | number;
  name: string;
  nullable: boolean;
  type: string;
  udtName: string;
}

export interface FunctionArg {
  hasDefault: boolean;
  mode: string; // IN, OUT, INOUT
  name: string;
  ordinal: number;
  type: string;
  udtName: string;
}

export interface FunctionMeta {
  args: FunctionArg[];
  name: string;
  returnType: string;
}

export interface CompositeTypeAttribute {
  name: string;
  nullable: boolean;
  ordinal: number;
  udtName: string;
}

export interface SchemaMeta {
  compositeTypes: Record<string, CompositeTypeAttribute[]>;
  enums: Record<string, string[]>;
  functions: Record<string, FunctionMeta>;
  tables: Record<string, ColumnMeta[]>;
}

export function getDatabaseMeta(dbUrl: string): SchemaMeta {
  const query = `
WITH enums AS (
  SELECT
    t.typname,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  GROUP BY t.typname
),
tables_agg AS (
  SELECT
    table_name,
    json_agg(
      json_build_object(
        'name', column_name,
        'type', data_type,
        'udtName', udt_name,
        'nullable', is_nullable = 'YES',
        'maxLength', character_maximum_length,
        'default', column_default
      )
    ) as columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
  GROUP BY table_name
),
functions_agg AS (
  SELECT
    r.routine_name,
    json_build_object(
      'name', r.routine_name,
      'returnType', r.type_udt_name,
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
  WHERE r.routine_schema = 'public'
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
  WHERE n.nspname = 'public'
    AND t.typtype = 'c'
    AND a.attnum > 0
  GROUP BY t.typname
)
SELECT
  json_build_object(
    'enums', COALESCE((SELECT json_object_agg(typname, values) FROM enums), '{}'::json),
    'tables', COALESCE((SELECT json_object_agg(table_name, columns) FROM tables_agg), '{}'::json),
    'functions', COALESCE((SELECT json_object_agg(routine_name, func_meta) FROM functions_agg), '{}'::json),
    'compositeTypes', COALESCE((SELECT json_object_agg(typname, attributes) FROM composite_types_agg), '{}'::json)
  )::text
`;

  try {
    const result = execFileSync(
      'psql',
      ['-d', dbUrl, '-t', '-A', '-c', query.replaceAll('\n', ' ')],
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );
    return JSON.parse(result.trim()) as SchemaMeta;
  } catch (error) {
    throw new Error(`Failed to query database: ${(error as Error).message}`);
  }
}
