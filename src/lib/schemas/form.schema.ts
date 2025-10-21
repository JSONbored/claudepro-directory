/**
 * Production-grade form validation schemas
 * Type-specific schemas for plaintext content submission
 *
 * NO JSON REQUIRED - Users submit plaintext, we build JSON server-side
 */

import { z } from 'zod';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import {
  hookTypeFormSchema,
  statuslineTypeFormSchema,
} from '@/src/lib/schemas/primitives/content-enums';
import {
  trimOptionalStringOrEmpty,
  trimString,
} from '@/src/lib/schemas/primitives/sanitization-transforms';
import { VALIDATION_PATTERNS } from '@/src/lib/security/patterns';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';

/**
 * Base fields shared across all content types
 */
const baseSubmissionFields = {
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_.]+$/,
      'Name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
    )
    .transform(trimString),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .transform(trimString),

  category: z
    .string()
    .min(2, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),

  author: z
    .string()
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be less than 100 characters')
    .transform(trimString),

  github: z
    .string()
    .optional()
    .refine(
      (val) => !val || VALIDATION_PATTERNS.GITHUB_URL.test(val),
      'Must be a valid GitHub URL'
    ),

  tags: z
    .string()
    .optional()
    .transform(trimOptionalStringOrEmpty)
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 10);
    }),
};

/**
 * Agent submission schema - PLAINTEXT system prompt
 */
export const agentSubmissionSchema = z.object({
  type: z.literal('agents'),
  ...baseSubmissionFields,

  // Plaintext system prompt (NO JSON!)
  systemPrompt: nonEmptyString
    .min(50, 'System prompt must be at least 50 characters')
    .max(10000, 'System prompt is too long'),

  temperature: z.coerce.number().min(0).max(1).default(0.7),
  maxTokens: z.coerce.number().min(100).max(200000).default(8000),
});

/**
 * Rules submission schema - PLAINTEXT Claude expertise rules
 */
export const rulesSubmissionSchema = z.object({
  type: z.literal('rules'),
  ...baseSubmissionFields,

  // Plaintext Claude rules content (NO JSON!)
  rulesContent: nonEmptyString
    .min(50, 'Claude rules content must be at least 50 characters')
    .max(10000, 'Claude rules content is too long'),

  temperature: z.coerce.number().min(0).max(1).default(0.7),
  maxTokens: z.coerce.number().min(100).max(200000).default(8000),
});

/**
 * Commands submission schema - PLAINTEXT command markdown
 */
export const commandsSubmissionSchema = z.object({
  type: z.literal('commands'),
  ...baseSubmissionFields,

  // Plaintext command content with frontmatter (NO JSON!)
  commandContent: nonEmptyString
    .min(50, 'Command content must be at least 50 characters')
    .max(10000, 'Command content is too long'),
});

/**
 * Hooks submission schema - PLAINTEXT bash script
 */
export const hooksSubmissionSchema = z.object({
  type: z.literal('hooks'),
  ...baseSubmissionFields,

  // Plaintext bash script (NO JSON!)
  hookScript: nonEmptyString
    .min(20, 'Hook script must be at least 20 characters')
    .max(5000, 'Hook script is too long'),

  hookType: hookTypeFormSchema,
  triggeredBy: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      return val
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }),
});

/**
 * Statuslines submission schema - PLAINTEXT bash script
 */
export const statuslinesSubmissionSchema = z.object({
  type: z.literal('statuslines'),
  ...baseSubmissionFields,

  // Plaintext bash script (NO JSON!)
  statuslineScript: nonEmptyString
    .min(20, 'Statusline script must be at least 20 characters')
    .max(5000, 'Statusline script is too long'),

  statuslineType: statuslineTypeFormSchema,
  refreshInterval: z.coerce.number().min(100).max(10000).default(1000),
  position: z.enum(['left', 'right']).default('left'),
});

/**
 * MCP submission schema - Simplified fields (NO complex JSON!)
 */
