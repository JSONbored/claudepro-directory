/**
 * Content Validator - Database-First
 * Validates content table records for required fields, null checks, and data integrity.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ValidationError,
  ValidationOptions,
  ValidationResult,
  Validator,
} from '../core/types.js';

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!(supabaseUrl && supabaseKey)) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Validation Rules
// ============================================================================

const REQUIRED_FIELDS = ['category', 'slug', 'title', 'description', 'content', 'author'];

const FIELD_CONSTRAINTS = {
  title: { minLength: 3, maxLength: 100 },
  description: { minLength: 10, maxLength: 500 },
  slug: { minLength: 3, maxLength: 100 },
  author: { minLength: 2, maxLength: 100 },
};

// ============================================================================
// Content Validator
// ============================================================================

export class ContentValidator implements Validator {
  name = 'content-validator';
  description = 'Validates content table records for required fields and data integrity';
  enabled = true;

  async validate(options: ValidationOptions): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Fetch all content records
      const { data: records, error: fetchError } = await supabase
        .from('content')
        .select('id, category, slug, title, description, content, author, created_at');

      if (fetchError) {
        errors.push({
          message: `Database query failed: ${fetchError.message}`,
          severity: 'error',
          code: 'DB_ERROR',
        });
        return this.buildResult(false, errors, warnings, 0, Date.now() - startTime);
      }

      if (!records || records.length === 0) {
        warnings.push({
          message: 'No content records found in database',
          severity: 'warning',
          code: 'EMPTY_DATABASE',
        });
        return this.buildResult(true, errors, warnings, 0, Date.now() - startTime);
      }

      // Validate each record
      for (const record of records) {
        this.validateRecord(record, errors, warnings);
      }

      const passed = errors.length === 0;
      return this.buildResult(passed, errors, warnings, records.length, Date.now() - startTime);
    } catch (error) {
      errors.push({
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'VALIDATION_ERROR',
      });
      return this.buildResult(false, errors, warnings, 0, Date.now() - startTime);
    }
  }

  private validateRecord(
    record: any,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const location = `${record.category}/${record.slug}`;

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!record[field] || (typeof record[field] === 'string' && record[field].trim() === '')) {
        errors.push({
          file: location,
          message: `Missing required field: ${field}`,
          severity: 'error',
          code: 'MISSING_FIELD',
          suggestion: `Add ${field} to content record`,
        });
      }
    }

    // Validate field lengths
    for (const [field, constraints] of Object.entries(FIELD_CONSTRAINTS)) {
      const value = record[field];
      if (value && typeof value === 'string') {
        if (value.length < constraints.minLength) {
          errors.push({
            file: location,
            message: `${field} too short: ${value.length} chars (min: ${constraints.minLength})`,
            severity: 'error',
            code: 'FIELD_TOO_SHORT',
          });
        }
        if (value.length > constraints.maxLength) {
          errors.push({
            file: location,
            message: `${field} too long: ${value.length} chars (max: ${constraints.maxLength})`,
            severity: 'error',
            code: 'FIELD_TOO_LONG',
          });
        }
      }
    }

    // Validate slug format (lowercase, alphanumeric + hyphens)
    if (record.slug && !/^[a-z0-9-]+$/.test(record.slug)) {
      errors.push({
        file: location,
        message: `Invalid slug format: ${record.slug}. Must be lowercase alphanumeric with hyphens`,
        severity: 'error',
        code: 'INVALID_SLUG',
      });
    }

    // Warn if created_at is missing (should be auto-generated)
    if (!record.created_at) {
      warnings.push({
        file: location,
        message: 'Missing created_at timestamp',
        severity: 'warning',
        code: 'MISSING_TIMESTAMP',
      });
    }
  }

  private buildResult(
    passed: boolean,
    errors: ValidationError[],
    warnings: ValidationError[],
    filesChecked: number,
    duration: number
  ): ValidationResult {
    return {
      validator: this.name,
      passed,
      errors,
      warnings,
      stats: {
        filesChecked,
        issues: errors.length + warnings.length,
        duration,
      },
      timestamp: new Date(),
    };
  }
}
