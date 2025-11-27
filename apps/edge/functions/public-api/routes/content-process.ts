/**
 * Content processing route - Batched language detection, filename generation, and highlighting
 * Handles full processing pipeline or individual operations
 */

import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  initRequestLogging,
  jsonResponse,
  parseJsonBody,
  publicCorsHeaders,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import {
  buildSecurityHeaders,
  highlightCode,
  logError,
  logger,
  MAX_BODY_SIZE,
  sanitizeFilename as sanitizeFilenameBase,
} from '@heyclaude/shared-runtime';

// CORS headers for POST requests
const CORS = publicCorsHeaders;

// Constants ported from content.utils.ts
const MAX_FILENAME_LENGTH = 100;

const LANGUAGE_EXTENSIONS: Record<string, string> = {
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
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
  zsh: 'sh',
  powershell: 'ps1',
  json: 'json',
  yaml: 'yml',
  yml: 'yml',
  toml: 'toml',
  xml: 'xml',
  ini: 'ini',
  env: 'env',
  markdown: 'md',
  md: 'md',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  sql: 'sql',
  graphql: 'graphql',
  dockerfile: 'Dockerfile',
  text: 'txt',
  plaintext: 'txt',
};

const MCP_SECTION_LABELS: Record<string, string> = {
  claudeDesktop: 'claude-desktop',
  claudeCode: 'claude-code',
  http: 'http-transport',
  sse: 'sse-transport',
};

interface FilenameRule {
  suffix: string;
  useHookType?: boolean;
}

const FILENAME_RULES: Partial<Record<string, FilenameRule>> = {
  mcp: { suffix: '-config' },
  agents: { suffix: '-config' },
  commands: { suffix: '-config' },
  rules: { suffix: '-config' },
  hooks: { suffix: '', useHookType: true },
  guides: { suffix: '' },
  statuslines: { suffix: '' },
  collections: { suffix: '' },
  skills: { suffix: '' },
  jobs: { suffix: '' },
  changelog: { suffix: '' },
  // Legacy subcategory values (not in enum but used in guides)
  tutorials: { suffix: '' },
  comparisons: { suffix: '' },
  workflows: { suffix: '' },
  'use-cases': { suffix: '' },
  troubleshooting: { suffix: '' },
};

/**
 * Converts a string into a lowercase, hyphen-separated slug suitable for filenames or identifiers.
 *
 * @param value - The input string to normalize
 * @returns A slugified string: lowercase, spaces collapsed to hyphens, and containing only `a–z`, `0–9`, and hyphens
 */
function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Convert a raw filename candidate into a sanitized, slugified filename suitable for use as a file name.
 *
 * @param input - The raw filename or title to sanitize; may be undefined.
 * @returns `'untitled'` if `input` is missing or invalid; otherwise a sanitized, slugified filename truncated to MAX_FILENAME_LENGTH characters.
 */
function sanitizeFilename(input: string | undefined): string {
  if (!input || typeof input !== 'string') {
    return 'untitled';
  }
  const normalized = normalizeSlug(input);
  // Apply shared sanitization, then enforce local length limit
  const sanitized = sanitizeFilenameBase(normalized);
  return sanitized.length > MAX_FILENAME_LENGTH
    ? sanitized.slice(0, MAX_FILENAME_LENGTH)
    : sanitized;
}

/**
 * Converts a hook type identifier from camelCase or PascalCase into kebab-case.
 *
 * @param hook_type - The hook type identifier to convert
 * @returns The input converted to kebab-case (lowercase with hyphens separating former capital letters)
 */
function convertHookTypeToKebab(hook_type: string): string {
  return hook_type
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * Map a language name to its preferred file extension.
 *
 * @param language - Language name or alias (case-insensitive)
 * @returns The file extension for the language (without a leading dot), or `'txt'` if no mapping exists
 */
function getExtensionFromLanguage(language: string): string {
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized] || 'txt';
}