export const mcpSubmissionSchema = z.object({
  type: z.literal('mcp'),
  ...baseSubmissionFields,

  npmPackage: nonEmptyString.max(200),
  serverType: z.enum(['stdio', 'sse', 'websocket']).default('stdio'),
  installCommand: nonEmptyString.max(500),
  configCommand: nonEmptyString.max(200),

  // Simplified - users describe tools in plaintext
  toolsDescription: z
    .string()
    .optional()
    .describe('Describe what tools/capabilities this server provides (plaintext)'),

  // Simplified - KEY=value format
  envVars: z
    .string()
    .optional()
    .describe('Environment variables in KEY=value format, one per line'),
});

/**
 * Skills submission schema - Task-focused capability guides (PDF, DOCX, PPTX, XLSX, etc.)
 */
export const skillsSubmissionSchema = z.object({
  type: z.literal('skills'),
  ...baseSubmissionFields,

  // Plaintext skill guide content
  skillContent: nonEmptyString
    .min(100, 'Skill content must be at least 100 characters')
    .max(15000, 'Skill content is too long (max 15000 characters)')
    .describe('Detailed skill guide content with examples and best practices'),

  // Optional requirements (comma-separated list)
  requirements: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return val
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
    })
    .describe('Required dependencies/tools (comma-separated)'),

  // Optional installation instructions
  installation: z
    .string()
    .max(2000, 'Installation instructions too long')
    .optional()
    .describe('Installation or setup instructions'),
});

/**
 * Union of all submission types
 */
export const configSubmissionSchema = z.discriminatedUnion('type', [
  agentSubmissionSchema,
  rulesSubmissionSchema,
  commandsSubmissionSchema,
  hooksSubmissionSchema,
  statuslinesSubmissionSchema,
  mcpSubmissionSchema,
  skillsSubmissionSchema,
]);

export type ConfigSubmissionInput = z.input<typeof configSubmissionSchema>;
export type ConfigSubmissionData = z.output<typeof configSubmissionSchema>;

/**
 * JSON-LD utilities (moved from previous version)
 * Production-grade: XSS sanitization + safeParse for round-trip safety
 *
 * CRITICAL FIX: Recursively sanitize all string values BEFORE validation
 * to prevent script tags in content from breaking JSON-LD rendering
 */

/**
 * Recursively sanitize object for JSON-LD safety
 * Escapes HTML tags, script tags, and javascript: protocols in all string values
 */
function sanitizeForJsonLd(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Escape dangerous patterns in strings
    return obj
      .replace(/</g, '\\u003c') // Escape < to prevent any HTML tags
      .replace(/>/g, '\\u003e') // Escape > for completeness
      .replace(/javascript:/gi, 'javascript\\u003a'); // Escape javascript: protocol
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForJsonLd(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeForJsonLd(value);
    }
    return sanitized;
  }

  // Primitives (numbers, booleans, null) pass through unchanged
  return obj;
}

export function validateJsonLdSafe(data: unknown): unknown {
  // Sanitize BEFORE validation to prevent content with HTML from failing
  const sanitized = sanitizeForJsonLd(data);

  // Validate the sanitized data
  const jsonString = JSON.stringify(sanitized);

  // Additional validation checks (should never fail now after sanitization)
  if (/<script\b/i.test(jsonString)) {
    throw new Error('Script tags detected after sanitization (should not happen)');
  }

  if (/javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol detected after sanitization (should not happen)');
  }

  // Production-grade: safeParse with permissive unknown schema for round-trip validation
  return safeParse(jsonString, z.unknown(), {
    strategy: ParseStrategy.VALIDATED_JSON,
  });
}

export function serializeJsonLd(data: unknown): string {
  const validated = validateJsonLdSafe(data);
  // Already sanitized in validateJsonLdSafe, but double-escape < for defense in depth
  return JSON.stringify(validated).replace(/</g, '\\u003c');
}
