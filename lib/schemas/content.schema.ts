/**
 * Content Type Validation Schemas
 * Production-grade validation for all content types with security-first approach
 * Designed to validate content from potentially hostile sources
 */

import { z } from 'zod';

/**
 * Security constants for content validation
 */
const CONTENT_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_SLUG_LENGTH: 100,
  MAX_AUTHOR_LENGTH: 100,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS_COUNT: 30,
  MAX_URL_LENGTH: 2048,
  MAX_CONTENT_LENGTH: 1000000, // 1MB
  MAX_VERSION_LENGTH: 50,
  MAX_CATEGORY_LENGTH: 50,
  MAX_COMMAND_SYNTAX_LENGTH: 500,
  MAX_REQUIREMENTS: 50,
  MAX_BENEFITS: 30,
  MAX_TOOLS: 100,
  MAX_CONFIG_VALUE_LENGTH: 10000,
} as const;

/**
 * Shared validation patterns
 */
const PATTERNS = {
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  VERSION:
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?(?:\+([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?$/,
  GITHUB_USERNAME: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
  GITHUB_URL: /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\/.*)?$/,
  NPM_PACKAGE: /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/,
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/,
} as const;

/**
 * Base metadata schema shared by all content types
 * Updated to match actual production content structure
 */
export const contentMetadataSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(CONTENT_LIMITS.MAX_SLUG_LENGTH)
    .regex(PATTERNS.SLUG, 'Invalid slug format')
    .transform((val) => val.toLowerCase()),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(CONTENT_LIMITS.MAX_DESCRIPTION_LENGTH)
    .refine((val) => !val.includes('<script'), 'Description contains invalid content'),

  category: z.string().min(1).max(CONTENT_LIMITS.MAX_CATEGORY_LENGTH),

  author: z
    .string()
    .min(1, 'Author is required')
    .max(CONTENT_LIMITS.MAX_AUTHOR_LENGTH)
    .refine((val) => !val.includes('<'), 'Author contains invalid characters'),

  githubUsername: z.string().regex(PATTERNS.GITHUB_USERNAME, 'Invalid GitHub username').optional(),

  dateAdded: z.string().regex(PATTERNS.ISO_DATE, 'Invalid date format').or(z.string().datetime()),

  lastModified: z
    .string()
    .regex(PATTERNS.ISO_DATE, 'Invalid date format')
    .or(z.string().datetime())
    .optional(),

  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(CONTENT_LIMITS.MAX_TAG_LENGTH)
        .regex(
          /^[a-zA-Z0-9\-_]+$/,
          'Tags can only contain alphanumeric characters, hyphens, and underscores'
        )
    )
    .max(CONTENT_LIMITS.MAX_TAGS_COUNT, `Maximum ${CONTENT_LIMITS.MAX_TAGS_COUNT} tags allowed`)
    .default([]),

  popularity: z.number().int().min(0).max(100).optional(),
  views: z.number().int().min(0).optional(),
  downloads: z.number().int().min(0).optional(),
  stars: z.number().int().min(0).optional(),
});

/**
 * Shared configuration schema for all content types with security validation
 */
export const contentConfigurationSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(1000000).optional(),
    systemPrompt: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),
    model: z.string().max(100).optional(),
    apiKey: z.string().max(500).optional(),
    endpoint: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),
    timeout: z.number().int().min(100).max(300000).optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
    enabled: z.boolean().optional(),
    permissions: z.array(z.string().max(50)).max(100).optional(),
    requiresAuth: z.boolean().optional(),
    authType: z.enum(['basic', 'bearer', 'oauth', 'api-key']).optional(),
    features: z.array(z.string().max(100)).max(100).optional(),
    options: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Ensure no script injection in string fields
      const stringValues = Object.values(data).filter((v) => typeof v === 'string');
      return !stringValues.some((v) => v?.includes('<script'));
    },
    { message: 'Configuration contains potentially malicious content' }
  );

/**
 * Agent content schema - matches actual production content structure
 */
export const agentContentSchema = contentMetadataSchema.extend({
  content: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),

  features: z.array(z.string().max(500)).max(50).optional(),

  useCases: z.array(z.string().max(500)).max(50).optional(),

  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('community'),

  documentationUrl: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),

  configuration: contentConfigurationSchema.optional(),
});

/**
 * MCP Server content schema - matches actual production content structure
 */
export const mcpServerContentSchema = contentMetadataSchema.extend({
  content: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),

  features: z.array(z.string().max(500)).max(50).optional(),

  useCases: z.array(z.string().max(500)).max(50).optional(),

  package: z.string().max(200).nullable().optional(),

  installation: z.union([z.string().max(2000), z.object({}).passthrough()]).optional(),

  configLocation: z.string().max(500).optional(),

  requiresAuth: z.boolean().optional(),

  security: z.union([z.string().max(1000), z.array(z.string().max(200))]).optional(),

  troubleshooting: z.union([z.string().max(2000), z.array(z.string().max(500))]).optional(),

  examples: z.array(z.string().max(1000)).max(10).optional(),

  permissions: z.array(z.string().max(100)).max(20).optional(),

  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('community'),

  documentationUrl: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),

  configuration: z
    .union([
      contentConfigurationSchema,
      z
        .object({
          claudeDesktop: z
            .record(
              z.string(),
              z.object({
                command: z.string().max(500).optional(),
                args: z.array(z.string().max(200)).optional(),
                env: z.record(z.string(), z.string().max(1000)).optional(),
                transport: z.string().max(50).optional(),
              })
            )
            .optional(),
          claudeCode: z
            .record(
              z.string(),
              z.object({
                command: z.string().max(500).optional(),
                args: z.array(z.string().max(200)).optional(),
                env: z.record(z.string(), z.string().max(1000)).optional(),
                transport: z.string().max(50).optional(),
              })
            )
            .optional(),
        })
        .passthrough(),
    ])
    .optional(),
});

