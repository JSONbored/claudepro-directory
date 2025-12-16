export function mapPostgresTypeToZod(
  col: {
    hasDefault?: boolean;
    maxLength?: null | number;
    nullable?: boolean;
    type?: string;
    udtName: string;
  },
  enums: Record<string, string[]>
): string {
  let zodType = 'z.any()';

  // Check for Enums first
  const enumValues = enums[col.udtName];
  if (enumValues) {
    zodType = `z.enum(['${enumValues.join("', '")}'])`;
  } else {
    switch (col.udtName) {
      case 'uuid': {
        zodType = 'z.string().uuid()';
        break;
      }
      case 'text':
      case 'varchar':
      case 'bpchar': {
        zodType = 'z.string()';
        if (col.maxLength) {
          zodType += `.max(${col.maxLength})`;
        }
        break;
      }
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
      case 'decimal': {
        zodType = 'z.number()';
        break;
      }
      case 'bool': {
        zodType = 'z.boolean()';
        break;
      }
      case 'json':
      case 'jsonb': {
        zodType = 'z.any()';
        break;
      }
      case 'timestamptz':
      case 'timestamp':
      case 'date': {
        zodType = 'z.string()';
        break;
      }
      case '_text':
      case '_varchar': {
        zodType = 'z.array(z.string())';
        break;
      }
      case '_uuid': {
        zodType = 'z.array(z.string().uuid())';
        break;
      }
      case '_int2':
      case '_int4':
      case '_int8':
      case '_integer':
      case '_float4':
      case '_float8':
      case '_numeric': {
        zodType = 'z.array(z.number())';
        break;
      }
      case '_bool': {
        zodType = 'z.array(z.boolean())';
        break;
      }
      case '_json':
      case '_jsonb': {
        zodType = 'z.array(z.any())';
        break;
      }
      case '_timestamptz':
      case '_timestamp':
      case '_date': {
        zodType = 'z.array(z.string())';
        break;
      }
      default: {
        // Handle array types (prefixed with _)
        if (col.udtName.startsWith('_')) {
          const baseType = col.udtName.slice(1);
          // Check if it's an enum array
          if (enums[baseType]) {
            zodType = `z.array(z.enum(['${enums[baseType].join("', '")}']))`;
          } else {
            // Recursively map base type
            const baseZodType = mapPostgresTypeToZod(
              {
                udtName: baseType,
                nullable: false,
                hasDefault: false,
                ...(col.type ? { type: col.type } : {}),
              },
              enums
            );
            zodType = `z.array(${baseZodType})`;
          }
        } else if (col.type === 'ARRAY') {
          zodType = 'z.array(z.any())';
        }
        break;
      }
    }
  }

  if (col.nullable) {
    zodType += '.nullable()';
  }

  if (col.hasDefault) {
    zodType += '.optional()';
  }

  return zodType;
}
