/**
 * Content Utilities - Database-First Architecture
 */

import type { CategoryId } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';

const normalizeSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k views`;
  }
  return `${count} views`;
}

export function formatCopyCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k used`;
  }
  return `${count} used`;
}

const MAX_FILENAME_LENGTH = 100;

const LANGUAGE_EXTENSIONS = {
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
} as const;

const MCP_SECTION_LABELS = {
  claudeDesktop: 'claude-desktop',
  claudeCode: 'claude-code',
  http: 'http-transport',
  sse: 'sse-transport',
} as const;

export interface FilenameGeneratorOptions {
  item: ContentItem;
  language: string;
  format?: 'json' | 'multi' | 'hook';
  section?: string;
}

function sanitizeFilename(input: string | undefined): string {
  if (!input || typeof input !== 'string') {
    return 'untitled';
  }
  const normalized = normalizeSlug(input);
  const secure = normalized
    .replace(/[/\\]/g, '')
    .replace(/^[.-]+|[.-]+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, MAX_FILENAME_LENGTH)
    .trim();
  return secure || 'untitled';
}

function convertHookTypeToKebab(hook_type: string): string {
  return hook_type
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

function getExtensionFromLanguage(language: string): string {
  const normalized = language.toLowerCase().trim();
  return LANGUAGE_EXTENSIONS[normalized as keyof typeof LANGUAGE_EXTENSIONS] || 'txt';
}

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
  tutorials: { suffix: '' },
  comparisons: { suffix: '' },
  workflows: { suffix: '' },
  'use-cases': { suffix: '' },
  troubleshooting: { suffix: '' },
  statuslines: { suffix: '' },
  collections: { suffix: '' },
  skills: { suffix: '' },
};

export function generateFilename(options: FilenameGeneratorOptions): string {
  const { item, language, format, section } = options;

  if (!(item && language)) {
    return `untitled.${getExtensionFromLanguage(language || 'text')}`;
  }

  const { category, slug } = item;
  const ext = getExtensionFromLanguage(language);
  const name = 'name' in item ? (item as { name?: string }).name : undefined;
  const rawIdentifier = slug || name || category;
  const identifier = sanitizeFilename(rawIdentifier);

  if (format === 'multi' && section) {
    const sanitizedSection = sanitizeFilename(section);
    return `${identifier}-${sanitizedSection}.${ext}`;
  }

  const rule = FILENAME_RULES[category];

  if (rule?.useHookType) {
    const hook_type = 'hook_type' in item ? (item as { hook_type?: string }).hook_type : undefined;
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

export function generateMultiFormatFilename(
  item: ContentItem,
  sectionKey: string,
  language: string
): string {
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

export function generateHookFilename(
  item: ContentItem,
  contentType: 'hookConfig' | 'scriptContent',
  language: string
): string {
  const ext = getExtensionFromLanguage(language);
  const hook_type = 'hook_type' in item ? (item as { hook_type?: string }).hook_type : undefined;
  const suffix = contentType === 'hookConfig' ? 'config' : 'script';

  if (hook_type && typeof hook_type === 'string') {
    const hookSlug = convertHookTypeToKebab(hook_type);
    return `${sanitizeFilename(hookSlug)}-${suffix}.${ext}`;
  }

  const identifier = sanitizeFilename(item.slug || 'hook');
  return `${identifier}-${suffix}.${ext}`;
}

export function getContentItemUrl(item: {
  category: CategoryId;
  slug: string;
  subcategory?: string | null | undefined;
}): string {
  return `/${item.category}/${item.slug}`;
}

export function transformMcpConfigForDisplay(
  config: Record<string, unknown>
): Record<string, unknown> {
  if ('mcp' in config && config.mcp) {
    const { mcp, ...rest } = config;
    return {
      mcpServers: mcp,
      ...rest,
    };
  }
  return config;
}
