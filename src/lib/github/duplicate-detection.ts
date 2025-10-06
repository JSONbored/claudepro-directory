/**
 * Duplicate Detection
 * Prevents duplicate content submissions
 */

import { contentExists, findSimilarContent } from './content-manager';
import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';
import { createClient } from '@/src/lib/supabase/server';
import { logger } from '@/src/lib/logger';

/**
 * Check for duplicate submissions
 * Returns information about potential duplicates
 */
export async function checkForDuplicates(
  type: ConfigSubmissionData['type'],
  slug: string,
  name: string
): Promise<{
  isDuplicate: boolean;
  reason?: string;
  suggestions?: string[];
}> {
  try {
    // Check if file already exists in repo
    const exists = await contentExists(type, slug);
    if (exists) {
      return {
        isDuplicate: true,
        reason: `A ${type} with the slug "${slug}" already exists.`,
      };
    }

    // Check for similar content (fuzzy matching)
    const similar = await findSimilarContent(type, slug);
    if (similar.length > 0) {
      return {
        isDuplicate: false,
        suggestions: similar,
      };
    }

    // Check for pending submissions in database
    const hasPendingSubmission = await checkPendingSubmissions(type, slug);
    if (hasPendingSubmission) {
      return {
        isDuplicate: true,
        reason: `A submission for "${name}" is already pending review.`,
      };
    }

    return {
      isDuplicate: false,
    };
  } catch (error) {
    logger.error('Duplicate detection failed', error instanceof Error ? error : new Error(String(error)));
    // Don't block submissions on duplicate check errors
    return {
      isDuplicate: false,
    };
  }
}

/**
 * Check if there's already a pending submission for this slug
 */
async function checkPendingSubmissions(
  type: ConfigSubmissionData['type'],
  slug: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('submissions')
      .select('id')
      .eq('content_type', type)
      .eq('content_slug', slug)
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (not an error for us)
      throw error;
    }

    return !!data;
  } catch (error) {
    logger.error('Failed to check pending submissions', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
}

/**
 * Validate submission against existing content
 * Additional quality checks beyond duplicate detection
 */
export async function validateSubmission(data: {
  type: ConfigSubmissionData['type'];
  name: string;
  slug: string;
  description: string;
  tags: string[];
}): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check name length
  if (data.name.length < 3) {
    errors.push('Name is too short (minimum 3 characters)');
  }

  if (data.name.length > 100) {
    errors.push('Name is too long (maximum 100 characters)');
  }

  // Check description quality
  if (data.description.length < 20) {
    warnings.push('Description is quite short. Consider adding more details.');
  }

  // Check tag count
  if (data.tags.length === 0) {
    warnings.push('No tags provided. Tags help users find your content.');
  }

  if (data.tags.length > 10) {
    errors.push('Too many tags (maximum 10)');
  }

  // Check slug format
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug contains invalid characters (use only lowercase letters, numbers, and hyphens)');
  }

  if (data.slug.length > 100) {
    errors.push('Slug is too long (maximum 100 characters)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
