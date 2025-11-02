/**
 * Metadata Validator - Database-First
 * Validates content.metadata JSONB for title/description lengths, SEO requirements, and schema compliance.
 */

import { createClient } from '@supabase/supabase-js';
import type { Tables } from '@/src/types/database.types';
import type { ValidationError, ValidationResult, Validator } from '../core/types.js';

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
// SEO Constraints
// ============================================================================

const SEO_CONSTRAINTS = {
  seo_title: { minLength: 30, maxLength: 60, optimal: 50 },
  keywords: { minCount: 3, maxCount: 10 },
};

// ============================================================================
// Metadata Validator
// ============================================================================

export class MetadataValidator implements Validator {
  name = 'metadata-validator';
  description = 'Validates content.metadata JSONB for SEO requirements and schema compliance';
  enabled = true;

  async validate(): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      // Fetch content records with metadata
      const { data: records, error: fetchError } = await supabase
        .from('content')
        .select('id, category, slug, seo_title, metadata');

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

      // Validate each record's metadata
      for (const record of records) {
        this.validateMetadata(record, errors, warnings);
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

  private validateMetadata(
    record: Tables<'content'>,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const location = `${record.category}/${record.slug}`;

    // Validate seo_title (column-level)
    if (record.seo_title) {
      const titleLength = record.seo_title.length;
      const constraints = SEO_CONSTRAINTS.seo_title;

      if (titleLength < constraints.minLength) {
        warnings.push({
          file: location,
          message: `SEO title too short: ${titleLength} chars (min: ${constraints.minLength}, optimal: ${constraints.optimal})`,
          severity: 'warning',
          code: 'SEO_TITLE_SHORT',
          suggestion: 'Expand title for better SEO',
        });
      }

      if (titleLength > constraints.maxLength) {
        errors.push({
          file: location,
          message: `SEO title too long: ${titleLength} chars (max: ${constraints.maxLength})`,
          severity: 'error',
          code: 'SEO_TITLE_LONG',
          suggestion: 'Shorten title to fit search results',
        });
      }

      if (titleLength >= constraints.minLength && titleLength <= constraints.optimal) {
        // Optimal length - no warning
      } else if (titleLength > constraints.optimal && titleLength <= constraints.maxLength) {
        warnings.push({
          file: location,
          message: `SEO title above optimal length: ${titleLength} chars (optimal: ${constraints.optimal})`,
          severity: 'warning',
          code: 'SEO_TITLE_SUBOPTIMAL',
        });
      }
    }

    // Validate metadata JSONB
    if (record.metadata) {
      const metadata = record.metadata;

      // Validate keywords array
      if (metadata.keywords && Array.isArray(metadata.keywords)) {
        const keywordCount = metadata.keywords.length;
        const constraints = SEO_CONSTRAINTS.keywords;

        if (keywordCount < constraints.minCount) {
          warnings.push({
            file: location,
            message: `Too few keywords: ${keywordCount} (min: ${constraints.minCount})`,
            severity: 'warning',
            code: 'KEYWORDS_FEW',
            suggestion: 'Add more relevant keywords for SEO',
          });
        }

        if (keywordCount > constraints.maxCount) {
          warnings.push({
            file: location,
            message: `Too many keywords: ${keywordCount} (max: ${constraints.maxCount})`,
            severity: 'warning',
            code: 'KEYWORDS_MANY',
            suggestion: 'Focus on most relevant keywords',
          });
        }

        // Check for duplicate keywords
        const uniqueKeywords = new Set(metadata.keywords.map((k: string) => k.toLowerCase()));
        if (uniqueKeywords.size !== metadata.keywords.length) {
          warnings.push({
            file: location,
            message: 'Duplicate keywords detected (case-insensitive)',
            severity: 'warning',
            code: 'KEYWORDS_DUPLICATE',
          });
        }
      }

      // Validate dateUpdated format (if present)
      if (metadata.dateUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.dateUpdated)) {
        errors.push({
          file: location,
          message: `Invalid dateUpdated format: ${metadata.dateUpdated} (expected: YYYY-MM-DD)`,
          severity: 'error',
          code: 'INVALID_DATE_FORMAT',
        });
      }

      // Validate difficulty level (if present)
      if (
        metadata.difficulty &&
        !['beginner', 'intermediate', 'advanced', 'expert'].includes(metadata.difficulty)
      ) {
        errors.push({
          file: location,
          message: `Invalid difficulty level: ${metadata.difficulty}`,
          severity: 'error',
          code: 'INVALID_DIFFICULTY',
          suggestion: 'Use: beginner, intermediate, advanced, or expert',
        });
      }
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
