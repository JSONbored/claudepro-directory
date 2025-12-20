/**
 * Type Guard Utilities
 *
 * Provides runtime type validation functions to replace type assertions
 * and ensure type safety at runtime.
 */

import type {
  content_category,
  job_type,
  experience_level,
  job_category,
} from '@prisma/client';
import {
  content_category as ContentCategory,
  job_type as JobType,
  experience_level as ExperienceLevel,
  job_category as JobCategory,
} from '@prisma/client';

/**
 * Type guard for content_category enum
 */
export function isValidContentCategory(value: string): value is content_category {
  return (Object.values(ContentCategory) as readonly content_category[]).includes(
    value as content_category
  );
}

/**
 * Type guard for job_type enum (used for employment type in filter_jobs)
 */
export function isValidJobType(value: string): value is job_type {
  return (Object.values(JobType) as readonly job_type[]).includes(value as job_type);
}

/**
 * Type guard for experience_level enum (used in filter_jobs)
 */
export function isValidExperienceLevel(value: string): value is experience_level {
  return (Object.values(ExperienceLevel) as readonly experience_level[]).includes(
    value as experience_level
  );
}

/**
 * Type guard for job_category enum
 */
export function isValidJobCategory(value: string): value is job_category {
  return (Object.values(JobCategory) as readonly job_category[]).includes(value as job_category);
}