/**
 * Checks whether a string contains valid JSON.
 *
 * @param str - The string to validate as JSON
 * @returns `true` if `str` is valid JSON, `false` otherwise
 */
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determine the programming or markup language of a code snippet.
 *
 * Uses an optional hint to prefer a specific language; if the hint is `'text'` it is ignored.
 *
 * @param code - The source code to analyze
 * @param hint - Optional preferred language name to respect when provided (ignored when `'text'`)
 * @returns The detected language name such as `'json'`, `'bash'`, `'typescript'`, `'javascript'`, `'python'`, `'yaml'`, or `'text'`
 */
function detectLanguage(code: string, hint?: string): string {
  if (hint && hint !== 'text') {
    return hint;
  }

  const trimmed = code.trim();

  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && isValidJSON(code)) {
    return 'json';
  }

  if (trimmed.startsWith('#!') || /^(npm|npx|yarn|pnpm|cd|git|curl)\s/.test(trimmed)) {
    return 'bash';
  }

  if (
    /:\s*(string|number|boolean|any|unknown|void|Promise|Array|Record)\b/.test(code) ||
    /interface\s+\w+\s*\{/.test(code) ||
    /type\s+\w+\s*=/.test(code)
  ) {
    return 'typescript';
  }

  if (/^(import|export|const|let|var|async|function)\s/.test(trimmed)) {
    return 'javascript';
  }

  if (/^(def|class|async def|from .+ import)\s/.test(trimmed)) {
    return 'python';
  }

  if (/^[\w-]+:\s+.+$/m.test(code) && !code.includes('{')) {
    return 'yaml';
  }

  return 'text';
}

// Filename generation functions
interface FilenameGeneratorOptions {
  item: {
    category: string;
    slug?: string | null;
    name?: string | null;
    hook_type?: string | null;
  };
  language: string;
  format?: 'json' | 'multi' | 'hook';
  section?: string;
}

/**
 * Generate a sanitized filename for an item according to category rules, requested format, and language.
 *
 * @param options - Generator options
 * @param options.item - Item descriptor; must include `category` and may include `slug`, `name`, and `hook_type`
 * @param options.language - Language hint used to derive the file extension
 * @param options.format - Optional filename format: when `'multi'` the `section` is appended; when `'hook'` hook-type rules may apply
 * @param options.section - Optional section key used only when `format` is `'multi'`
 * @returns A filename string including an extension derived from `language` (e.g., `example.json`)
 */
function generateFilename(options: FilenameGeneratorOptions): string {
  const { item, language, format, section } = options;

  if (!(item && language)) {
    return `untitled.${getExtensionFromLanguage(language || 'text')}`;
  }

  const { category, slug } = item;
  const ext = getExtensionFromLanguage(language);
  const name = item.name;
  const rawIdentifier = slug || name || category;
  const identifier = sanitizeFilename(rawIdentifier);

  if (format === 'multi' && section) {
    const sanitizedSection = sanitizeFilename(section);
    return `${identifier}-${sanitizedSection}.${ext}`;
  }

  const rule = FILENAME_RULES[category];

  if (rule?.useHookType) {
    const hook_type = item.hook_type;
    if (hook_type && typeof hook_type === 'string') {
      const hookSlug = convertHookTypeToKebab(hook_type);
      return `${sanitizeFilename(hookSlug)}.${ext}`;
    }
  }

  if (rule) {
    return `${identifier}${rule.suffix}.${ext}`;
  }

  return `example.${ext}`;
}

/**
 * Create a filename for a specific section of a multi-format MCP item.
 *
 * @param item - The item descriptor used to derive the base filename (must include `category` and optional `slug`, `name`, or `hook_type`)
 * @param sectionKey - The section identifier (mapped to a human-readable label or sanitized when unknown) to append for multi-format filenames
 * @param language - Language hint used to determine the file extension
 * @returns A sanitized filename for the given item section with an extension derived from `language`
 */
function generateMultiFormatFilename(
  item: FilenameGeneratorOptions['item'],
  sectionKey: string,
  language: string
): string {
  const section = MCP_SECTION_LABELS[sectionKey] || sanitizeFilename(sectionKey);
  return generateFilename({
    item,
    language,
    format: 'multi',
    section,
  });
}

