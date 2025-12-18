/**
 * Generate TypeScript types and Zod schemas for PostgreSQL functions
 */

import {
  type CompositeTypeAttribute,
  type FunctionArg,
  type FunctionMeta,
} from '../toolkit/introspection.ts';
import { mapPostgresTypeToZod } from '../toolkit/zod-mapper.ts';
import type { GeneratorConfig, GeneratorOutput } from './types.ts';
import {
  mapPostgresTypeToTypeScript,
  toCamelCase,
  toPascalCase,
  toSafeIdentifier,
  type TypeMappingContext,
} from './type-mapper.ts';

/**
 * Generate TypeScript types and Zod schemas for all functions
 */
export async function generateFunctionTypes(
  functions: Record<string, FunctionMeta>,
  compositeTypes: Record<string, CompositeTypeAttribute[]>,
  enums: Record<string, string[]>,
  functionReturnStructures: Record<string, CompositeTypeAttribute[]>,
  config: GeneratorConfig
): Promise<GeneratorOutput> {
  const files: Record<string, string> = {};
  const exports: string[] = [];

  const context: TypeMappingContext = {
    enums,
    compositeTypes: Object.keys(compositeTypes),
  };

  for (const [functionName, functionMeta] of Object.entries(functions)) {
    const safeName = toSafeIdentifier(functionName);
    const dependencies = findFunctionDependencies(functionMeta, compositeTypes);
    const content = generateFunctionFile(
      functionName,
      functionMeta,
      compositeTypes,
      enums,
      functionReturnStructures,
      context,
      config,
      dependencies
    );
    files[safeName] = content;
    exports.push(safeName);
  }

  return { files, exports };
}

/**
 * Extract base composite type from a PostgreSQL type string
 * Handles nested arrays, SETOF, and array prefixes recursively
 */
function extractBaseCompositeType(
  typeString: string,
  compositeTypes: Record<string, CompositeTypeAttribute[]>
): string | null {
  if (!typeString) return null;

  // Handle SETOF (returns set of rows)
  if (typeString.toUpperCase().includes('SETOF')) {
    const baseTypeMatch = typeString.match(/SETOF\s+([\w.]+)/i);
    if (baseTypeMatch?.[1]) {
      const baseType = stripSchemaPrefix(baseTypeMatch[1]);
      // Recursively check if the base type is itself an array or composite
      if (compositeTypes[baseType]) {
        return baseType;
      }
      // If base type is an array (prefixed with _), extract further
      if (baseType.startsWith('_')) {
        return extractBaseCompositeType(baseType, compositeTypes);
      }
    }
    return null;
  }

  // Handle array types (prefixed with _)
  if (typeString.startsWith('_')) {
    const baseType = stripSchemaPrefix(typeString.slice(1));
    // Check if base type is a composite
    if (compositeTypes[baseType]) {
      return baseType;
    }
    // If base type itself starts with _ (nested array), recurse
    if (baseType.startsWith('_')) {
      return extractBaseCompositeType(baseType, compositeTypes);
    }
    // If base type has [] suffix (explicit array notation), recurse
    if (baseType.includes('[]')) {
      return extractBaseCompositeType(baseType.replace('[]', ''), compositeTypes);
    }
  }

  // Handle explicit array notation (some PostgreSQL types)
  if (typeString.includes('[]')) {
    const baseType = stripSchemaPrefix(typeString.replace(/\[\]/g, ''));
    if (compositeTypes[baseType]) {
      return baseType;
    }
    // Recurse to handle nested arrays
    return extractBaseCompositeType(baseType, compositeTypes);
  }

  // Strip schema prefix before checking
  const normalizedType = stripSchemaPrefix(typeString);

  // Direct composite type
  if (compositeTypes[normalizedType]) {
    return normalizedType;
  }

  return null;
}

/**
 * Find composite type dependencies for a function
 */
function findFunctionDependencies(
  functionMeta: FunctionMeta,
  compositeTypes: Record<string, CompositeTypeAttribute[]>
): { imports: Set<string> } {
  const imports = new Set<string>();

  // Check function arguments
  for (const arg of functionMeta.args) {
    const baseType = extractBaseCompositeType(arg.udtName, compositeTypes);
    if (baseType) {
      imports.add(baseType);
    }
  }

  // Check return type
  if (functionMeta.returnType) {
    const baseType = extractBaseCompositeType(functionMeta.returnType, compositeTypes);
    if (baseType) {
      imports.add(baseType);
    }
  }

  return { imports };
}

