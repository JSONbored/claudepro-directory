/**
 * Email Capture Schema
 * Validation for post-copy email capture modal
 *
 * Extends newsletter signup schema with copy context tracking
 */

import { z } from 'zod';
import { newsletterSignupSchema } from './newsletter.schema';

/**
 * Post-copy email capture schema
 * Captures email with additional context about the copy action that triggered it
 */
export const postCopyEmailCaptureSchema = newsletterSignupSchema.extend({
  // Copy context tracking
  copyType: z
    .enum(['llmstxt', 'markdown', 'code', 'link'])
    .optional()
    .describe('Type of content that was copied'),

  copyCategory: z.string().max(50).optional().describe('Content category (agents, mcp, etc.)'),

  copySlug: z.string().max(200).optional().describe('Content slug identifier'),
});

/**
 * Type inference for input
 */
export type PostCopyEmailCaptureInput = z.input<typeof postCopyEmailCaptureSchema>;

/**
 * Type inference for output (after transformation)
 */
export type PostCopyEmailCaptureData = z.output<typeof postCopyEmailCaptureSchema>;