/**
 * Generate a filename for a hook item using its hook type or slug and the language extension.
 *
 * @param item - Object with optional `hook_type` (preferred) or `slug` used to derive the base name
 * @param contentType - 'hookConfig' to append `-config`, 'scriptContent' to append `-script`
 * @param language - Language hint used to determine the file extension
 * @returns The sanitized filename composed of the base identifier, the content-type suffix, and the language extension (e.g., `my-hook-config.yaml`)
 */
function generateHookFilename(
  item: FilenameGeneratorOptions['item'],
  contentType: 'hookConfig' | 'scriptContent',
  language: string
): string {
  const ext = getExtensionFromLanguage(language);
  const hook_type = item.hook_type;
  const suffix = contentType === 'hookConfig' ? 'config' : 'script';

  if (hook_type && typeof hook_type === 'string') {
    const hookSlug = convertHookTypeToKebab(hook_type);
    return `${sanitizeFilename(hookSlug)}-${suffix}.${ext}`;
  }

  const identifier = sanitizeFilename(item.slug || 'hook');
  return `${identifier}-${suffix}.${ext}`;
}

/**
 * Validate and normalize an `item` payload from a request.
 *
 * @param item - The value to validate; expected to be an object containing a required `category` string and optional `slug`, `name`, and `hook_type` strings.
 * @returns An object with `category` and normalized `slug`, `name`, and `hook_type` properties (strings or `null`) if `item` is valid; `undefined` otherwise.
 */
function validateItemParameter(item: unknown):
  | {
      category: string;
      slug?: string | null;
      name?: string | null;
      hook_type?: string | null;
    }
  | undefined {
  if (typeof item !== 'object' || item === null) {
    return undefined;
  }

  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) return undefined;
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const category = getStringProperty(item, 'category');
  if (!category) return undefined;

  return {
    category,
    slug: getStringProperty(item, 'slug') ?? null,
    name: getStringProperty(item, 'name') ?? null,
    hook_type: getStringProperty(item, 'hook_type') ?? null,
  };
}

/**
 * Extracts Markdown headings (levels 2–6) from a source string and returns their metadata.
 *
 * @param source - The Markdown text to scan for headings
 * @returns An array of HeadingMetadata objects for each heading found. Each item includes `id` (normalized and made unique), `anchor` (prefixed with `#`), `title`, and `level`. Returns up to 50 headings; returns an empty array if no matching headings are found.
 */
function extractMarkdownHeadings(source: string): HeadingMetadata[] {
  if (!(source && /^(#{2,6})\s+.+/m.test(source))) {
    return [];
  }

  const headings: HeadingMetadata[] = [];
  const counts = new Map<string, number>();
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!(match && match[1] && match[2])) continue;

    const level = Math.min(match[1].length, 6);
    const title = match[2].trim();
    if (!title) continue;

    const baseId = normalizeSlug(title) || `section-${level}-${headings.length + 1}`;
    const priorCount = counts.get(baseId) ?? 0;
    counts.set(baseId, priorCount + 1);
    const uniqueId = priorCount === 0 ? baseId : `${baseId}-${priorCount + 1}`;

    headings.push({
      id: uniqueId,
      anchor: `#${uniqueId}`,
      title,
      level,
    });

    if (headings.length >= 50) {
      break;
    }
  }

  return headings;
}

// Request/Response interfaces
interface ProcessRequest {
  operation: 'full' | 'filename' | 'highlight';
  code?: string;
  language?: string;
  languageHint?: string;
  showLineNumbers?: boolean;
  item?: {
    category: string;
    slug?: string | null;
    name?: string | null;
    hook_type?: string | null;
  };
  format?: 'json' | 'multi' | 'hook';
  section?: string;
  sectionKey?: string;
  contentType?: 'hookConfig' | 'scriptContent';
}

interface HeadingMetadata {
  id: string;
  anchor: string;
  title: string;
  level: number;
}

interface ProcessResponse {
  html?: string;
  language?: string;
  filename?: string;
  error?: string;
  headings?: HeadingMetadata[];
}

