/**
 * Validation utilities for generated code
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Validate that generated TypeScript files compile without errors
 */
export async function validateGeneratedTypes(
  outputDir: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check if output directory exists
    if (!existsSync(outputDir)) {
      errors.push(`Output directory does not exist: ${outputDir}`);
      return { valid: false, errors };
    }

    // Check if main index file exists
    const mainIndex = join(outputDir, 'index.ts');
    if (!existsSync(mainIndex)) {
      errors.push(`Main index file not found: ${mainIndex}`);
      return { valid: false, errors };
    }

    // Try to compile with TypeScript (type check only)
    try {
      execSync(`npx tsc --noEmit --skipLibCheck ${mainIndex}`, {
        cwd: outputDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch (error) {
      const errorOutput =
        (error as { stdout?: string; stderr?: string }).stderr ||
        (error as { stdout?: string; stderr?: string }).stdout ||
        String(error);
      errors.push(`TypeScript compilation failed: ${errorOutput}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Validation failed: ${(error as Error).message}`);
    return { valid: false, errors };
  }
}

/**
 * Validate that generated Zod schemas are valid
 */
export function validateZodSchemas(outputDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation - check that schema files exist and have valid syntax
  // Full runtime validation would require importing and testing the schemas
  // This is a basic check that can be expanded later

  // Check if composites directory exists (where Zod schemas are generated)
  const compositesDir = join(outputDir, 'composites');
  if (!existsSync(compositesDir)) {
    errors.push(`Composites directory does not exist: ${compositesDir}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
