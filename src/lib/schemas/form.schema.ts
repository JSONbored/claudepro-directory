/**
 * Production-grade form validation schemas
 * Type-specific schemas for plaintext content submission
 * 
 * NO JSON REQUIRED - Users submit plaintext, we build JSON server-side
 */

import { z } from 'zod';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { VALIDATION_PATTERNS } from '@/src/lib/security/patterns';

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
    .transform((val) => val.trim()),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .transform((val) => val.trim()),

  category: z
    .string()
    .min(2, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),

  author: z
    .string()
    .min(2, 'Author name must be at least 2 characters')
    .max(100, 'Author name must be less than 100 characters')
    .transform((val) => val.trim()),

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
    .transform((val) => val?.trim() || '')
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
  
  hookType: z.enum(['pre-tool-use', 'post-tool-use', 'pre-command', 'post-command']),
  triggeredBy: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      return val.split(',').map((t) => t.trim()).filter(Boolean);
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
  
  statuslineType: z.enum(['custom', 'minimal', 'extended']).default('custom'),
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
 * Union of all submission types
 */
export const configSubmissionSchema = z.discriminatedUnion('type', [
  agentSubmissionSchema,
  rulesSubmissionSchema,
  commandsSubmissionSchema,
  hooksSubmissionSchema,
  statuslinesSubmissionSchema,
  mcpSubmissionSchema,
]);

export type ConfigSubmissionInput = z.input<typeof configSubmissionSchema>;
export type ConfigSubmissionData = z.output<typeof configSubmissionSchema>;

/**
 * JSON-LD utilities (moved from previous version)
 */
export function validateJsonLdSafe(data: unknown): unknown {
  const jsonString = JSON.stringify(data);
  
  if (/<script\b/i.test(jsonString)) {
    throw new Error('Script tags are not allowed in JSON-LD data');
  }
  
  if (/javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol not allowed in JSON-LD data');
  }
  
  return JSON.parse(jsonString);
}

export function serializeJsonLd(data: unknown): string {
  const validated = validateJsonLdSafe(data);
  return JSON.stringify(validated).replace(/</g, '\\u003c');
}
