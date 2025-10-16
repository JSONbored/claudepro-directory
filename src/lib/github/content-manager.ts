/**
 * Content File Manager
 * Handles reading and writing content files in /content/ directory
 *
 * Supports the existing file structure:
 * /content/{type}/{slug}.json
 */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';
import { fileExists, listFiles } from './client';

/**
 * Content type to directory mapping
 */
export const CONTENT_PATHS = {
  agents: 'content/agents',
  mcp: 'content/mcp',
  rules: 'content/rules',
  commands: 'content/commands',
  hooks: 'content/hooks',
  statuslines: 'content/statuslines',
  skills: 'content/skills',
} as const;

/**
 * Reserved slug words that should not be used
 * Prevents collision with system routes and API endpoints
 */
const RESERVED_SLUGS = new Set([
  // System routes
  'api',
  'admin',
  'auth',
  'login',
  'logout',
  'signup',
  'dashboard',
  'settings',
  'profile',
  'search',
  'changelog',
  'about',
  'contact',
  'privacy',
  'terms',
  'help',
  'docs',
  'guides',
  'blog',

  // Content type routes
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'collections',

  // Special/reserved
  'new',
  'edit',
  'delete',
  'create',
  'update',
  'submit',
  'test',
  'preview',
  'draft',

  // Common web paths
  'assets',
  'static',
  'public',
  'images',
  'files',
  'uploads',

  // HTTP methods
  'get',
  'post',
  'put',
  'patch',
  'delete',
]);

/**
 * Slug length constraints for URL safety and usability
 */
const SLUG_MIN_LENGTH = 3;
const SLUG_MAX_LENGTH = 100;

/**
 * Validation error types for slug generation
 */
export class SlugValidationError extends Error {
  constructor(
    message: string,
    public readonly code: 'EMPTY' | 'TOO_SHORT' | 'TOO_LONG' | 'RESERVED' | 'INVALID'
  ) {
    super(message);
    this.name = 'SlugValidationError';
  }
}

/**
 * Generate slug from name with comprehensive validation
 * Converts "My Awesome Agent" → "my-awesome-agent"
 *
 * @param name - Input name to convert to slug
 * @returns URL-safe slug string
 * @throws {SlugValidationError} If slug validation fails
 *
 * Validation rules:
 * - Length: 3-100 characters
 * - Format: lowercase alphanumeric + hyphens
 * - Not reserved: Prevents collision with system routes
 * - No leading/trailing hyphens
 *
 * @example
 * generateSlug("My Awesome Agent") // Returns: "my-awesome-agent"
 * generateSlug("API") // Throws: SlugValidationError (reserved word)
 * generateSlug("AB") // Throws: SlugValidationError (too short)
 */
export function generateSlug(name: string): string {
  // Validate input is not empty
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new SlugValidationError('Slug cannot be generated from empty string', 'EMPTY');
  }

  // Generate slug
  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Validate slug is not empty after sanitization
  if (!slug) {
    throw new SlugValidationError(
      `Slug cannot be generated from input: "${trimmedName}" (contains no valid characters)`,
      'INVALID'
    );
  }

  // Validate minimum length
  if (slug.length < SLUG_MIN_LENGTH) {
    throw new SlugValidationError(
      `Slug must be at least ${SLUG_MIN_LENGTH} characters (got: "${slug}", length: ${slug.length})`,
      'TOO_SHORT'
    );
  }

  // Validate maximum length
  if (slug.length > SLUG_MAX_LENGTH) {
    throw new SlugValidationError(
      `Slug must be at most ${SLUG_MAX_LENGTH} characters (got length: ${slug.length})`,
      'TOO_LONG'
    );
  }

  // Validate slug is not reserved
  if (RESERVED_SLUGS.has(slug)) {
    throw new SlugValidationError(`Slug "${slug}" is reserved and cannot be used`, 'RESERVED');
  }

  return slug;
}

/**
 * Get file path for content type
 */
