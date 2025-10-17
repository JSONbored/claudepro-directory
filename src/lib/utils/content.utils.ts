/**
 * Content Utilities
 * Consolidated content transformation, generation, and URL utilities
 * SHA-2101: Part of consolidation effort
 *
 * Consolidates:
 * - transformers.ts (145 LOC) - Content schema → component transformations
 * - filename-generator.ts (350 LOC) - Secure filename generation
 * - guide-helpers.ts (138 LOC) - MDX frontmatter parsing
 * - url-helpers.ts (90 LOC) - Centralized URL generation
 *
 * Total: 723 LOC consolidated
 *
 * Features:
 * - Content transformations for detail/home page variants
 * - Production-grade filename generation with security
 * - Guide frontmatter parsing with Zod validation
 * - Centralized URL generation with guide subcategory handling
 */

import { z } from 'zod';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';

// REMOVED: import { transforms } from '@/src/lib/security/validators';
// Reason: validators.ts → batch.utils.ts → cache.server.ts → node:zlib (breaks browser/Storybook)
// Solution: Inline normalizeSlug function here to avoid server dependency chain

/**
 * Normalize slug to URL-safe format
 * Inlined from validators.ts to avoid server dependencies in browser code
 */
const normalizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

/**
 * Guide subcategory type
 * Represents valid subcategories for guide content
 */
export type GuideSubcategory =
  | 'tutorials'
  | 'comparisons'
  | 'workflows'
  | 'use-cases'
  | 'troubleshooting';

// ============================================
// CONTENT UTILITIES
// ============================================

/**
 * Additional metadata for content items
 * Used for analytics and enhanced display
 */
export interface ContentMetadata {
  viewCount?: number;
  bookmarkCount?: number;
  shareCount?: number;
  popularityScore?: number;
}

/**
 * Formats view count with 'k' suffix for thousands
 * @param count - View count number
 * @returns Formatted string (e.g., "1.2k views")
 *
 * @example
 * formatViewCount(1234) // "1.2k views"
 * formatViewCount(500) // "500 views"
 */
export function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k views`;
  }
  return `${count} views`;
}

/**
 * Formats copy/usage count with 'k' suffix for thousands
 * @param count - Copy count number
 * @returns Formatted string (e.g., "1.2k used")
 *
 * @example
 * formatCopyCount(1234) // "1.2k used"
 * formatCopyCount(500) // "500 used"
 */
export function formatCopyCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k used`;
  }
  return `${count} used`;
}

/**
 * Checks if content is new (0-7 days old)
 * Used to display "NEW" badge on recent content across the site
 *
 * @param dateAdded - ISO date string of when content was added
 * @returns True if content is 0-7 days old
 *
 * @example
 * isNewContent('2025-10-15') // true (if today is 2025-10-16)
 * isNewContent('2025-10-01') // false (if today is 2025-10-16)
 * isNewContent(undefined) // false
 */
export function isNewContent(dateAdded?: string): boolean {
  if (!dateAdded) return false;

  const now = Date.now();
  const added = new Date(dateAdded).getTime();
  const daysOld = (now - added) / (1000 * 60 * 60 * 24);

  return daysOld >= 0 && daysOld <= 7;
}

/**
 * Generates display title with proper formatting
 * Handles acronyms and special cases (API, MCP, AI, etc.)
 *
 * Used at build time to generate displayTitle field in content schemas.
 * Eliminates runtime transformation overhead - computed once, cached forever.
 *
 * @param title - Raw title string
 * @returns Formatted display title
 *
 * @example
 * generateDisplayTitle("api rate limiter") // "API Rate Limiter"
 * generateDisplayTitle("mcp server guide") // "MCP Server Guide"
 */
