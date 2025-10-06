/**
 * Production-Grade Filename Generation Utility
 *
 * Generates secure, performant, context-aware filenames for code blocks.
 * Leverages existing security infrastructure from @/lib/security
 *
 * SECURITY:
 * - Uses production sanitizers from lib/security/validators.ts
 * - Prevents directory traversal and filesystem exploits
 * - Validates filename length to prevent filesystem issues
 *
 * PERFORMANCE:
 * - O(1) lookups with readonly maps
 * - Minimal string operations with early returns
 * - Reuses existing validation infrastructure
 *
 * UX:
 * - Human-readable, semantic filenames
 * - Consistent patterns across all content types
 * - Graceful fallbacks for missing/invalid data
 */

import type { UnifiedContentItem } from "@/src/lib/schemas/component.schema";
import { transforms } from "@/src/lib/security/validators";

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
  typescript: "ts",
  javascript: "js",
  tsx: "tsx",
  jsx: "jsx",
  python: "py",
  rust: "rs",
  go: "go",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  php: "php",
  ruby: "rb",
  swift: "swift",
  kotlin: "kt",
  // Shell/scripting
  bash: "sh",
  shell: "sh",
  sh: "sh",
  zsh: "sh",
  powershell: "ps1",
  // Config/data formats
  json: "json",
  yaml: "yml",
  yml: "yml",
  toml: "toml",
  xml: "xml",
  ini: "ini",
  env: "env",
  // Markup/documentation
  markdown: "md",
  md: "md",
  html: "html",
  // Styles
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  // Database
  sql: "sql",
  graphql: "graphql",
  // Other
  dockerfile: "Dockerfile",
  text: "txt",
  plaintext: "txt",
} as const;

/**
 * Section labels for multi-format MCP configurations
 * Using 'as const' for type safety
 */
const MCP_SECTION_LABELS = {
  claudeDesktop: "claude-desktop",
  claudeCode: "claude-code",
  http: "http-transport",
  sse: "sse-transport",
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
  format?: "json" | "multi" | "hook";
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
  if (!input || typeof input !== "string") {
    return "untitled";
  }

  // Use existing production slug normalization as base
  // This handles: lowercase, trim, spaces→hyphens, removes non-alphanumeric except hyphens
  const normalized = transforms.normalizeSlug(input);

  // Additional filename-specific security
  // Remove any remaining path separators and control characters
  const secure = normalized
    // Remove path separators (defense in depth)
    .replace(/[/\\]/g, "")
    // Remove leading/trailing dots and hyphens (hidden files, relative paths)
    .replace(/^[.-]+|[.-]+$/g, "")
    // Collapse multiple hyphens
    .replace(/-{2,}/g, "-")
    // Limit length for filesystem compatibility
    .slice(0, MAX_FILENAME_LENGTH)
    .trim();

  return secure || "untitled";
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
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
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
  return (
    LANGUAGE_EXTENSIONS[normalized as keyof typeof LANGUAGE_EXTENSIONS] || "txt"
  );
}

/**
 * Generate a contextual filename based on content category
 *
 * SECURITY: All inputs sanitized using production security utilities
 * PERFORMANCE: Early returns, minimal string operations
 * UX: Semantic, human-readable filenames following Claude Code conventions
 *
 * @param options - Filename generation options
 * @returns Generated filename with appropriate extension
 *
 * @example
 * ```typescript
 * // MCP server configuration
 * generateFilename({
 *   item: { category: 'mcp', slug: 'github-mcp-server', ... },
 *   language: 'json'
 * });
 * // Returns: "github-mcp-server-config.json"
 *
 * // Hook with hookType
 * generateFilename({
 *   item: { category: 'hooks', slug: 'post-tool-use', hookType: 'PostToolUse', ... },
 *   language: 'bash'
 * });
 * // Returns: "post-tool-use.sh"
 * ```
 */
export function generateFilename(options: FilenameGeneratorOptions): string {
  const { item, language, format, section } = options;

  // Early validation
  if (!(item && language)) {
    return `untitled.${getExtensionFromLanguage(language || "text")}`;
  }

  const { category, slug } = item;
  const ext = getExtensionFromLanguage(language);

  // Get name from item if it exists (backward compatibility)
  const name = "name" in item ? (item as { name?: string }).name : undefined;

  // Build identifier with security sanitization
  const rawIdentifier = slug || name || category;
  const identifier = sanitizeFilename(rawIdentifier);

  // Handle multi-format MCP configs
  if (format === "multi" && section) {
    const sanitizedSection = sanitizeFilename(section);
    return `${identifier}-${sanitizedSection}.${ext}`;
  }

  // Category-specific filename generation
  switch (category) {
    case "mcp":
    case "agents":
    case "commands":
    case "rules":
      return `${identifier}-config.${ext}`;

    case "hooks": {
      // Use hookType for semantic naming if available
      const hookType =
        "hookType" in item
          ? (item as { hookType?: string }).hookType
          : undefined;
      if (hookType && typeof hookType === "string") {
        const hookSlug = convertHookTypeToKebab(hookType);
        return `${sanitizeFilename(hookSlug)}.${ext}`;
      }
      return `${identifier}.${ext}`;
    }

    case "guides":
    case "tutorials":
    case "comparisons":
    case "workflows":
    case "use-cases":
    case "troubleshooting":
      return `${identifier}.${ext}`;

    default:
      // Fallback for unknown categories
      return `example.${ext}`;
  }
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
  language: string,
): string {
  // Use predefined labels or sanitize custom section keys
  const section =
    MCP_SECTION_LABELS[sectionKey as keyof typeof MCP_SECTION_LABELS] ||
    sanitizeFilename(sectionKey);

  return generateFilename({
    item,
    language,
    format: "multi",
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
  contentType: "hookConfig" | "scriptContent",
  language: string,
): string {
  const ext = getExtensionFromLanguage(language);
  const hookType =
    "hookType" in item ? (item as { hookType?: string }).hookType : undefined;
  const suffix = contentType === "hookConfig" ? "config" : "script";

  // Use hookType for semantic naming
  if (hookType && typeof hookType === "string") {
    const hookSlug = convertHookTypeToKebab(hookType);
    return `${sanitizeFilename(hookSlug)}-${suffix}.${ext}`;
  }

  // Fallback to slug
  const identifier = sanitizeFilename(item.slug || "hook");
  return `${identifier}-${suffix}.${ext}`;
}
