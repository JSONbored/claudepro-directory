/**
 * Content processing utilities - Language detection and filename generation
 * Moved from edge function to shared-runtime for direct use in web app
 */

import { sanitizeFilename } from './sanitize-text.ts';

// Constants for filename generation
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

interface FilenameRule {
  suffix: string;
  useHookType?: boolean;
}

const FILENAME_RULES: Partial<Record<string, FilenameRule>> = {
  mcp: { suffix: '-config' },
  hooks: { suffix: '', useHookType: true },
  commands: { suffix: '' },
  statuslines: { suffix: '' },
  agents: { suffix: '' },
  rules: { suffix: '' },
  skills: { suffix: '' },
  collections: { suffix: '' },
  guides: { suffix: '' },
  comparisons: { suffix: '' },
  workflows: { suffix: '' },
  'use-cases': { suffix: '' },
  troubleshooting: { suffix: '' },
};

/**
 * Checks whether a string contains valid JSON.
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
export function detectLanguage(code: string, hint?: string): string {
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

/**
 * Maps a language name or alias to its preferred file extension.
 */
function getExtensionFromLanguage(language: string): string {
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized] ?? 'txt';
}

/**
 * Converts a hook type identifier from camelCase or PascalCase into kebab-case.
 */
function convertHookTypeToKebab(hook_type: string): string {
  return hook_type
    .replaceAll(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

export interface FilenameGeneratorOptions {
  format?: 'hook' | 'json' | 'multi';
  item: {
    category: string;
    hook_type?: null | string;
    name?: null | string;
    slug?: null | string;
  };
  language: string;
  section?: string;
}

/**
 * Generates a sanitized filename for an item using category rules, requested format, and language.
 *
 * The filename base is derived from the item's `slug`, `name`, or `category`; extensions are chosen from `language`.
 * For `format === 'multi'` a sanitized `section` is appended. If the category rule requires a hook type and the item
 * provides `hook_type`, the hook-type kebab form will be used as the base name.
 *
 * @param options.item - Item descriptor with required `category` and optional `slug`, `name`, and `hook_type`
 * @param options.language - Language hint used to determine the file extension
 * @param options.format - Optional filename format; when `'multi'` the `section` is appended, when `'hook'` hook-type naming may apply
 * @param options.section - Section key used when `format` is `'multi'` to produce a section-specific filename
 * @returns The generated filename including an extension derived from `language` (for example, `example.json`)
 */
export function generateFilename(options: FilenameGeneratorOptions): string {
  const { item, language, format, section } = options;

  if (!language) {
    return `untitled.${getExtensionFromLanguage('text')}`;
  }

  const { category, slug } = item;
  const ext = getExtensionFromLanguage(language);
  const name = item.name;
  const rawIdentifier = slug ?? name ?? category;
  const rule = FILENAME_RULES[category];
  let identifier = sanitizeFilename(rawIdentifier);

  // Enforce length limit accounting for suffix + extension + dot
  const reservedLength = (rule ? rule.suffix.length : 0) + ext.length + 1; // dot before extension
  const maxIdentifierLength = Math.max(10, MAX_FILENAME_LENGTH - reservedLength);
  if (identifier.length > maxIdentifierLength) {
    identifier = identifier.slice(0, maxIdentifierLength);
  }

  if (format === 'multi' && section) {
    const sanitizedSection = sanitizeFilename(section);
    return `${identifier}-${sanitizedSection}.${ext}`;
  }

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

  return `${identifier}.${ext}`;
}

/**
 * Create a filename for a hook item using its hook type or slug, appending a content-type suffix and the appropriate file extension.
 *
 * @param item - Object containing optional `hook_type` (preferred) or `slug` to derive the base name
 * @param contentType - `'hookConfig'` to append `-config`, `'scriptContent'` to append `-script`
 * @param language - Language hint used to determine the file extension
 * @returns The filename composed of the sanitized base identifier, the content-type suffix, and the language extension (for example, `my-hook-config.yaml`)
 */
export function generateHookFilename(
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

  const trimmedSlug = item.slug?.trim();
  const slug = trimmedSlug && trimmedSlug.length > 0 ? trimmedSlug : 'hook';
  const identifier = sanitizeFilename(slug);
  return `${identifier}-${suffix}.${ext}`;
}

/**
 * Extract Markdown headings (levels 2–6) and produce metadata for each heading.
 *
 * @param source - The Markdown text to scan for headings
 * @returns An array of heading metadata objects (id, anchor, title, level). `id` values are normalized and made unique within the document; at most 50 headings are returned.
 */
export interface HeadingMetadata {
  anchor: string;
  id: string;
  level: number;
  title: string;
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '');
}

export function extractMarkdownHeadings(source: string): HeadingMetadata[] {
  if (!(source && /^(#{2,6})\s+.+/m.test(source))) {
    return [];
  }

  const headings: HeadingMetadata[] = [];
  const counts = new Map<string, number>();
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!(match?.[1] && match[2])) continue;

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
