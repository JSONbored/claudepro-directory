/**
 * Content Validator
 *
 * Validates JSON content files against Zod schemas using direct imports
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllCategoryIds } from '@/src/lib/config/category-config';
import { validateContentByCategory } from '@/src/lib/validation/content-validator';
import type { ValidationOptions, ValidationResult, Validator } from '../core/types';

const CONTENT_DIR = join(process.cwd(), 'content');

export class ContentValidator implements Validator {
  name = 'content';
  description = 'Validates JSON content files against Zod schemas';
  enabled = true;

  async validate(_options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();
    const categories = getAllCategoryIds();
    let totalFiles = 0;
    const errors: Array<{
      file?: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    for (const categoryId of categories) {
      const categoryDir = join(CONTENT_DIR, categoryId);

      try {
        const files = readdirSync(categoryDir).filter((f) => f.endsWith('.json'));

        for (const file of files) {
          totalFiles++;
          try {
            const content = readFileSync(join(categoryDir, file), 'utf-8');
            const data = JSON.parse(content);
            validateContentByCategory(data, categoryId);
          } catch (error) {
            errors.push({
              file: `${categoryId}/${file}`,
              message: error instanceof Error ? error.message : String(error),
              severity: 'error',
            });
          }
        }
      } catch {
        // Directory doesn't exist or empty - skip
      }
    }

    return {
      validator: this.name,
      passed: errors.length === 0,
      errors,
      warnings: [],
      stats: {
        filesChecked: totalFiles,
        issues: errors.length,
        duration: Date.now() - startTime,
      },
      timestamp: new Date(),
    };
  }
}