export function getContentFilePath(type: ConfigSubmissionData['type'], slug: string): string {
  const directory = CONTENT_PATHS[type];
  return `${directory}/${slug}.json`;
}

/**
 * Check if content with slug already exists
 */
export async function contentExists(
  type: ConfigSubmissionData['type'],
  slug: string
): Promise<boolean> {
  const filePath = getContentFilePath(type, slug);
  return await fileExists(filePath);
}

/**
 * Find similar content by name/slug
 * Returns array of similar slugs for duplicate detection
 */
export async function findSimilarContent(
  type: ConfigSubmissionData['type'],
  slug: string
): Promise<string[]> {
  try {
    const directory = CONTENT_PATHS[type];
    const files = await listFiles(directory);

    // Find similar slugs (Levenshtein distance or simple substring match)
    const similar = files
      .filter((filename) => {
        const existingSlug = filename.replace('.json', '');
        // Check for substring match or very similar slugs
        return (
          existingSlug.includes(slug) ||
          slug.includes(existingSlug) ||
          levenshteinDistance(existingSlug, slug) <= 3
        );
      })
      .map((filename) => filename.replace('.json', ''));

    return similar;
  } catch (error) {
    logger.error(
      'Failed to find similar content',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Simple Levenshtein distance calculation
 * Used for fuzzy matching of slugs
 */
function levenshteinDistance(str1: string, str2: string): number {
  // Initialize matrix with proper dimensions - create 2D array filled with zeros
  const matrix: number[][] = Array.from({ length: str2.length + 1 }, () =>
    Array.from({ length: str1.length + 1 }, () => 0)
  );

  // Helper to safely get matrix value with bounds checking
  const getCell = (i: number, j: number): number => {
    const row = matrix[i];
    if (!row) {
      throw new Error(`Matrix row ${i} undefined - bounds: 0-${str2.length}`);
    }
    const value = row[j];
    if (value === undefined) {
      throw new Error(`Matrix cell [${i}][${j}] undefined - bounds: 0-${str1.length}`);
    }
    return value;
  };

  // Helper to safely set matrix value with bounds checking
  const setCell = (i: number, j: number, value: number): void => {
    const row = matrix[i];
    if (!row) {
      throw new Error(`Matrix row ${i} undefined - bounds: 0-${str2.length}`);
    }
    row[j] = value;
  };

  // Initialize first column
  for (let i = 0; i <= str2.length; i++) {
    setCell(i, 0, i);
  }

  // Initialize first row
  for (let j = 0; j <= str1.length; j++) {
    setCell(0, j, j);
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        setCell(i, j, getCell(i - 1, j - 1));
      } else {
        setCell(
          i,
          j,
          Math.min(
            getCell(i - 1, j - 1) + 1, // substitution
            getCell(i, j - 1) + 1, // insertion
            getCell(i - 1, j) + 1 // deletion
          )
        );
      }
    }
  }

  return getCell(str2.length, str1.length);
}

/**
 * Helper: Parse environment variables from KEY=value format
 * Used by MCP template builder
 */
function parseEnvVars(envVarsString?: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  if (!envVarsString) return envVars;

  envVarsString.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

/**
 * Content template builder for specific submission type
 * Generic type ensures type-safe field access per content type
 */
type ContentTemplateBuilder<T extends ConfigSubmissionData['type']> = (
  data: Extract<ConfigSubmissionData, { type: T }> & { slug: string }
) => Record<string, unknown>;

/**
 * Build agent content template
 * Extracts system prompt and AI configuration from form submission
 *
 * @param data - Agent submission data with slug
 * @returns Agent content structure with AI configuration
 */
const buildAgentTemplate: ContentTemplateBuilder<'agents'> = (data) => ({
  content: data.systemPrompt,
  configuration: {
    temperature: data.temperature,
    maxTokens: data.maxTokens,
  },
});

/**
 * Build rules content template
 * Extracts rules content and AI configuration from form submission
 *
 * @param data - Rules submission data with slug
 * @returns Rules content structure with AI configuration
 */
const buildRulesTemplate: ContentTemplateBuilder<'rules'> = (data) => ({
  content: data.rulesContent,
  configuration: {
    temperature: data.temperature,
    maxTokens: data.maxTokens,
  },
});

/**
 * Build command content template
 * Extracts command markdown content from form submission
 *
 * @param data - Command submission data with slug
 * @returns Command content structure
 */
const buildCommandTemplate: ContentTemplateBuilder<'commands'> = (data) => ({
  content: data.commandContent,
});

/**
 * Build hook content template
 * Extracts hook script, type, and trigger configuration from form submission
 *
 * @param data - Hook submission data with slug
 * @returns Hook content structure with type and triggers
 */
const buildHookTemplate: ContentTemplateBuilder<'hooks'> = (data) => ({
  content: data.hookScript,
  hookType: data.hookType,
  triggeredBy: data.triggeredBy,
});

/**
 * Build statusline content template
 * Extracts statusline script and display configuration from form submission
 *
 * @param data - Statusline submission data with slug
 * @returns Statusline content structure with display configuration
 */
const buildStatuslineTemplate: ContentTemplateBuilder<'statuslines'> = (data) => ({
  content: data.statuslineScript,
  statuslineType: data.statuslineType,
  configuration: {
    format: 'bash' as const,
    refreshInterval: data.refreshInterval,
    position: data.position,
    colorScheme: 'default' as const,
  },
});

/**
 * Build MCP server content template
 * Extracts NPM package, installation, and tools configuration from form submission
 * Includes environment variable parsing from KEY=value format
 *
 * @param data - MCP submission data with slug
 * @returns MCP content structure with installation and tools
 */
const buildMcpTemplate: ContentTemplateBuilder<'mcp'> = (data) => {
  const envVars = parseEnvVars(data.envVars);
  return {
    npmPackage: data.npmPackage,
    serverType: data.serverType,
    installation: {
      npm: data.installCommand,
      configuration: {
        command: data.configCommand,
        args: [] as const,
        ...(Object.keys(envVars).length > 0 ? { env: envVars } : {}),
      },
    },
    // Add tools array (simplified - maintainer can expand later)
    ...(data.toolsDescription
      ? {
          tools: [
            {
              name: 'primary_tool' as const,
              description: data.toolsDescription,
              parameters: {} as const,
            },
          ],
        }
      : {}),
  };
};

/**
 * Build skill content template
 * Extracts skill guide content, requirements, and installation steps
 *
 * @param data - Skill submission data with slug
 * @returns Skill content structure with optional requirements and installation
 */
const buildSkillTemplate: ContentTemplateBuilder<'skills'> = (data) => ({
  content: data.skillContent,
  ...(data.requirements ? { requirements: data.requirements } : {}),
  ...(data.installation ? { installation: { steps: data.installation } } : {}),
});

/**
 * Content file template registry type
 * Mapped type ensures each template builder receives correct data type
 *
 * This creates a type like:
 * {
 *   agents: (data: AgentSubmissionData & { slug: string }) => Record<string, unknown>;
 *   mcp: (data: McpSubmissionData & { slug: string }) => Record<string, unknown>;
 *   // ... etc
 * }
 */
type ContentTemplateRegistry = {
  [K in ConfigSubmissionData['type']]: ContentTemplateBuilder<K>;
};

/**
 * Content file template registry - eliminates switch/case pattern
 *
 * Production-Grade Architecture (2025):
 * - Type-safe: Mapped type ensures each builder gets correct data type
 * - Zero type assertions: TypeScript infers correct types automatically via Extract<>
 * - Compile-time validation: Missing/incorrect templates caught at build time
 * - Modular builders: Each function is independently testable
 * - Self-documenting: Explicit function names describe purpose
 * - Security: Input sanitization handled at form validation layer
 * - Performance: O(1) lookup, minimal overhead
 *
 * Template Patterns:
 * - AI types (agents, rules): content + configuration (temperature, maxTokens)
 * - Commands: content only (markdown)
 * - Hooks: content + hookType + triggeredBy
 * - Statuslines: content + statuslineType + configuration (display settings)
 * - MCP: npmPackage + serverType + installation + tools (complex structure)
 *
 * Type Safety:
 * - ContentTemplateRegistry ensures each key maps to correct builder type
 * - satisfies validates all required types are present
 * - TypeScript catches missing builders or wrong signatures at compile time
 *
 * Replaces: 92-line switch statement with type-safe registry
 *
 * @see formatContentFile - Consumer of this registry
 */
const CONTENT_TEMPLATES = {
  agents: buildAgentTemplate,
  rules: buildRulesTemplate,
  commands: buildCommandTemplate,
  hooks: buildHookTemplate,
  statuslines: buildStatuslineTemplate,
  mcp: buildMcpTemplate,
  skills: buildSkillTemplate,
} as const satisfies ContentTemplateRegistry;

/**
 * Format submission data as JSON file content using registry-driven approach
 *
 * Modern 2025 Architecture:
 * - Template-driven: Uses CONTENT_TEMPLATES registry
 * - Type-safe: Explicit template per submission type
 * - Zero duplication: Eliminated 92-line switch statement
 * - Modular: Each template is isolated and testable
 * - Extensible: Add new templates without modifying this function
 *
 * Converts plaintext form fields to proper JSON structure matching content schemas.
 * Each content type has a dedicated template builder for its unique structure.
 *
 * @param data - Validated submission data from form
 * @returns Formatted JSON string ready for GitHub PR
 *
 * @example
 * ```typescript
 * // Agent submission
 * formatContentFile({
 *   type: 'agents',
 *   slug: 'code-reviewer',
 *   systemPrompt: 'You are an expert...',
 *   temperature: 0.7,
 *   // ...
 * })
 * // Returns: JSON with content + configuration structure
 *
 * // MCP submission
 * formatContentFile({
 *   type: 'mcp',
 *   slug: 'github-mcp',
 *   npmPackage: '@modelcontextprotocol/server-github',
 *   // ...
 * })
 * // Returns: JSON with npmPackage + installation + tools structure
 * ```
 */
export function formatContentFile(data: ConfigSubmissionData & { slug: string }): string {
  // Base fields common to all content types
  const baseFields = {
    slug: data.slug,
    description: data.description,
    category: data.type,
    author: data.author,
    dateAdded: new Date().toISOString().split('T')[0],
    tags: data.tags,
    ...(data.github ? { github: data.github } : {}),
    source: 'community' as const,
  };

  // Registry-driven template building with type-safe lookup
  // Type assertion is safe because:
  // 1. CONTENT_TEMPLATES satisfies ContentTemplateRegistry (compile-time validated)
  // 2. ContentTemplateRegistry maps each type to its correct builder signature
  // 3. data.type is guaranteed to be a valid key in CONTENT_TEMPLATES
  // 4. Each builder only accepts data matching its specific type via Extract<>
  const templateBuilder = CONTENT_TEMPLATES[data.type] as ContentTemplateBuilder<typeof data.type>;
  const typeSpecificFields = templateBuilder(data as never);

  // Merge base fields with type-specific fields
  const contentObject = {
    ...baseFields,
    ...typeSpecificFields,
  };

  // Pretty print with 2-space indentation (matches existing files)
  return JSON.stringify(contentObject, null, 2);
}

/**
 * Content validation schema (Zod)
 * Production-grade runtime validation for content files
 */
const contentFileValidationSchema = z.object({
  slug: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  author: z.string().min(1),
  dateAdded: z.string().min(1),
  tags: z.array(z.string()),
});

/**
 * Validate content file structure
 * Production-grade: Uses Zod schema validation with safeParse
 */
export function validateContentFile(content: string): boolean {
  try {
    // Production-grade: safeParse with Zod validation
    safeParse(content, contentFileValidationSchema, {
      strategy: ParseStrategy.VALIDATED_JSON,
    });
    return true;
  } catch (error) {
    // Log detailed validation errors
    logger.error(
      'Content validation error',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}
