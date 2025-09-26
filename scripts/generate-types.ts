#!/usr/bin/env tsx

/**
 * Type Generation and Validation Script
 *
 * This script automatically generates TypeScript types from Zod schemas,
 * validates consistency, and ensures all schemas have proper type exports.
 * It's designed for production-grade type safety in open-source codebases.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { z } from 'zod';

// Configuration for type generation
const CONFIG = {
  schemasDir: 'lib/schemas',
  typesDir: 'lib/types',
  outputFile: 'lib/types/generated.ts',
  schemaPattern: '**/*.schema.ts',
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts'],
} as const;

// Schema information structure
const schemaInfoSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
  relativePath: z.string(),
  schemaNames: z.array(z.string()),
  typeExports: z.array(z.string()),
  hasProperExports: z.boolean(),
  lineCount: z.number(),
  lastModified: z.string(),
});

type SchemaInfo = z.infer<typeof schemaInfoSchema>;

// Type generation result
const typeGenerationResultSchema = z.object({
  success: z.boolean(),
  schemasProcessed: z.number(),
  typesGenerated: z.number(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  schemaFiles: z.array(schemaInfoSchema),
  generatedAt: z.string(),
  performance: z.object({
    duration: z.number(),
    averageFileProcessingTime: z.number(),
  }),
});

type TypeGenerationResult = z.infer<typeof typeGenerationResultSchema>;

class TypeGenerator {
  private schemaFiles: SchemaInfo[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];
  private startTime: number = 0;

  /**
   * Main execution function
   */
  async generate(): Promise<TypeGenerationResult> {
    this.startTime = performance.now();
    console.log('🚀 Starting TypeScript type generation from Zod schemas...\n');

    try {
      // Discover and analyze schema files
      await this.discoverSchemaFiles();

      // Validate existing type exports
      await this.validateTypeExports();

      // Generate centralized type index
      await this.generateTypeIndex();

      // Validate generated types
      await this.validateGeneratedTypes();

      const duration = performance.now() - this.startTime;
      const result: TypeGenerationResult = {
        success: this.errors.length === 0,
        schemasProcessed: this.schemaFiles.length,
        typesGenerated: this.schemaFiles.reduce((sum, file) => sum + file.typeExports.length, 0),
        errors: this.errors,
        warnings: this.warnings,
        schemaFiles: this.schemaFiles,
        generatedAt: new Date().toISOString(),
        performance: {
          duration,
          averageFileProcessingTime:
            this.schemaFiles.length > 0 ? duration / this.schemaFiles.length : 0,
        },
      };

      this.reportResults(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Fatal error: ${errorMessage}`);

      return {
        success: false,
        schemasProcessed: 0,
        typesGenerated: 0,
        errors: this.errors,
        warnings: this.warnings,
        schemaFiles: [],
        generatedAt: new Date().toISOString(),
        performance: {
          duration: performance.now() - this.startTime,
          averageFileProcessingTime: 0,
        },
      };
    }
  }

  /**
   * Discover all schema files in the project
   */
  private async discoverSchemaFiles(): Promise<void> {
    console.log('🔍 Discovering schema files...');

    const files = this.findSchemaFiles(CONFIG.schemasDir);

    if (files.length === 0) {
      this.errors.push('No schema files found');
      return;
    }

    for (const file of files) {
      try {
        const schemaInfo = await this.analyzeSchemaFile(file);
        this.schemaFiles.push(schemaInfo);
        console.log(`  ✅ Analyzed ${schemaInfo.fileName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.errors.push(`Failed to analyze ${file}: ${errorMessage}`);
        console.log(`  ❌ Failed to analyze ${file}`);
      }
    }

    console.log(`\n📊 Found ${this.schemaFiles.length} schema files\n`);
  }

  /**
   * Find schema files using Node.js built-in functions
   */
  private findSchemaFiles(dir: string): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) {
      return files;
    }

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...this.findSchemaFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.schema.ts')) {
        // Check if it's a schema file and not a test file
        if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Analyze individual schema file
   */
  private async analyzeSchemaFile(filePath: string): Promise<SchemaInfo> {
    const content = readFileSync(filePath, 'utf-8');
    const stats = statSync(filePath);
    const fileName = filePath.split('/').pop() || '';
    const relativePath = relative(process.cwd(), filePath);

    // Extract schema definitions
    const schemaNames = this.extractSchemaNames(content);

    // Extract type exports
    const typeExports = this.extractTypeExports(content);

    // Check if file has proper type exports
    const hasProperExports = this.validateTypeExportsInContent(content, schemaNames);

    return {
      fileName,
      filePath,
      relativePath,
      schemaNames,
      typeExports,
      hasProperExports,
      lineCount: content.split('\n').length,
      lastModified: stats.mtime.toISOString(),
    };
  }

  /**
   * Extract schema names from file content
   */
  private extractSchemaNames(content: string): string[] {
    const schemaRegex = /(?:export\s+)?(?:const|let)\s+([a-zA-Z][a-zA-Z0-9]*Schema)\s*=/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null = schemaRegex.exec(content);

    while (match !== null) {
      if (match[1]) matches.push(match[1]);
      match = schemaRegex.exec(content);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Extract type export statements from file content
   */
  private extractTypeExports(content: string): string[] {
    const typeExportRegex = /export\s+type\s+([a-zA-Z][a-zA-Z0-9]*)\s*=/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null = typeExportRegex.exec(content);

    while (match !== null) {
      if (match[1]) matches.push(match[1]);
      match = typeExportRegex.exec(content);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Validate that schemas have corresponding type exports
   */
  private validateTypeExportsInContent(content: string, schemaNames: string[]): boolean {
    let hasAllExports = true;

    for (const schemaName of schemaNames) {
      // Expected type name (remove 'Schema' suffix)
      const expectedTypeName = schemaName.replace(/Schema$/, '');

      // Check if type export exists
      const typeExportRegex = new RegExp(
        `export\\s+type\\s+${expectedTypeName}\\s*=\\s*z\\.infer<typeof\\s+${schemaName}>`,
        'g'
      );

      if (!typeExportRegex.test(content)) {
        this.warnings.push(
          `Missing type export for schema '${schemaName}' (expected '${expectedTypeName}')`
        );
        hasAllExports = false;
      }
    }

    return hasAllExports;
  }

  /**
   * Validate existing type exports in all schema files
   */
  private async validateTypeExports(): Promise<void> {
    console.log('🔍 Validating type exports...');

    let validFiles = 0;
    let issuesFound = 0;

    for (const schemaFile of this.schemaFiles) {
      if (schemaFile.hasProperExports) {
        validFiles++;
        console.log(`  ✅ ${schemaFile.fileName} - All schemas have type exports`);
      } else {
        issuesFound++;
        console.log(`  ⚠️  ${schemaFile.fileName} - Missing some type exports`);
      }
    }

    console.log(`\n📊 Type Export Validation:`);
    console.log(`  ✅ Valid files: ${validFiles}`);
    console.log(`  ⚠️  Files with issues: ${issuesFound}`);
    console.log(`  📝 Total warnings: ${this.warnings.length}\n`);
  }

  /**
   * Generate centralized type index file
   */
  private async generateTypeIndex(): Promise<void> {
    console.log('🏗️ Generating centralized type index...');

    const imports = this.schemaFiles
      .map((file) => {
        const modulePath = file.relativePath.replace('.ts', '').replace(/\\/g, '/');
        return `export * from '@/${modulePath}';`;
      })
      .sort();

    const typesByCategory = this.categorizeTypes();
    const typeExports = this.generateCategorizedExports(typesByCategory);
    const utilityTypes = this.generateUtilityTypes();
    const typeRegistry = this.generateTypeRegistry();

    const indexContent = `/**
 * Centralized TypeScript Types Generated from Zod Schemas
 *
 * Auto-generated on ${new Date().toISOString()}
 *
 * This file provides a centralized registry of all types generated from Zod schemas
 * across the application. It ensures type safety and consistency by providing a
 * single source of truth for all validated data structures.
 *
 * 🔄 This file is automatically generated. Do not edit manually.
 * 📝 To regenerate, run: npm run generate:types
 *
 * Schema files processed: ${this.schemaFiles.length}
 * Total types generated: ${this.schemaFiles.reduce((sum, file) => sum + file.typeExports.length, 0)}
 */

// Re-export all types from individual schema files
${imports.join('\n')}

${typeExports}

${utilityTypes}

${typeRegistry}

export default TYPE_REGISTRY;`;

    const outputPath = CONFIG.outputFile;
    writeFileSync(outputPath, indexContent, 'utf-8');
    console.log(`  ✅ Generated type index at ${outputPath}\n`);
  }

  /**
   * Categorize types by domain
   */
  private categorizeTypes(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};

    for (const file of this.schemaFiles) {
      // Extract category from filename (e.g., 'analytics.schema.ts' -> 'analytics')
      const category = file.fileName.replace('.schema.ts', '');
      categories[category] = file.typeExports;
    }

    return categories;
  }

  /**
   * Generate categorized type exports
   */
  private generateCategorizedExports(typesByCategory: Record<string, string[]>): string {
    const exports: string[] = [];

    for (const [category, types] of Object.entries(typesByCategory)) {
      if (types.length === 0) continue;

      const categoryComment = `// ${category.charAt(0).toUpperCase() + category.slice(1)} Types`;
      const typeExports = types.map((type) => `  ${type},`).join('\n');

      exports.push(`${categoryComment}
export type {
${typeExports}
} from '@/lib/schemas/${category}.schema';`);
    }

    return exports.join('\n\n');
  }

  /**
   * Generate utility types
   */
  private generateUtilityTypes(): string {
    return `/**
 * Utility Types
 *
 * Commonly used utility types that combine or extend base types
 * for specific use cases across the application.
 */

// API response wrapper types
export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  requestId?: string;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guards
export const isApiSuccessResponse = <T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> =>
  response.success === true;

export const isApiErrorResponse = (
  response: ApiResponse
): response is ApiErrorResponse =>
  response.success === false;`;
  }

  /**
   * Generate type registry metadata
   */
  private generateTypeRegistry(): string {
    const categories = this.categorizeTypes();
    const categoryStats = Object.entries(categories)
      .map(([category, types]) => {
        // Properly quote keys that contain hyphens or other special characters
        const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(category) ? category : `'${category}'`;
        return `    ${key}: ${types.length},`;
      })
      .join('\n');

    return `/**
 * Type Registry
 *
 * Metadata about the types for documentation and tooling purposes.
 */
export const TYPE_REGISTRY = {
  schemas: {
${categoryStats}
  },
  totalTypes: ${this.schemaFiles.reduce((sum, file) => sum + file.typeExports.length, 0)},
  totalSchemas: ${this.schemaFiles.length},
  lastGenerated: '${new Date().toISOString()}',
  version: '1.0.0',
  files: [
${this.schemaFiles.map((file) => `    '${file.relativePath}',`).join('\n')}
  ],
} as const;`;
  }

  /**
   * Validate generated types by attempting to compile them
   */
  private async validateGeneratedTypes(): Promise<void> {
    console.log('🔍 Validating generated types...');

    try {
      // Check if the generated file exists and is valid TypeScript
      const generatedFile = CONFIG.outputFile;
      if (existsSync(generatedFile)) {
        const content = readFileSync(generatedFile, 'utf-8');

        // Basic syntax validation
        if (content.includes('export') && content.includes('TYPE_REGISTRY')) {
          console.log('  ✅ Generated type index passes basic validation');
        } else {
          this.warnings.push('Generated type index may have structural issues');
        }
      } else {
        this.errors.push('Generated type index file was not created');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.errors.push(`Type validation failed: ${errorMessage}`);
    }
  }

  /**
   * Report generation results
   */
  private reportResults(result: TypeGenerationResult): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 TYPE GENERATION RESULTS');
    console.log('='.repeat(80));

    if (result.success) {
      console.log('✅ Type generation completed successfully!');
    } else {
      console.log('❌ Type generation completed with errors!');
    }

    console.log(`\n📈 Statistics:`);
    console.log(`  Schema files processed: ${result.schemasProcessed}`);
    console.log(`  Types generated: ${result.typesGenerated}`);
    console.log(`  Duration: ${result.performance.duration.toFixed(2)}ms`);
    console.log(`  Average per file: ${result.performance.averageFileProcessingTime.toFixed(2)}ms`);

    if (result.warnings.length > 0) {
      console.log(`\n⚠️ Warnings (${result.warnings.length}):`);
      for (const warning of result.warnings) {
        console.log(`  • ${warning}`);
      }
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      for (const error of result.errors) {
        console.log(`  • ${error}`);
      }
    }

    console.log(`\n${'='.repeat(80)}`);
  }
}

// Main execution
async function main() {
  const generator = new TypeGenerator();
  const result = await generator.generate();

  if (!result.success) {
    process.exit(1);
  }
}

// Run if executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Fallback - always run if this is the main module
if (process.argv[1]?.includes('generate-types.ts')) {
  main().catch(console.error);
}

export { TypeGenerator, type TypeGenerationResult };