/**
 * Generate TypeScript and Zod code for a single function
 */
function generateFunctionFile(
  functionName: string,
  functionMeta: FunctionMeta,
  compositeTypes: Record<string, CompositeTypeAttribute[]>,
  enums: Record<string, string[]>,
  functionReturnStructures: Record<string, CompositeTypeAttribute[]>,
  context: TypeMappingContext,
  config: GeneratorConfig,
  dependencies: { imports: Set<string> }
): string {
  const safeName = toSafeIdentifier(functionName);
  const argsTypeName = `${toPascalCase(safeName)}Args`;
  const returnsTypeName = `${toPascalCase(safeName)}Returns`;
  const argsSchemaName = `${toCamelCase(safeName)}ArgsSchema`;
  const returnsSchemaName = `${toCamelCase(safeName)}ReturnsSchema`;

  const lines: string[] = [
    '/**',
    ` * PostgreSQL Function: ${functionName}`,
    ' * ',
    ' * 🔒 AUTO-GENERATED - DO NOT EDIT',
    ' * Generated by prisma-postgres-types-generator',
    ' */',
    '',
  ];

  // Check if we have an introspected return structure for this function
  // (for SETOF record functions that were successfully introspected)
  const hasIntrospectedStructure = functionReturnStructures[functionName] !== undefined;
  
  // Pre-check for heuristic composite type matching (only if no introspected structure)
  // This handles cases where function returns SETOF record but there's a matching composite type
  // NOTE: We'll validate the match before using it
  let matchedCompositeType: string | null = null;
  if (!hasIntrospectedStructure && 
      functionMeta.returnType && 
      functionMeta.returnType !== 'void' && 
      functionMeta.returnType !== 'pg_catalog.void') {
    const tempReturnType = mapReturnType(
      functionMeta.returnType,
      context,
      compositeTypes
    );
    
    // Only use heuristic for _record types (not for known composite types)
    const baseReturnType = functionMeta.returnType.startsWith('_') 
      ? stripSchemaPrefix(functionMeta.returnType.slice(1))
      : stripSchemaPrefix(functionMeta.returnType);
    const isRecordType = baseReturnType === 'record' || baseReturnType.toLowerCase() === 'pg_catalog.record';
    
    // If return type is unknown/Record and it's actually a record type, try heuristic
    if (isRecordType && (tempReturnType.includes('Record<string, unknown>') || tempReturnType.includes('unknown[]') || tempReturnType === 'unknown[]')) {
      if (compositeTypes) {
        const functionBaseName = functionName.replace(/^get_|^fetch_|^load_/i, '').replace(/_formatted$/, '');
        const possibleNames = [
          `mv_${functionBaseName}`, // Materialized view pattern
          functionBaseName,
          `${functionBaseName}_result`,
          `${functionBaseName}_row`,
        ];
        
        for (const possibleName of possibleNames) {
          if (compositeTypes[possibleName]) {
            // Validate: Check if composite type has reasonable structure
            // For now, we'll use it but note that it may not match exactly
            matchedCompositeType = possibleName;
            dependencies.imports.add(possibleName);
            break;
          }
          // Try case-insensitive
          const matchingKey = Object.keys(compositeTypes).find(
            key => key.toLowerCase() === possibleName.toLowerCase()
          );
          if (matchingKey) {
            matchedCompositeType = matchingKey;
            dependencies.imports.add(matchingKey);
            break;
          }
        }
      }
    }
  }

  // Import Zod if generating schemas
  if (config.generateZod) {
    lines.push("import { z } from 'zod';", '');
  }

  // Import composite types and schemas if needed
  // Map excluded composite types to Prisma model types and their Zod schemas
  const excludedCompositeToPrismaModel: Record<string, { type: string; schema: string }> = {
    'announcements': { type: 'announcementsModel', schema: 'announcementsModelSchema' },
    'content': { type: 'contentModel', schema: 'contentModelSchema' },
    'jobs': { type: 'jobsModel', schema: 'jobsModelSchema' },
    'notifications': { type: 'notificationsModel', schema: 'notificationsModelSchema' },
  };
  
  if (dependencies.imports.size > 0) {
    const typeImports: string[] = [];
    const schemaImports: string[] = [];
    const prismaModelImports = new Set<string>();
    const prismaSchemaImports = new Set<string>();
    
    for (const depName of Array.from(dependencies.imports).sort()) {
      // Check if this composite type is excluded
      const isExcluded = config.excludeCompositeTypes?.some((pattern) =>
        new RegExp(pattern.replace(/\*/g, '.*')).test(depName)
      );
      
      if (isExcluded) {
        // Use Prisma model type and schema instead
        const prismaMapping = excludedCompositeToPrismaModel[depName];
        if (prismaMapping) {
          if (config.generateTypes) {
            prismaModelImports.add(prismaMapping.type);
          }
          if (config.generateZod) {
            prismaSchemaImports.add(prismaMapping.schema);
          }
        }
        continue;
      }
      
      const depSafeName = toSafeIdentifier(depName);
      const depTypeName = toPascalCase(depSafeName);
      const depSchemaName = `${toCamelCase(depSafeName)}Schema`;
      
      // Import TypeScript type if generating types
      if (config.generateTypes) {
        typeImports.push(
          `import type { ${depTypeName} } from '../composites/${depSafeName}';`
        );
      }
      
      // Import Zod schema if generating schemas
      if (config.generateZod) {
        schemaImports.push(
          `import { ${depSchemaName} } from '../composites/${depSafeName}';`
        );
      }
    }
    
    // Add Prisma model type imports if needed
    if (prismaModelImports.size > 0) {
      const prismaModels = Array.from(prismaModelImports).sort();
      typeImports.push(
        `import type { ${prismaModels.join(', ')} } from '@heyclaude/database-types/prisma/models';`
      );
    }
    
    // Add Prisma Zod schema imports if needed
    if (prismaSchemaImports.size > 0) {
      const prismaSchemas = Array.from(prismaSchemaImports).sort();
      schemaImports.push(
        `import { ${prismaSchemas.join(', ')} } from '@heyclaude/database-types/prisma/zod/schemas/variants/pure';`
      );
    }
    
    // Add imports (types first, then schemas)
    if (typeImports.length > 0) {
      lines.push(...typeImports);
    }
    if (schemaImports.length > 0) {
      lines.push(...schemaImports);
    }
    if (typeImports.length > 0 || schemaImports.length > 0) {
      lines.push('');
    }
  }

  // Generate args type
  if (config.generateTypes) {
    lines.push('/**', ` * Arguments for PostgreSQL function: ${functionName}`, ' */');
    lines.push(`export type ${argsTypeName} = {`);

    for (const arg of functionMeta.args) {
      // For optional parameters, don't pass hasDefault to mapPostgresTypeToTypeScript
      // We'll mark them as optional with ? instead
      const tsType = mapPostgresTypeToTypeScript(
        arg.udtName,
        false, // Don't treat as nullable - we'll use ? for optional
        false, // Don't treat as hasDefault - we'll use ? for optional
        context
      );

      // Add JSDoc with parameter information
      const description = `Parameter: ${arg.name} (${arg.udtName}${arg.hasDefault ? ', optional' : ''}${arg.mode === 'INOUT' ? ', INOUT' : ''})`;
      lines.push(`  /** ${description} */`);
      // Mark optional parameters with ? in TypeScript
      const optionalMarker = arg.hasDefault ? '?' : '';
      lines.push(`  ${toSafeIdentifier(arg.name)}${optionalMarker}: ${tsType};`);
    }

    lines.push('};', '');
  }

  // Generate args Zod schema
  if (config.generateZod) {
    lines.push('/**', ` * Zod schema for ${functionName} function arguments`, ' */');
    lines.push(`export const ${argsSchemaName} = z.object({`);

    for (const arg of functionMeta.args) {
      const zodType = generateZodTypeForArg(arg, compositeTypes, enums);
      const description = `Parameter: ${arg.name}`;
      lines.push(`  /** ${description} */`);
      lines.push(`  ${toSafeIdentifier(arg.name)}: ${zodType},`);
    }

    lines.push('});', '');

    // Type inference from Zod
    if (config.generateTypes) {
      // Type was already defined above, add alias from Zod for validation
      lines.push(
        '/**',
        ' * Type inference from Zod schema (should match type above)',
        ' */'
      );
      lines.push(`export type ${argsTypeName}FromZod = z.infer<typeof ${argsSchemaName}>;`);
      lines.push('');
    } else {
      // Only Zod generated, create the type from Zod
      lines.push(
        '/**',
        ' * Type inference from Zod schema',
        ' */'
      );
      lines.push(`export type ${argsTypeName} = z.infer<typeof ${argsSchemaName}>;`);
      lines.push('');
    }
  }

  // Generate function-specific return type if we have introspected structure
  let functionSpecificReturnType: string | null = null;
  if (hasIntrospectedStructure && functionReturnStructures[functionName]) {
    const attributes = functionReturnStructures[functionName];
    const typeName = `${toPascalCase(toSafeIdentifier(functionName))}ReturnRow`;
    const schemaName = `${toCamelCase(toSafeIdentifier(functionName))}ReturnRowSchema`;
    
    // Generate inline composite type for this function's return structure
    if (config.generateTypes) {
      lines.push('/**', ` * Return row type for PostgreSQL function: ${functionName}`, ' */');
      lines.push(`export type ${typeName} = {`);
      
      for (const attr of attributes) {
        const tsType = mapPostgresTypeToTypeScript(
          attr.udtName,
          attr.nullable,
          false,
          context
        );
        lines.push(`  /** ${attr.name} (${attr.udtName}${attr.nullable ? ', nullable' : ''}) */`);
        lines.push(`  ${toSafeIdentifier(attr.name)}: ${tsType};`);
      }
      
      lines.push('};', '');
    }
    
    // Generate Zod schema
    if (config.generateZod) {
      lines.push('/**', ` * Zod schema for ${functionName} return row`, ' */');
      lines.push(`export const ${schemaName} = z.object({`);
      
      for (const attr of attributes) {
        const zodType = mapPostgresTypeToZod(
          {
            udtName: attr.udtName,
            nullable: attr.nullable,
            hasDefault: false,
            type: 'unknown',
          },
          enums
        );
        lines.push(`  ${toSafeIdentifier(attr.name)}: ${zodType},`);
      }
      
      lines.push('});', '');
    }
    
    functionSpecificReturnType = typeName;
  }

  // Generate return type
  if (config.generateTypes) {
    lines.push('/**', ` * Return type for PostgreSQL function: ${functionName}`, ' */');
    
    // Handle void return type
    if (!functionMeta.returnType || functionMeta.returnType === 'void' || functionMeta.returnType === 'pg_catalog.void') {
      lines.push(`export type ${returnsTypeName} = void;`);
    } else if (functionSpecificReturnType) {
      // Use introspected structure
      lines.push(`export type ${returnsTypeName} = ${functionSpecificReturnType}[];`);
    } else {
      // Check if return type references an excluded composite type BEFORE mapping
      // This allows us to map excluded types to Prisma models even though they're filtered out
      const baseReturnType = functionMeta.returnType.startsWith('_') 
        ? stripSchemaPrefix(functionMeta.returnType.slice(1))
        : stripSchemaPrefix(functionMeta.returnType);
      
      const excludedCompositeToPrismaModel: Record<string, string> = {
        'announcements': 'announcementsModel',
        'content': 'contentModel',
        'jobs': 'jobsModel',
        'notifications': 'notificationsModel',
      };
      
      // Check if the base return type is an excluded composite type
      const isExcludedComposite = config.excludeCompositeTypes?.some((pattern) =>
        new RegExp(pattern.replace(/\*/g, '.*')).test(baseReturnType)
      ) && excludedCompositeToPrismaModel[baseReturnType];
      
      let returnType: string;
      if (isExcludedComposite) {
        // Directly use Prisma model type for excluded composite types
        const prismaModel = excludedCompositeToPrismaModel[baseReturnType];
        if (!prismaModel) {
          // Fallback to normal mapping if mapping not found
          returnType = mapReturnType(
            functionMeta.returnType,
            context,
            compositeTypes
          );
        } else {
          // Check if it's an array type
          if (functionMeta.returnType.startsWith('_') || functionMeta.returnType.toUpperCase().includes('SETOF')) {
            returnType = `${prismaModel}[]`;
          } else {
            returnType = prismaModel;
          }
        }
      } else {
        // Use normal mapping for non-excluded types
        returnType = mapReturnType(
          functionMeta.returnType,
          context,
          compositeTypes
        );
        
        // If return type is still unknown/Record and we found a composite type in pre-check, use it
        // BUT: Only if it's not a _record type (heuristic should not apply to actual record types)
        const isActualRecordType = baseReturnType === 'record' || baseReturnType.toLowerCase() === 'pg_catalog.record';
        
        if (matchedCompositeType && 
            !isActualRecordType && // Don't use heuristic for actual record types
            (returnType.includes('Record<string, unknown>') || returnType.includes('unknown[]') || returnType === 'unknown[]')) {
          returnType = `${toPascalCase(toSafeIdentifier(matchedCompositeType))}[]`;
        }
      }
      
      lines.push(`export type ${returnsTypeName} = ${returnType};`);
    }
    lines.push('');
  }

  // Generate return Zod schema (if return type is known and not void)
  if (config.generateZod && functionMeta.returnType && 
      functionMeta.returnType !== 'void' && 
      functionMeta.returnType !== 'pg_catalog.void') {
    lines.push('/**', ` * Zod schema for ${functionName} function return type`, ' */');
    
    let zodReturnType: string;
    
    if (functionSpecificReturnType) {
      // Use introspected structure schema
      const schemaName = `${toCamelCase(toSafeIdentifier(functionName))}ReturnRowSchema`;
      zodReturnType = `z.array(${schemaName})`;
    } else {
      zodReturnType = generateZodSchemaForReturnType(
        functionMeta.returnType,
        compositeTypes,
        enums,
        config // Pass config to handle excluded composite types
      );
      
      // If we matched a composite type in the heuristic above, use its schema
      // BUT: Only if it's not an actual record type
      const baseReturnType = functionMeta.returnType.startsWith('_') 
        ? stripSchemaPrefix(functionMeta.returnType.slice(1))
        : stripSchemaPrefix(functionMeta.returnType);
      const isActualRecordType = baseReturnType === 'record' || baseReturnType.toLowerCase() === 'pg_catalog.record';
      
      if (matchedCompositeType && !isActualRecordType) {
        // Check if this composite type is excluded (use Prisma model instead)
        const isExcluded = config.excludeCompositeTypes?.some((pattern) =>
          new RegExp(pattern.replace(/\*/g, '.*')).test(matchedCompositeType)
        );
        
        if (isExcluded) {
          // Use Prisma Zod schema for excluded composite types
          const excludedCompositeToPrismaSchema: Record<string, string> = {
            'announcements': 'announcementsModelSchema',
            'content': 'contentModelSchema',
            'jobs': 'jobsModelSchema',
            'notifications': 'notificationsModelSchema',
          };
          const prismaSchemaName = excludedCompositeToPrismaSchema[matchedCompositeType];
          if (prismaSchemaName) {
            zodReturnType = `z.array(${prismaSchemaName})`;
            // Ensure the schema is imported (handled in import generation above)
            if (dependencies.imports) {
              dependencies.imports.add(matchedCompositeType);
            }
          } else {
            // Fallback if mapping not found
            zodReturnType = 'z.array(z.unknown())';
          }
        } else {
          const compositeSchemaName = `${toCamelCase(toSafeIdentifier(matchedCompositeType))}Schema`;
          zodReturnType = `z.array(${compositeSchemaName})`;
          // Ensure the schema is imported
          if (dependencies.imports) {
            dependencies.imports.add(matchedCompositeType);
          }
        }
      }
    }
    
    lines.push(`export const ${returnsSchemaName} = ${zodReturnType};`);
    lines.push('');

    // Type inference from Zod
    if (config.generateTypes) {
      // Type was already defined above, add alias from Zod for validation
      lines.push(
        '/**',
        ' * Type inference from Zod schema (should match type above)',
        ' */'
      );
      lines.push(`export type ${returnsTypeName}FromZod = z.infer<typeof ${returnsSchemaName}>;`);
      lines.push('');
    } else {
      // Only Zod generated, create the type from Zod
      lines.push(
        '/**',
        ' * Type inference from Zod schema',
        ' */'
      );
      lines.push(`export type ${returnsTypeName} = z.infer<typeof ${returnsSchemaName}>;`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate Zod schema for a function return type
 * Handles nested arrays, SETOF, and composite types recursively
 * 
 * ARCHITECTURAL FIX: This function now accepts config to handle excluded composite types
 * and map them to Prisma model Zod schemas instead of generating composite schemas.
 */
function generateZodSchemaForReturnType(
  returnType: string,
  compositeTypes: Record<string, CompositeTypeAttribute[]>,
  enums: Record<string, string[]>,
  config?: GeneratorConfig
): string {
  // Handle SETOF (returns set of rows) - treat as array
  if (returnType.toUpperCase().includes('SETOF')) {
    const baseTypeMatch = returnType.match(/SETOF\s+([\w.]+)/i);
    if (baseTypeMatch?.[1]) {
      const baseType = stripSchemaPrefix(baseTypeMatch[1]);
      // Recursively generate schema for base type
      const baseSchema = generateZodSchemaForReturnType(baseType, compositeTypes, enums, config);
      return `z.array(${baseSchema})`;
    }
    // Fallback for SETOF without clear base type
    return 'z.array(z.unknown())';
  }

  // Handle array types (prefixed with _)
  if (returnType.startsWith('_')) {
    const baseType = stripSchemaPrefix(returnType.slice(1));
    // Recursively generate schema for base type (handles nested arrays)
    const baseSchema = generateZodSchemaForReturnType(baseType, compositeTypes, enums, config);
    return `z.array(${baseSchema})`;
  }

  // Handle explicit array notation (some PostgreSQL types)
  if (returnType.includes('[]')) {
    const baseType = stripSchemaPrefix(returnType.replace(/\[\]/g, ''));
    // Recursively generate schema for base type (handles nested arrays)
    const baseSchema = generateZodSchemaForReturnType(baseType, compositeTypes, enums, config);
    return `z.array(${baseSchema})`;
  }

  // Strip schema prefix before checking composite types
  const normalizedType = stripSchemaPrefix(returnType);

  // ARCHITECTURAL FIX: Check if this composite type is excluded (should use Prisma model instead)
  const isExcluded = config?.excludeCompositeTypes?.some((pattern) =>
    new RegExp(pattern.replace(/\*/g, '.*')).test(normalizedType)
  );

  if (isExcluded) {
    // Map excluded composite types to Prisma model Zod schemas
    const excludedCompositeToPrismaSchema: Record<string, string> = {
      'announcements': 'announcementsModelSchema',
      'content': 'contentModelSchema',
      'jobs': 'jobsModelSchema',
      'notifications': 'notificationsModelSchema',
    };
    const prismaSchemaName = excludedCompositeToPrismaSchema[normalizedType];
    if (prismaSchemaName) {
      return prismaSchemaName;
    }
    // Fallback if mapping not found
    return 'z.unknown()';
  }

  // Check if return type is a composite - reference the generated schema
  if (compositeTypes[normalizedType]) {
    const compositeSchemaName = `${toCamelCase(toSafeIdentifier(normalizedType))}Schema`;
    return compositeSchemaName;
  }
  
  // Note: We can't check context.compositeTypes array here because we don't have access to context
  // But if the composite type exists in compositeTypes record, it should have been found above
  // If not found, fall through to scalar type handling

  // Scalar type - use zod-mapper (use normalized type name)
  return mapPostgresTypeToZod(
    {
      udtName: normalizedType,
      nullable: false,
      hasDefault: false,
      type: 'unknown',
    },
    enums
  );
}

/**
 * Generate Zod type string for a function argument
 */
function generateZodTypeForArg(
  arg: FunctionArg,
  compositeTypes: Record<string, CompositeTypeAttribute[]>,
  enums: Record<string, string[]>
): string {
  // Handle composite types - reference generated schema instead of inline
  if (compositeTypes[arg.udtName]) {
    // Direct composite type - reference generated schema
    const compositeSchemaName = `${toCamelCase(toSafeIdentifier(arg.udtName))}Schema`;
    return compositeSchemaName;
  }
  
  // Handle array composite types (prefixed with _)
  if (arg.udtName.startsWith('_')) {
    const baseType = arg.udtName.slice(1);
    if (compositeTypes[baseType]) {
      // Array of composite - reference the generated schema
      const compositeSchemaName = `${toCamelCase(toSafeIdentifier(baseType))}Schema`;
      return `z.array(${compositeSchemaName})`;
    }
  }

  // Use existing zod-mapper utility for scalar types
  return mapPostgresTypeToZod(
    {
      udtName: arg.udtName,
      nullable: arg.hasDefault,
      hasDefault: arg.hasDefault,
      type: arg.type,
    },
    enums
  );
}

/**
 * Map PostgreSQL return type to TypeScript type
 * 
 * Handles:
 * - Scalar types
 * - Composite types (references generated type)
 * - Array types (including nested arrays of composites)
 * - SETOF types (treated as arrays, can be nested)
 * - Table types (references Prisma types - TODO)
 * - Void types
 */
/**
 * Strip schema prefix and quotes from type name
 * Handles: "public.mv_search_facets", '"public"."mv_search_facets"', 'mv_search_facets', etc.
 */
function stripSchemaPrefix(typeName: string): string {
  if (!typeName) return typeName;
  
  // Remove all quotes first
  let cleaned = typeName.replace(/["']/g, '');
  
  // Remove schema prefix if present (e.g., "public.type_name" -> "type_name")
  // Handles: public.type_name, public_type_name, etc.
  const schemaMatch = cleaned.match(/^[a-z_][a-z0-9_]*\.([a-z_][a-z0-9_]*)$/i);
  if (schemaMatch && schemaMatch[1]) {
    return schemaMatch[1];
  }
  
  // If no schema prefix, return cleaned name
  return cleaned;
}

function mapReturnType(
  returnType: string,
  context: TypeMappingContext,
  compositeTypes?: Record<string, CompositeTypeAttribute[]>
): string {
  // Handle void
  if (!returnType || returnType === 'void' || returnType === 'pg_catalog.void') {
    return 'void';
  }

  // Handle SETOF (returns set of rows) - treat as array
  if (returnType.toUpperCase().includes('SETOF')) {
    // Extract base type from SETOF base_type (may include schema prefix)
    const baseTypeMatch = returnType.match(/SETOF\s+([\w.]+)/i);
    if (baseTypeMatch?.[1]) {
      const baseType = stripSchemaPrefix(baseTypeMatch[1]);
      // Recursively map base type (handles nested arrays)
      const baseTsType = mapReturnType(baseType, context, compositeTypes);
      return `${baseTsType}[]`;
    }
  }

  // Handle array types (prefixed with _)
  if (returnType.startsWith('_')) {
    const baseType = stripSchemaPrefix(returnType.slice(1));
    // Recursively map base type (handles nested arrays)
    let baseTsType = mapReturnType(baseType, context, compositeTypes);
    
    // If recursive call returned 'unknown', try direct composite type lookup
    // This handles cases where the type name format doesn't match exactly
    if (baseTsType === 'unknown' && compositeTypes && baseType) {
      // Try exact match first
      if (compositeTypes[baseType]) {
        baseTsType = toPascalCase(toSafeIdentifier(baseType));
      } else {
        // Try case-insensitive match
        const matchingKey = Object.keys(compositeTypes).find(
          key => key.toLowerCase() === baseType.toLowerCase()
        );
        if (matchingKey) {
          baseTsType = toPascalCase(toSafeIdentifier(matchingKey));
        }
      }
    }
    
    return `${baseTsType}[]`;
  }

  // Handle explicit array notation (some PostgreSQL types)
  if (returnType.includes('[]')) {
    const baseType = stripSchemaPrefix(returnType.replace(/\[\]/g, ''));
    // Recursively map base type (handles nested arrays)
    const baseTsType = mapReturnType(baseType, context, compositeTypes);
    return `${baseTsType}[]`;
  }

  // Strip schema prefix before checking composite types
  const normalizedType = stripSchemaPrefix(returnType);

  // Check if return type is a composite (check record first, then context array as fallback)
  if (compositeTypes) {
    // Try exact match first
    if (compositeTypes[normalizedType]) {
      return toPascalCase(toSafeIdentifier(normalizedType));
    }
    
    // Try case-insensitive match (PostgreSQL type names are case-insensitive)
    const matchingKey = Object.keys(compositeTypes).find(
      key => key.toLowerCase() === normalizedType.toLowerCase()
    );
    if (matchingKey) {
      return toPascalCase(toSafeIdentifier(matchingKey));
    }
  }
  
  // Fallback: check if return type is in context.compositeTypes array
  // This handles cases where compositeTypes record might not have the type
  // but it exists in the database (e.g., materialized views, tables used as composites)
  const matchingInArray = context.compositeTypes.find(
    key => key.toLowerCase() === normalizedType.toLowerCase()
  );
  if (matchingInArray) {
    return toPascalCase(toSafeIdentifier(matchingInArray));
  }

  // Scalar type (use normalized type name)
  return mapPostgresTypeToTypeScript(normalizedType, false, false, context);
}