export function generateDisplayTitle(title: string): string {
  const acronyms = ['API', 'MCP', 'AI', 'CLI', 'SDK', 'UI', 'UX', 'REST', 'GraphQL', 'SQL'];

  return title
    .split(/[\s-_]+/)
    .map((word) => {
      const upperWord = word.toUpperCase();
      if (acronyms.includes(upperWord)) {
        return upperWord;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// ============================================
// FILENAME GENERATION
// ============================================

/**
 * Maximum safe filename length (excluding extension)
 * Most filesystems support 255 bytes, we use 100 for safety + readability
 */
const MAX_FILENAME_LENGTH = 100;

/**
 * Language to file extension mapping
 * Using 'as const' for type safety and readonly guarantee
 */
const LANGUAGE_EXTENSIONS = {
  // Programming languages
  typescript: 'ts',
  javascript: 'js',
  tsx: 'tsx',
  jsx: 'jsx',
  python: 'py',
  rust: 'rs',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  php: 'php',
  ruby: 'rb',
  swift: 'swift',
  kotlin: 'kt',
  // Shell/scripting
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
  zsh: 'sh',
  powershell: 'ps1',
  // Config/data formats
  json: 'json',
  yaml: 'yml',
  yml: 'yml',
  toml: 'toml',
  xml: 'xml',
  ini: 'ini',
  env: 'env',
  // Markup/documentation
  markdown: 'md',
  md: 'md',
  html: 'html',
  // Styles
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  // Database
  sql: 'sql',
  graphql: 'graphql',
  // Other
  dockerfile: 'Dockerfile',
  text: 'txt',
  plaintext: 'txt',
} as const;

/**
 * Section labels for multi-format MCP configurations
 * Using 'as const' for type safety
 */
const MCP_SECTION_LABELS = {
  claudeDesktop: 'claude-desktop',
  claudeCode: 'claude-code',
  http: 'http-transport',
  sse: 'sse-transport',
} as const;

/**
 * Options for filename generation
 */
export interface FilenameGeneratorOptions {
  /** Content item metadata */
  item: UnifiedContentItem;
  /** Detected or specified language */
  language: string;
  /** Optional format hint for specialized filename patterns */
  format?: 'json' | 'multi' | 'hook';
  /** Optional section identifier for multi-section configs */
  section?: string;
}

/**
 * Sanitizes a string for safe use in filenames
 *
 * SECURITY: Leverages existing production security utilities
 * - Uses transforms.normalizeSlug from lib/security for base sanitization
 * - Adds filename-specific security (no path separators, null bytes)
 * - Limits length to prevent filesystem issues
 *
 * @param input - Raw input string that may contain unsafe characters
 * @returns Safe, filesystem-compatible string
 */
function sanitizeFilename(input: string | undefined): string {
  if (!input || typeof input !== 'string') {
    return 'untitled';
  }

  // Use existing production slug normalization as base
  // This handles: lowercase, trim, spaces→hyphens, removes non-alphanumeric except hyphens
  const normalized = normalizeSlug(input);

  // Additional filename-specific security
  // Remove any remaining path separators and control characters
  const secure = normalized
    // Remove path separators (defense in depth)
    .replace(/[/\\]/g, '')
    // Remove leading/trailing dots and hyphens (hidden files, relative paths)
    .replace(/^[.-]+|[.-]+$/g, '')
    // Collapse multiple hyphens
    .replace(/-{2,}/g, '-')
    // Limit length for filesystem compatibility
    .slice(0, MAX_FILENAME_LENGTH)
    .trim();

  return secure || 'untitled';
}

/**
 * Converts PascalCase/camelCase hook types to kebab-case
 *
 * PERFORMANCE: Pure function, minimal regex operations
 *
 * @param hookType - Hook type in PascalCase (e.g., "PostToolUse")
 * @returns Kebab-case string (e.g., "post-tool-use")
 *
 * @example
 * ```typescript
 * convertHookTypeToKebab("PostToolUse") // "post-tool-use"
 * convertHookTypeToKebab("SessionStart") // "session-start"
 * ```
 */
function convertHookTypeToKebab(hookType: string): string {
  return hookType
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * Get file extension from language
 *
 * PERFORMANCE: O(1) lookup in readonly map
 *
 * @param language - Detected language from language-detection.ts
 * @returns File extension (without dot)
 */
function getExtensionFromLanguage(language: string): string {
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized as keyof typeof LANGUAGE_EXTENSIONS] || 'txt';
}

/**
 * Filename rule configuration interface
 * Defines how filenames should be generated for each category
 */
interface FilenameRule {
  /** Suffix to append to identifier (e.g., '-config') */
  suffix: string;
  /** Whether to use hookType field for filename (hooks only) */
  useHookType?: boolean;
}

/**
 * Filename generation rules registry - eliminates switch/case pattern
 *
 * Registry-driven approach for category-specific filename patterns.
 * Replaces 29-line switch statement with configuration lookup.
 *
 * Architecture:
 * - Partial mapping allows fallback to default for unknown categories
 * - Configuration-driven: Add category → filename automatically works
 * - Special handling: hookType extraction for hooks category
 * - Consistent patterns: Config categories use '-config' suffix
 *
 * Filename Patterns:
 * - Config categories (mcp, agents, commands, rules): {slug}-config.{ext}
 * - Hooks: {hookType}.{ext} or {slug}.{ext}
 * - Guide subcategories: {slug}.{ext}
 * - Unknown/default: example.{ext}
 *
 * @see generateFilename - Consumer of this configuration
 */
const FILENAME_RULES: Partial<Record<string, FilenameRule>> = {
  // Config categories - append '-config' suffix
  mcp: { suffix: '-config' },
  agents: { suffix: '-config' },
  commands: { suffix: '-config' },
  rules: { suffix: '-config' },

  // Hooks - use hookType for semantic naming
  hooks: { suffix: '', useHookType: true },

  // Guide subcategories - simple slug-based naming
  guides: { suffix: '' },
  tutorials: { suffix: '' },
  comparisons: { suffix: '' },
  workflows: { suffix: '' },
  'use-cases': { suffix: '' },
  troubleshooting: { suffix: '' },

  // Other categories can be added as needed
  statuslines: { suffix: '' },
  collections: { suffix: '' },
  skills: { suffix: '' },
};

/**
 * Generate a contextual filename based on content category using registry-driven approach
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Uses FILENAME_RULES registry
 * - Security: All inputs sanitized using production utilities
 * - Performance: Early returns, O(1) lookup
 * - UX: Semantic, human-readable filenames following Claude Code conventions
 * - Eliminated: 29-line switch statement with 7 cases
 *
 * @param options - Filename generation options
 * @returns Generated filename with appropriate extension
 *
 * @example
 * ```typescript
 * // MCP server configuration (uses '-config' suffix from registry)
 * generateFilename({
 *   item: { category: 'mcp', slug: 'github-mcp-server', ... },
 *   language: 'json'
 * });
 * // Returns: "github-mcp-server-config.json"
 *
 * // Hook with hookType (uses hookType field from registry rule)
 * generateFilename({
 *   item: { category: 'hooks', slug: 'post-tool-use', hookType: 'PostToolUse', ... },
 *   language: 'bash'
 * });
 * // Returns: "post-tool-use.sh"
 *
 * // New category automatically supported
 * generateFilename({
 *   item: { category: 'skills', slug: 'pdf-processing', ... },
 *   language: 'md'
 * });
 * // Returns: "pdf-processing.md" ✅
 * ```
 */
export function generateFilename(options: FilenameGeneratorOptions): string {
  const { item, language, format, section } = options;

  // Early validation
  if (!(item && language)) {
    return `untitled.${getExtensionFromLanguage(language || 'text')}`;
  }

  const { category, slug } = item;
  const ext = getExtensionFromLanguage(language);

  // Get name from item if it exists (backward compatibility)
  const name = 'name' in item ? (item as { name?: string }).name : undefined;

  // Build identifier with security sanitization
  const rawIdentifier = slug || name || category;
  const identifier = sanitizeFilename(rawIdentifier);

  // Handle multi-format MCP configs (special case - not in registry)
  if (format === 'multi' && section) {
    const sanitizedSection = sanitizeFilename(section);
    return `${identifier}-${sanitizedSection}.${ext}`;
  }

  // Registry-driven filename generation
  const rule = FILENAME_RULES[category];

  // Handle hookType special case if configured
  if (rule?.useHookType) {
    const hookType = 'hookType' in item ? (item as { hookType?: string }).hookType : undefined;
    if (hookType && typeof hookType === 'string') {
      const hookSlug = convertHookTypeToKebab(hookType);
      return `${sanitizeFilename(hookSlug)}.${ext}`;
    }
  }

  // Apply suffix rule or fallback to default
  if (rule) {
    return `${identifier}${rule.suffix}.${ext}`;
  }

  // Fallback for unknown categories
  return `example.${ext}`;
}

/**
 * Generate filename for multi-format MCP configurations
 *
 * SECURITY: All inputs sanitized via existing security utilities
 * UX: Section-specific names for better clarity
 *
 * @param item - Content item metadata
 * @param sectionKey - Configuration section key (claudeDesktop, claudeCode, http, sse)
 * @param language - Programming language
 * @returns Section-specific filename
 *
 * @example
 * ```typescript
 * generateMultiFormatFilename(
 *   { category: 'mcp', slug: 'github-mcp-server', ... },
 *   'claudeDesktop',
 *   'json'
 * );
 * // Returns: "github-mcp-server-claude-desktop.json"
 * ```
 */
export function generateMultiFormatFilename(
  item: UnifiedContentItem,
  sectionKey: string,
  language: string
): string {
  // Use predefined labels or sanitize custom section keys
  const section =
    MCP_SECTION_LABELS[sectionKey as keyof typeof MCP_SECTION_LABELS] ||
    sanitizeFilename(sectionKey);

  return generateFilename({
    item,
    language,
    format: 'multi',
    section,
  });
}

/**
 * Generate filename for hook-specific configurations
 *
 * SECURITY: All inputs sanitized via existing security utilities
 * UX: Distinguishes between config (JSON) and script (executable)
 *
 * @param item - Content item metadata
 * @param contentType - Type of hook content (hookConfig or scriptContent)
 * @param language - Programming language
 * @returns Hook-specific filename
 *
 * @example
 * ```typescript
 * // Hook configuration JSON
 * generateHookFilename(
 *   { category: 'hooks', slug: 'post-tool-use', hookType: 'PostToolUse', ... },
 *   'hookConfig',
 *   'json'
 * );
 * // Returns: "post-tool-use-config.json"
 *
 * // Hook script content
 * generateHookFilename(
 *   { category: 'hooks', hookType: 'PostToolUse', ... },
 *   'scriptContent',
 *   'bash'
 * );
 * // Returns: "post-tool-use-script.sh"
 * ```
 */
export function generateHookFilename(
  item: UnifiedContentItem,
  contentType: 'hookConfig' | 'scriptContent',
  language: string
): string {
  const ext = getExtensionFromLanguage(language);
  const hookType = 'hookType' in item ? (item as { hookType?: string }).hookType : undefined;
  const suffix = contentType === 'hookConfig' ? 'config' : 'script';

  // Use hookType for semantic naming
  if (hookType && typeof hookType === 'string') {
    const hookSlug = convertHookTypeToKebab(hookType);
    return `${sanitizeFilename(hookSlug)}-${suffix}.${ext}`;
  }

  // Fallback to slug
  const identifier = sanitizeFilename(item.slug || 'hook');
  return `${identifier}-${suffix}.${ext}`;
}

// ============================================
// GUIDE HELPERS
// ============================================

/**
 * Guide frontmatter structure
 * Parsed from MDX files using gray-matter
 */
export interface GuideFrontmatter {
  title: string;
  description: string;
  category?: string;
  subcategory?: GuideSubcategory;
  tags?: string[];
  author?: string;
  date?: string;
  featured?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  readingTime?: string;
  seoTitle?: string;
  seoDescription?: string;
}

/**
 * Guide item with metadata
 * Represents a parsed guide with frontmatter
 */
export interface GuideItem {
  slug: string;
  frontmatter: GuideFrontmatter;
  content?: string;
}

/**
 * Guide item with category information
 * Used for categorized guide listings
 */
export interface GuideItemWithCategory extends GuideItem {
  title: string;
  description: string;
  slug: string;
  category: string;
  subcategory?: GuideSubcategory;
  dateUpdated?: string;
  viewCount?: number;
}

/**
 * Guides organized by category
 * For category-based navigation and display
 */
export interface GuidesByCategory {
  [category: string]: GuideItemWithCategory[];
}

/**
 * Zod schema for guide item with category
 * Validates guide structure at runtime
 */
export const guideItemWithCategorySchema = z.object({
  slug: z.string(),
  category: z.string(),
  subcategory: z
    .enum([
      'getting-started',
      'configuration',
      'customization',
      'integration',
      'troubleshooting',
      'best-practices',
      'advanced',
    ])
    .optional(),
  frontmatter: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string().optional(),
    subcategory: z
      .enum([
        'getting-started',
        'configuration',
        'customization',
        'integration',
        'troubleshooting',
        'best-practices',
        'advanced',
      ])
      .optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
    date: z.string().optional(),
    featured: z.boolean().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    readingTime: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
  content: z.string().optional(),
});

/**
 * Parses frontmatter from raw string
 * Handles multi-line values and arrays
 *
 * @param frontmatterString - Raw frontmatter string (without --- delimiters)
 * @returns Parsed frontmatter object
 *
 * @example
 * const raw = `
 * title: Getting Started
 * tags:
 *   - guide
 *   - tutorial
 * `;
 * parseFrontmatter(raw)
 * // Returns: { title: "Getting Started", tags: ["guide", "tutorial"] }
 */
export function parseFrontmatter(frontmatterString: string): GuideFrontmatter {
  const lines = frontmatterString.split('\n');
  const result: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let inArray = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) continue;

    // Check if line is a key-value pair
    if (trimmedLine.includes(':')) {
      // If we were building an array, save it
      if (inArray && currentKey) {
        result[currentKey] = currentArray;
        currentArray = [];
        inArray = false;
      }

      const [key, ...valueParts] = trimmedLine.split(':');
      const trimmedKey = key?.trim();
      const value = valueParts.join(':').trim();

      if (!trimmedKey) continue;

      currentKey = trimmedKey;

      if (value) {
        // Single-line value
        result[currentKey] = value.replace(/^["']|["']$/g, ''); // Remove quotes
      } else {
        // Possibly starting an array or multi-line value
        inArray = true;
      }
    } else if (trimmedLine.startsWith('-') && inArray && currentKey) {
      // Array item
      const item = trimmedLine
        .slice(1)
        .trim()
        .replace(/^["']|["']$/g, '');
      currentArray.push(item);
    }
  }

  // Save the last array if exists
  if (inArray && currentKey) {
    result[currentKey] = currentArray;
  }

  // Convert boolean strings
  for (const key in result) {
    if (result[key] === 'true') result[key] = true;
    if (result[key] === 'false') result[key] = false;
  }

  return result as unknown as GuideFrontmatter;
}

// ============================================
// URL HELPERS
// ============================================

/**
 * Guide subcategories that use special URL patterns
 * These get nested under /guides/[category]/[slug]
 */
const GUIDE_SUBCATEGORIES: GuideSubcategory[] = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
];

/**
 * Checks if a value is a valid guide subcategory
 * @param value - Value to check
 * @returns True if valid guide subcategory
 *
 * @example
 * isGuideSubcategory('getting-started') // true
 * isGuideSubcategory('agents') // false
 */
export function isGuideSubcategory(value: unknown): value is GuideSubcategory {
  return typeof value === 'string' && GUIDE_SUBCATEGORIES.includes(value as GuideSubcategory);
}

/**
 * Generates URL for a content item
 * Handles special cases for guide subcategories
 *
 * @param item - Content item with category and slug
 * @returns URL path for the content item
 *
 * @example
 * // Regular content
 * getContentItemUrl({ category: 'agents', slug: 'code-reviewer' })
 * // Returns: "/agents/code-reviewer"
 *
 * // Guide with subcategory
 * getContentItemUrl({
 *   category: 'guides',
 *   slug: 'setup',
 *   subcategory: 'tutorials'
 * })
 * // Returns: "/guides/tutorials/setup"
 */
export function getContentItemUrl(item: {
  category: CategoryId;
  slug: string;
  subcategory?: string | null | undefined;
}): string {
  const { category, slug, subcategory } = item;

  // Special handling for guide subcategories
  if (category === 'guides' && subcategory && isGuideSubcategory(subcategory)) {
    return `/guides/${subcategory}/${slug}`;
  }

  // Standard pattern: /[category]/[slug]
  return `/${category}/${slug}`;
}

// ============================================
// MCP CONFIGURATION TRANSFORMATION
// ============================================

/**
 * Transform MCP configuration for Claude Desktop display
 *
 * Internal: Uses 'mcp' for consistency with schema and codebase conventions
 * External: Transforms to 'mcpServers' for Claude Desktop compatibility
 *
 * This transformation is ONLY applied when displaying configuration to users
 * for copy-paste purposes. All internal processing uses 'mcp'.
 *
 * @param config - MCP configuration object (claudeDesktop or claudeCode)
 * @returns Transformed configuration with 'mcpServers' key for Claude Desktop
 *
 * @example
 * ```ts
 * const internal = { mcp: { "server": {...} } };
 * const external = transformMcpConfigForDisplay(internal);
 * // Returns: { mcpServers: { "server": {...} } }
 * ```
 */
export function transformMcpConfigForDisplay(
  config: Record<string, unknown>
): Record<string, unknown> {
  // If config has 'mcp' key, transform to 'mcpServers' for Claude Desktop
  if ('mcp' in config && config.mcp) {
    const { mcp, ...rest } = config;
    return {
      mcpServers: mcp,
      ...rest,
    };
  }

  // If already has 'mcpServers', return as-is
  return config;
}