/**
 * Hook content schema - matches actual production content structure
 */
export const hookContentSchema = contentMetadataSchema.extend({
  hookType: z.string().max(100).optional(),

  features: z.array(z.string().max(500)).max(50).optional(),

  useCases: z.array(z.string().max(500)).max(50).optional(),

  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('community'),

  documentationUrl: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),

  configuration: z
    .union([
      contentConfigurationSchema,
      z
        .object({
          hookConfig: z
            .object({
              hooks: z
                .record(
                  z.string(),
                  z.union([
                    z.object({
                      script: z.string().max(500),
                      matchers: z.array(z.string().max(100)).optional(),
                      timeout: z.number().int().min(100).max(300000).optional(),
                      description: z.string().max(500).optional(),
                    }),
                    z.array(
                      z.object({
                        matchers: z.array(z.string().max(100)).optional(),
                        description: z.string().max(500).optional(),
                        timeout: z.number().int().min(100).max(300000).optional(),
                      })
                    ),
                  ])
                )
                .optional(),
              scriptContent: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),
            })
            .optional(),
        })
        .passthrough(),
    ])
    .optional(),
});

/**
 * Command content schema - matches actual production content structure
 */
export const commandContentSchema = contentMetadataSchema.extend({
  content: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),

  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('community'),

  documentationUrl: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),

  githubUrl: z.string().url().regex(PATTERNS.GITHUB_URL, 'Must be a GitHub URL').optional(),

  configuration: contentConfigurationSchema.optional(),
});

/**
 * Rule content schema - matches actual production content structure
 */
export const ruleContentSchema = contentMetadataSchema.extend({
  content: z.string().max(CONTENT_LIMITS.MAX_CONTENT_LENGTH).optional(),

  source: z
    .enum(['community', 'official', 'verified', 'claudepro'])
    .optional()
    .default('community'),

  documentationUrl: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),

  githubUrl: z.string().url().regex(PATTERNS.GITHUB_URL, 'Must be a GitHub URL').optional(),

  configuration: contentConfigurationSchema.optional(),
});

/**
 * Job posting content schema
 */
export const jobContentSchema = contentMetadataSchema.extend({
  title: z.string().min(5).max(CONTENT_LIMITS.MAX_TITLE_LENGTH),

  company: z.string().min(2).max(100),

  companyLogo: z.string().url().max(CONTENT_LIMITS.MAX_URL_LENGTH).optional(),

  location: z.string().min(2).max(200),

  remote: z.boolean(),

  type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'freelance']),

  salary: z
    .string()
    .max(100)
    .regex(/^[\d$£€¥,.\-kKmM ]+$/, 'Invalid salary format')
    .optional(),

  requirements: z
    .array(z.string().min(1).max(500))
    .min(1, 'At least one requirement is needed')
    .max(CONTENT_LIMITS.MAX_REQUIREMENTS),

  benefits: z.array(z.string().min(1).max(200)).max(CONTENT_LIMITS.MAX_BENEFITS).optional(),

  applyUrl: z.string().url('Valid apply URL is required').max(CONTENT_LIMITS.MAX_URL_LENGTH),

  contactEmail: z.string().email('Valid email is required').regex(PATTERNS.EMAIL).optional(),

  experienceLevel: z.enum(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']).optional(),

  department: z.string().max(100).optional(),

  postedAt: z.string().regex(PATTERNS.ISO_DATE).or(z.string().datetime()),

  expiresAt: z.string().regex(PATTERNS.ISO_DATE).or(z.string().datetime()).optional(),
});

/**
 * Helper function to validate content based on type
 */
export function validateContent(type: string, data: unknown) {
  switch (type) {
    case 'agent':
    case 'agents':
      return agentContentSchema.parse(data);
    case 'mcp':
      return mcpServerContentSchema.parse(data);
    case 'hook':
    case 'hooks':
      return hookContentSchema.parse(data);
    case 'command':
    case 'commands':
      return commandContentSchema.parse(data);
    case 'rule':
    case 'rules':
      return ruleContentSchema.parse(data);
    case 'job':
    case 'jobs':
      return jobContentSchema.parse(data);
    default:
      throw new Error(`Unknown content type: ${type}`);
  }
}

/**
 * Helper to create a safe content validator with error handling
 */
export function createContentValidator<T extends z.ZodTypeAny>(schema: T) {
  return (data: unknown): z.infer<T> | null => {
    const result = schema.safeParse(data);
    if (result.success) {
      return result.data;
    }
    console.error('Content validation failed:', result.error.issues);
    return null;
  };
}

/**
 * Type exports
 */
export type ContentMetadata = z.infer<typeof contentMetadataSchema>;
export type AgentContent = z.infer<typeof agentContentSchema>;
export type MCPServerContent = z.infer<typeof mcpServerContentSchema>;
export type HookContent = z.infer<typeof hookContentSchema>;
export type CommandContent = z.infer<typeof commandContentSchema>;
export type RuleContent = z.infer<typeof ruleContentSchema>;
export type JobContent = z.infer<typeof jobContentSchema>;
export type ContentConfiguration = z.infer<typeof contentConfigurationSchema>;
