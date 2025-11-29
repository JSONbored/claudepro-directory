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
      case 'float4':
      case 'float8':
      case 'numeric': {
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
      default: {
        if (col.type === 'ARRAY') {
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
