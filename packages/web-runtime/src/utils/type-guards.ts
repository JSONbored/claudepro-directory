/**
 * Type Guard Utilities
 * 
 * Provides runtime type validation functions to replace type assertions
 * and ensure type safety at runtime.
 */

import { Constants, type Database } from '@heyclaude/database-types';

/**
 * Type guard for content_category enum
 */
export function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return Constants.public.Enums.content_category.includes(
    value as Database['public']['Enums']['content_category']
  );
}

/**
 * Type guard for job_type enum (used for employment type in filter_jobs)
 */
export function isValidJobType(
  value: string
): value is Database['public']['Enums']['job_type'] {
  return Constants.public.Enums.job_type.includes(
    value as Database['public']['Enums']['job_type']
  );
}

/**
 * Type guard for experience_level enum (used in filter_jobs)
 */
export function isValidExperienceLevel(
  value: string
): value is Database['public']['Enums']['experience_level'] {
  return Constants.public.Enums.experience_level.includes(
    value as Database['public']['Enums']['experience_level']
  );
}

/**
 * Type guard for job_category enum
 */
export function isValidJobCategory(
  value: string
): value is Database['public']['Enums']['job_category'] {
  return Constants.public.Enums.job_category.includes(
    value as Database['public']['Enums']['job_category']
  );
}
