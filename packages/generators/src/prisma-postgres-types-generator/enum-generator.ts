/**
 * Generate Zod schemas for PostgreSQL enums
 * 
 * Matches the format of prisma-zod-generator but uses actual database enum values
 * (from introspection) instead of Prisma enum names, properly handling @map() directives.
 */

import type { GeneratorConfig, GeneratorOutput } from './types.ts';

/**
 * Generate Zod schemas for all enums in the same format as prisma-zod-generator
 * 
 * Output format matches: packages/generators/dist/prisma/zod/schemas/enums/{enum_name}.schema.ts
 */
export function generateEnumSchemas(
  enums: Record<string, string[]>,
  config: GeneratorConfig
): GeneratorOutput {
  const files: Record<string, string> = {};
  const exports: string[] = [];

  // Only generate if Zod schemas are enabled
  if (!config.generateZod) {
    return { files, exports };
  }

  for (const [enumName, enumValues] of Object.entries(enums)) {
    // Skip if no values
    if (!enumValues || enumValues.length === 0) {
      continue;
    }

    // Generate schema file matching prisma-zod-generator format
    const content = generateEnumSchemaFile(enumName, enumValues);
    
    // Use snake_case filename to match prisma-zod-generator format
    const fileName = `${enumName}.schema.ts`;
    files[fileName] = content;
    exports.push(enumName);
  }

  return { files, exports };
}

/**
 * Generate a single enum schema file matching prisma-zod-generator format
 * 
 * Uses Prisma enum objects to create Zod schemas that validate against database values,
 * while exporting the actual Prisma enum type (not an inferred string literal union).
 */
function generateEnumSchemaFile(enumName: string, _enumValues: string[]): string {
  // Import the Prisma enum object (value object) for runtime validation
  // The enum object contains the actual database values (handles @map() directives)
  // Use a different import name to avoid duplicate identifier with the type
  const enumObjectName = `${enumName}Enum`;
  
  // Note: _enumValues is used for validation (checking if empty) but not in the generated code
  // We use Object.values() of the Prisma enum object at runtime instead
  
  // Generate file content that:
  // 1. Imports the Prisma enum object for runtime validation
  // 2. Creates Zod schema using z.string().refine() with type assertion to ensure it infers the Prisma enum type
  // 3. Validates against database values (handles @map() correctly)
  const lines = [
    "import * as z from 'zod';",
    // Import the Prisma enum object (value object) for runtime validation
    // This object contains the actual database values, properly handling @map() directives
    // The enum objects are exported from @heyclaude/database-types/prisma (snake_case)
    // Use alias to avoid duplicate identifier with type import
    `import { ${enumName} as ${enumObjectName} } from '@heyclaude/database-types/prisma';`,
    // Import the Prisma enum type for type annotation
    // Enum types are exported from @heyclaude/database-types/prisma (enums.ts)
    `import type { ${enumName} } from '@heyclaude/database-types/prisma';`,
    '',
    // Create Zod schema using z.string().pipe() with transform to ensure correct type inference
    // This validates against the actual database values (handles @map() correctly)
    // and ensures TypeScript infers the Prisma enum type (not a string literal union)
    // This is generated code, ensuring perfect type inference without manual assertions in consuming code
    `export const ${enumName}Schema: z.ZodType<${enumName}> = z.string().pipe(`,
    `  z.custom<${enumName}>((val) => {`,
    `    const enumValues = Object.values(${enumObjectName}) as readonly string[];`,
    `    return typeof val === 'string' && enumValues.includes(val);`,
    `  }, { message: 'Invalid ${enumName} value' })`,
    `);`,
    '',
    // Export the Prisma enum type directly (not an inferred string literal union)
    // This ensures type compatibility with Prisma-generated types throughout the codebase
    `export type { ${enumName} };`,
    '',
  ];

  return lines.join('\n');
}