/**
 * Handle content processing request
 * POST /transform-api/content/process
 *
 * Operation modes:
 * - 'full': detectLanguage + generateFilename + highlightCode (batched)
 * - 'filename': generateFilename only (when language is known)
 * - 'highlight': highlightCode only (for backward compatibility)
 */

/**
 * Produce HTML-highlighted code and the resolved language for rendering.
 *
 * @param code - Source code to highlight; if empty or whitespace, a placeholder HTML is returned
 * @param language - Optional language hint used to choose the highlighter; when `code` is present defaults to `javascript` if unspecified, when `code` is empty the returned language defaults to `text`
 * @param showLineNumbers - When `true`, include line numbers in the highlighted output
 * @returns An object with `html` containing the highlighted HTML (or a placeholder) and `language` set to the resolved language used for highlighting
 */
function performHighlight(
  code: string,
  language: string | undefined,
  showLineNumbers: boolean
): { html: string; language: string } {
  if (!code || code.trim() === '') {
    return {
      html: '<pre class="sugar-high-empty"><code>No code provided</code></pre>',
      language: language || 'text',
    };
  }
  const highlightLanguage = language || 'javascript';
  const html = highlightCode(code, highlightLanguage, { showLineNumbers });
  return { html, language: highlightLanguage };
}

/**
 * Handle HTTP requests that return syntax-highlighted HTML for a code snippet.
 *
 * Accepts POST with JSON { code, language?, showLineNumbers? } and returns a JSON response
 * containing highlighted HTML and the resolved language. Responds to OPTIONS with 204 and
 * rejects non-POST methods.
 *
 * @param req - The incoming Request object containing the JSON payload
 * @param logContext - Logging context used for error reporting
 * @returns A Response whose JSON body contains `{ html: string, language: string }` on success,
 * or `{ error: string }` on failure
 */
export async function handleContentHighlight(
  req: Request,
  logContext: BaseLogContext
): Promise<Response> {
  // Minimal implementation to avoid complex body parsing differences if any
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...buildSecurityHeaders(), ...CORS } });
  }
  if (req.method !== 'POST') {
    return badRequestResponse('Method not allowed. Use POST.', CORS);
  }

  try {
    const parseResult = await parseJsonBody<{
      code: string;
      language?: string;
      showLineNumbers?: boolean;
    }>(req, {
      maxSize: MAX_BODY_SIZE.default * 10,
      cors: CORS,
    });

    if (!parseResult.success) {
      return parseResult.response;
    }

    const { code, language, showLineNumbers = true } = parseResult.data;

    if (!code || typeof code !== 'string') {
      return badRequestResponse('Invalid code parameter', CORS);
    }

    const result = performHighlight(code, language, showLineNumbers);

    return jsonResponse(result, 200, {
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('transform'),
    });
  } catch (error) {
    await logError('Content highlight failed', logContext, error);
    // DO NOT expose internal error details to user - use generic message
    return jsonResponse({ error: 'Internal Server Error' }, 500, {
      ...buildSecurityHeaders(),
      ...CORS,
    });
  }
}

/**
 * Handle content processing requests to detect language, generate filenames, and highlight code according to the requested operation.
 *
 * @param req - Incoming HTTP Request whose JSON body follows the ProcessRequest schema (operation 'full' | 'filename' | 'highlight').
 * @param logContext - Request-scoped logging and tracing context used for observability and error reporting.
 * @returns An HTTP Response containing a ProcessResponse payload on success or a structured error response on failure.
 */
