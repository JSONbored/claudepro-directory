/**
 * Production-grade analytics event validation schemas
 * Security-first approach to prevent data corruption and ensure integrity
 */

import { z } from "zod";
import { viewCount } from "@/src/lib/schemas/primitives/base-numbers";
import { nonEmptyString } from "@/src/lib/schemas/primitives/base-strings";
import { type ContentCategory, contentCategorySchema } from "./shared.schema";

/**
 * Branded slug validation for content identifiers
 * Provides compile-time type safety for content slugs
 */
const contentSlugSchema = nonEmptyString
  .max(200, "Content slug is too long")
  .regex(
    /^[a-zA-Z0-9-_/]+$/,
    "Slug can only contain letters, numbers, hyphens, underscores, and forward slashes",
  )
  .transform((val) => val.toLowerCase().trim())
  .brand<"ContentSlug">()
  .describe(
    "Validated content identifier slug with alphanumeric characters, hyphens, underscores, and slashes (max 200 chars)",
  );

/**
 * Umami analytics event data schema
 * Strict validation for production analytics tracking
 */
export const umamiEventDataSchema = z
  .record(
    nonEmptyString.max(50).describe("Event property key (max 50 chars)"),
    z
      .union([z.string().max(500), z.number(), z.boolean(), z.null()])
      .describe(
        "Event property value (string max 500 chars, number, boolean, or null)",
      ),
  )
  .describe("Record of event properties for Umami analytics tracking");

export type UmamiEventData = z.infer<typeof umamiEventDataSchema>;

/**
 * Umami Global Interface Schema
 * Represents the global umami tracking object
 */
const umamiGlobalSchema = z
  .object({
    track: z
      .custom<
        (
          eventName: string,
          data?: Record<string, string | number | boolean | null>,
        ) => void
      >((val) => typeof val === "function", { message: "Expected a track function" })
      .describe("Function to track custom events"),
    identify: z
      .custom<
        (data: Record<string, string | number | boolean | null>) => void
      >((val) => typeof val === "function", { message: "Expected an identify function" })
      .describe("Function to identify users with traits"),
  })
  .describe(
    "Schema for global Umami tracking interface with track and identify methods",
  );

export type UmamiGlobal = z.infer<typeof umamiGlobalSchema>;

/**
 * Analytics response schema
 */
export const analyticsResponseSchema = z
  .object({
    success: z.boolean().describe("Whether the analytics operation succeeded"),
    message: z.string().optional().describe("Optional status or error message"),
    viewCount: viewCount.optional().describe("Optional view count result"),
    data: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Optional additional response data"),
  })
  .describe(
    "Schema for analytics API response with success status and optional data",
  );

export type AnalyticsResponse = z.infer<typeof analyticsResponseSchema>;

/**
 * Helper function to validate tracking parameters
 */
export function validateTrackingParams(
  category: unknown,
  slug: unknown,
): { category: ContentCategory; slug: string } {
  const validatedCategory = contentCategorySchema.parse(category);
  const validatedSlug = contentSlugSchema.parse(slug);

  return {
    category: validatedCategory,
    slug: validatedSlug,
  };
}

// Global interface declarations for Umami are handled in global.d.ts
// This file focuses on data validation schemas only
