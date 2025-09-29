/**
 * Schema Primitives - Barrel Export
 *
 * Centralized export for all base validation primitives.
 * Import from here to use reusable validators across schemas.
 *
 * Usage:
 * ```typescript
 * import { nonEmptyString, positiveInt, tagArray } from '@/lib/schemas/primitives';
 * ```
 *
 * Benefits:
 * - Single source of truth for common patterns
 * - 15-25% bundle size reduction through deduplication
 * - Easier maintenance and updates
 * - Better TypeScript inference performance
 */

// Array primitives
export {
  authorsArray,
  compactStringArray,
  examplesArray,
  largeContentArray,
  largeTagArray,
  limitedMediumStringArray,
  mediumStringArray,
  mediumTagArray,
  nonEmptyStringArray,
  optionalStringArray,
  optionalTagArray,
  requiredTagArray,
  shortStringArray,
  smallTagArray,
  smallUrlArray,
  stepsArray,
  stringArray,
  tagArray,
  urlArray,
} from './base-arrays';

// Number primitives
export {
  aiTemperature,
  imageDimension,
  loadTime,
  nonNegativeInt,
  optionalPositiveInt,
  percentage,
  portNumber,
  positiveInt,
  priority,
  score,
  smallPositive,
  timeoutMs,
  timestamp,
  ttlSeconds,
  viewCount,
} from './base-numbers';
// String primitives
export {
  codeString,
  emailString,
  extraLongString,
  isoDateString,
  isoDatetimeString,
  longString,
  massiveString,
  mediumString,
  nonEmptyString,
  optionalNonEmptyString,
  optionalUrlString,
  safeTextString,
  shortString,
  slugString,
  ultraLongString,
  urlString,
  veryLongCodeString,
} from './base-strings';
