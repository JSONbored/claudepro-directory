/**
 * Validation Primitives - User input, env vars, runtime schemas only
 * Database validates content via CHECK constraints and validate_content_metadata()
 */

import { z } from 'zod';
import { SECURITY_CONFIG } from '@/src/lib/constants';

export const nonEmptyString = z.string().min(1);
export const shortString = z.string().min(1).max(100);
export const urlString = z.string().url();
export const isoDateString = z.string();
export const isoDatetimeString = z.string().datetime();
export const slugString = z
  .string()
  .min(1, 'Slug cannot be empty')
  .max(100, 'Slug too long (max 100 characters)')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Invalid slug: use lowercase letters, numbers, and single hyphens'
  )
  .transform((val) => val.toLowerCase());
export const optionalUrlString = z.string().url().optional();

export const githubUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return SECURITY_CONFIG.trustedHostnames.github.includes(
          urlObj.hostname as 'github.com' | 'www.github.com'
        );
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid GitHub URL (github.com or www.github.com)' }
  );
export const optionalGithubUrl = githubUrl.optional();

export const positiveInt = z.number().int().positive();
export const nonNegativeInt = z.number().int().min(0);
export const percentage = z.number().min(0).max(100);
export const aiTemperature = z.number().min(0).max(2);
export const timeoutMs = z.number().int().min(100).max(300000);
export const imageDimension = z.number().int().min(200).max(2000);
export const viewCount = z.number().int().min(0);
export const optionalPositiveInt = z.number().int().positive().optional();

export const stringArray = z.array(z.string());
export const nonEmptyStringArray = z.array(nonEmptyString);
export const requiredTagArray = z.array(nonEmptyString).min(1);

export const MAX_STACK_TRACE_LENGTH = 5000;

const errorType = nonEmptyString.max(100).transform((val) => val.replace(/[^\w\s-]/g, ''));
const errorSeverity = z.enum(['low', 'medium', 'high', 'critical']).default('medium');

export type ErrorType = z.infer<typeof errorType>;
export type ErrorSeverity = z.infer<typeof errorSeverity>;