export async function handleContentProcess(
  req: Request,
  logContext: BaseLogContext
): Promise<Response> {
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Content process request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'content-process',
    method: req.method,
  });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...buildSecurityHeaders(),
        ...CORS,
      },
    });
  }

  if (req.method !== 'POST') {
    return badRequestResponse('Method not allowed. Use POST.', CORS);
  }

  try {
    traceStep('Processing content', logContext);
    const parseResult = await parseJsonBody<ProcessRequest>(req, {
      maxSize: MAX_BODY_SIZE.default * 10, // Allow larger payloads for code (1MB)
      cors: CORS,
    });

    if (!parseResult.success) {
      return parseResult.response;
    }

    const {
      operation,
      code,
      language,
      languageHint,
      showLineNumbers = true,
      item,
      format,
      section,
      sectionKey,
      contentType,
    } = parseResult.data;

    // Validate operation
    if (!(operation && ['full', 'filename', 'highlight'].includes(operation))) {
      return badRequestResponse(
        "Invalid operation. Must be 'full', 'filename', or 'highlight'.",
        CORS
      );
    }

    // Validate required fields based on operation
    // Reject both empty strings and whitespace-only strings for consistency
    if (operation === 'full' || operation === 'highlight') {
      if (!code || typeof code !== 'string' || code.trim() === '') {
        return badRequestResponse('Invalid code parameter. Must be a non-empty string.', CORS);
      }
    }

    if (operation === 'full' || operation === 'filename') {
      if (!item || typeof item !== 'object' || !item.category) {
        return badRequestResponse(
          'Invalid item parameter. Must be an object with category property.',
          CORS
        );
      }
    }

    // Type guard: code is guaranteed to be string for 'full' and 'highlight' operations
    const codeString: string | undefined =
      (operation === 'full' || operation === 'highlight') && typeof code === 'string'
        ? code
        : undefined;

    // Type guard: item is guaranteed to be valid object with category for 'full' and 'filename' operations
    const validItem =
      operation === 'full' || operation === 'filename' ? validateItemParameter(item) : undefined;

    // Note: Empty/whitespace-only code is now rejected at validation (line 462)
    // This block is no longer reachable but kept for defensive programming
    // in case codeString somehow bypasses validation

    // Process based on operation mode
    let result: ProcessResponse = {};

    if (operation === 'full') {
      // TypeScript guard: codeString is guaranteed to be string here
      if (!codeString) {
        return badRequestResponse('Code is required for full operation.', CORS);
      }

      // TypeScript guard: validItem is guaranteed to be valid here
      if (!validItem) {
        return badRequestResponse('Item is required for full operation.', CORS);
      }

      // Batched: detectLanguage + generateFilename + highlightCode
      const detectedLanguage = detectLanguage(codeString, languageHint);
      const generatedFilename = generateFilename({
        item: validItem,
        language: detectedLanguage,
        ...(format !== undefined ? { format } : {}),
        ...(section !== undefined ? { section } : {}),
      });
      const highlightedHtml = highlightCode(codeString, detectedLanguage, {
        showLineNumbers,
      });

      const headings = extractMarkdownHeadings(codeString);

      result = {
        html: highlightedHtml,
        language: detectedLanguage,
        filename: generatedFilename,
        ...(headings.length > 0 ? { headings } : {}),
      };
    } else if (operation === 'filename') {
      // TypeScript guard: validItem is guaranteed to be valid here
      if (!validItem) {
        return badRequestResponse('Item is required for filename operation.', CORS);
      }

      // Filename generation only
      let generatedFilename: string;

      if (format === 'multi' && sectionKey) {
        generatedFilename = generateMultiFormatFilename(validItem, sectionKey, language || 'json');
      } else if (format === 'hook' && contentType) {
        generatedFilename = generateHookFilename(validItem, contentType, language || 'json');
      } else {
        generatedFilename = generateFilename({
          item: validItem,
          language: language || 'json',
          ...(format !== undefined ? { format } : {}),
          ...(section !== undefined ? { section } : {}),
        });
      }

      result = {
        filename: generatedFilename,
      };
    } else if (operation === 'highlight') {
      // TypeScript guard: codeString is guaranteed to be string here
      if (!codeString) {
        return badRequestResponse('Code is required for highlight operation.', CORS);
      }

      // Highlight only (for backward compatibility)
      // Use shared helper
      result = performHighlight(codeString, language, showLineNumbers);
    }

    traceRequestComplete(logContext);
    return jsonResponse(result, 200, {
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('transform'),
    });
  } catch (error) {
    await logError('Content processing failed', logContext, error);
    return await errorResponse(error, 'data-api:content-process', CORS, logContext);
  }
}