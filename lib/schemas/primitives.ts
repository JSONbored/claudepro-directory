/**
 * Schema Primitives
 * Common Zod schema primitives used across the application
 * Provides consistent validation patterns and type safety
 */

import { z } from 'zod';

/**
 * String primitives
 */

// Non-empty string (minimum 1 character)
export const nonEmptyString = z.string().min(1);

// Short string (max 50-100 characters, suitable for titles, names)
export const shortString = z.string().max(100);

// Medium string (max 500 characters, suitable for descriptions)
export const mediumString = z.string().max(500);

// URL string
export const urlString = z.string().url();

// Optional URL string
export const optionalUrlString = z.string().url().optional();

// ISO datetime string
export const isoDatetimeString = z.string().datetime();

/**
 * Number primitives
 */

// Positive integer (greater than 0)
export const positiveInt = z.number().int().positive();

// Non-negative integer (0 or greater)
export const nonNegativeInt = z.number().int().min(0);

// Percentage (0-100)
export const percentage = z.number().min(0).max(100);

/**
 * Array primitives
 */

// Array of strings
export const stringArray = z.array(z.string());

// Array of non-empty strings
export const nonEmptyStringArray = z.array(z.string().min(1));

/**
 * Type exports for convenience
 */
export type NonEmptyString = z.infer<typeof nonEmptyString>;
export type ShortString = z.infer<typeof shortString>;
export type MediumString = z.infer<typeof mediumString>;
export type UrlString = z.infer<typeof urlString>;
export type OptionalUrlString = z.infer<typeof optionalUrlString>;
export type IsoDatetimeString = z.infer<typeof isoDatetimeString>;
export type PositiveInt = z.infer<typeof positiveInt>;
export type NonNegativeInt = z.infer<typeof nonNegativeInt>;
export type Percentage = z.infer<typeof percentage>;
export type StringArray = z.infer<typeof stringArray>;
export type NonEmptyStringArray = z.infer<typeof nonEmptyStringArray>;
