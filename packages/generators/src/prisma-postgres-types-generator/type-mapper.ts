/**
 * Map PostgreSQL types to TypeScript types
 * 
 * Handles all PostgreSQL types including scalars, arrays, composites, enums, and domains.
 */

export interface TypeMappingContext {
  /** Available enum types */
  enums: Record<string, string[]>;
  /** Available composite type names (array of type names) */
  compositeTypes: string[];
}

/**
 * Map PostgreSQL UDT name to TypeScript type string
 */
export function mapPostgresTypeToTypeScript(
  udtName: string,
  nullable: boolean,
  hasDefault: boolean,
  context: TypeMappingContext
): string {
  let tsType = 'unknown';

  // Check for enums first
  if (context.enums[udtName]) {
    const enumValues = context.enums[udtName]
      .map((v) => `'${v}'`)
      .join(' | ');
    tsType = enumValues;
  }
  // Check for composite types
  else if (context.compositeTypes.includes(udtName)) {
    // Composite types are generated separately, reference them
    tsType = toPascalCase(toSafeIdentifier(udtName));
  }
  // Scalar types
  else {
    switch (udtName) {
      case 'uuid':
        tsType = 'string';
        break;
      case 'text':
      case 'varchar':
      case 'bpchar':
      case 'char':
        tsType = 'string';
        break;
      case 'int2':
      case 'int4':
      case 'int8':
      case 'integer':  // Common alias
      case 'smallint':
      case 'bigint':
      case 'float4':
      case 'float8':
      case 'real':
      case 'double':
      case 'numeric':
      case 'decimal':
      case 'money':
        tsType = 'number';
        break;
      case 'bool':
        tsType = 'boolean';
        break;
      case 'json':
      case 'jsonb':
        tsType = 'Record<string, unknown>';
        break;
      case 'timestamptz':
      case 'timestamp':
      case 'date':
      case 'time':
        tsType = 'string'; // ISO 8601 strings
        break;
      case 'bytea':
        tsType = 'Uint8Array';
        break;
      case 'inet':
      case 'cidr':
        tsType = 'string'; // IP addresses as strings
        break;
      case 'point':
      case 'line':
      case 'lseg':
      case 'box':
      case 'path':
      case 'polygon':
      case 'circle':
        tsType = 'string'; // Geometric types as strings (or could be objects)
        break;
      case 'interval':
        tsType = 'string'; // Time intervals as ISO 8601 strings
        break;
      case 'tsvector':
      case 'tsquery':
        tsType = 'string'; // Full-text search types
        break;
      case 'record':
        tsType = 'Record<string, unknown>'; // Anonymous record type
        break;
      // Array types
      case '_text':
      case '_varchar':
      case '_bpchar':
        tsType = 'string[]';
        break;
      case '_uuid':
        tsType = 'string[]';
        break;
      case '_int2':
      case '_int4':
      case '_int8':
      case '_float4':
      case '_float8':
      case '_numeric':
        tsType = 'number[]';
        break;
      case '_bool':
        tsType = 'boolean[]';
        break;
      case '_json':
      case '_jsonb':
        tsType = 'Record<string, unknown>[]';
        break;
      case '_timestamptz':
      case '_timestamp':
      case '_date':
      case '_time':
        tsType = 'string[]';
        break;
      case '_json':
      case '_jsonb':
        tsType = 'Record<string, unknown>[]';
        break;
      case '_bytea':
        tsType = 'Uint8Array[]';
        break;
      default:
        // Handle array types (prefixed with _)
        if (udtName.startsWith('_')) {
          const baseType = udtName.slice(1);
          // Recursively map base type (handles nested arrays)
          const baseTsType = mapPostgresTypeToTypeScript(
            baseType,
            false,
            false,
            context
          );
          tsType = `${baseTsType}[]`;
        } else if (udtName.includes('[]')) {
          // Handle explicit array notation (some PostgreSQL types)
          const baseType = udtName.replace('[]', '');
          const baseTsType = mapPostgresTypeToTypeScript(
            baseType,
            false,
            false,
            context
          );
          tsType = `${baseTsType}[]`;
        } else {
          // Unknown type - use unknown and log warning
          // Note: Using console.warn for generator output (acceptable for build-time tools)
          // This helps developers identify unsupported types during generation
          if (process.env['NODE_ENV'] !== 'production') {
            console.warn(`⚠️  Unknown PostgreSQL type: ${udtName}, using 'unknown'`);
          }
          tsType = 'unknown';
        }
    }
  }

  // Handle nullable
  if (nullable) {
    tsType = `${tsType} | null`;
  }

  // Handle optional (has default value)
  if (hasDefault) {
    tsType = `${tsType} | undefined`;
    // If nullable, combine properly
    if (nullable) {
      tsType = `${tsType.replace(' | null', '')} | null | undefined`;
    }
  }

  return tsType;
}

/**
 * Convert snake_case to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  const parts = str.split('_');
  if (parts.length === 0) return str;
  return (
    parts[0]!.toLowerCase() +
    parts
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  );
}

/**
 * Generate a safe TypeScript identifier from a database name
 */
export function toSafeIdentifier(name: string): string {
  // Replace invalid characters
  return name.replace(/[^a-zA-Z0-9_$]/g, '_');
}
