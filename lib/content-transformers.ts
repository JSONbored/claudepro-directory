import type {
  AgentContent,
  CommandContent,
  ExportableItem,
  HookContent,
  McpContent,
  RuleContent,
} from '@/lib/schemas/content';
import { exportableItemSchema } from '@/lib/schemas/content';

/**
 * Search Document type (inlined - only used here)
 */
export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  type: 'agent' | 'mcp' | 'command' | 'hook' | 'rule';
  url: string;
  score?: number;
}

/**
 * Social Share Data type (inlined - only used here)
 */
export interface SocialShareData {
  title: string;
  description: string;
  url: string;
  hashtags: string[];
}

/**
 * Content Transformers Module
 * Provides utilities for transforming and normalizing content data
 * Reduces duplication and ensures consistent data handling
 */

/**
 * Transform raw JSON content to typed content items
 */
export const jsonToContentItem = <T extends Record<string, unknown>>(
  json: unknown,
  requiredFields: Array<keyof T>
): T | null => {
  if (!json || typeof json !== 'object') return null;

  const obj = json as Record<string, unknown>;

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in obj)) {
      return null;
    }
  }

  return obj as T;
};

/**
 * Normalize content slugs for URLs
 */
export const normalizeSlug = (input: string): string => {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Transform GitHub URLs to API endpoints
 */
export const githubUrlToApi = (url: string): string | null => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;
  return `https://api.github.com/repos/${owner}/${repo}`;
};

export const toSearchDocument = (
  item: AgentContent | McpContent | CommandContent | HookContent | RuleContent,
  type: SearchDocument['type']
): SearchDocument => {
  const itemWithOptionalName = item as typeof item & { name?: string };
  const title = 'title' in item ? item.title : itemWithOptionalName.name;

  return {
    id: `${type}-${item.slug}`,
    title: title || itemWithOptionalName.name || '',
    description: item.description,
    content: [
      title || itemWithOptionalName.name,
      item.description,
      item.category,
      ...(item.tags || []),
      'content' in item && item.content ? item.content : '',
    ]
      .filter(Boolean)
      .join(' '),
    category: item.category,
    tags: [...(item.tags || [])],
    type,
    url: `/${type}/${item.slug}`,
  };
};

/**
 * Transform content for API responses
 */
export const toApiResponse = <T extends Record<string, unknown>>(
  item: T,
  fields?: Array<keyof T>
): Partial<T> => {
  if (!fields || fields.length === 0) {
    return item;
  }

  const result: Partial<T> = {};
  for (const field of fields) {
    if (field in item) {
      result[field] = item[field];
    }
  }
  return result;
};

/**
 * Transform configuration objects to CLI-friendly format
 */
export const configToCliFormat = (config: Record<string, unknown>): string => {
  const formatValue = (value: unknown): string => {
    if (typeof value === 'string') {
      return value.includes(' ') ? `"${value}"` : value;
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (Array.isArray(value)) {
      return value.map(formatValue).join(',');
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  return Object.entries(config)
    .map(([key, value]) => {
      const formattedValue = formatValue(value);
      if (!formattedValue) return null;
      return `--${key}=${formattedValue}`;
    })
    .filter(Boolean)
    .join(' ');
};

/**
 * Transform CLI arguments to configuration object
 */
export const cliToConfig = (args: string): Record<string, unknown> => {
  const config: Record<string, unknown> = {};

  // Match --key=value or --flag patterns
  const pattern = /--([^=\s]+)(?:=([^\s]+))?/g;
  let match: RegExpExecArray | null = null;

  match = pattern.exec(args);
  while (match !== null) {
    const [, key, value] = match;
    if (!key) continue;

    if (!value) {
      // Boolean flag
      config[key] = true;
    } else if (value === 'true') {
      config[key] = true;
    } else if (value === 'false') {
      config[key] = false;
    } else if (value.includes(',')) {
      // Array value
      config[key] = value.split(',').map((v) => v.trim());
    } else if (/^\d+$/.test(value)) {
      // Number
      config[key] = Number.parseInt(value, 10);
    } else {
      // String (remove quotes if present)
      config[key] = value.replace(/^["']|["']$/g, '');
    }
    match = pattern.exec(args);
  }

  return config;
};

export const toSocialShare = (
  item: AgentContent | McpContent | CommandContent | HookContent | RuleContent,
  type: string,
  baseUrl: string
): SocialShareData => {
  const itemWithOptionalName = item as typeof item & { name?: string };
  const title = 'title' in item ? item.title : itemWithOptionalName.name;

  return {
    title: `${title || itemWithOptionalName.name} - Claude ${type}`,
    description:
      item.description.length > 200 ? `${item.description.substring(0, 197)}...` : item.description,
    url: `${baseUrl}/${type}/${item.slug}`,
    hashtags: ['Claude', 'AI', type, ...(item.tags?.slice(0, 2) || [])],
  };
};

/**
 * Batch transform items with error handling
 */
export const batchTransform = async <T, R>(
  items: T[],
  transformer: (item: T) => Promise<R> | R,
  options?: {
    concurrency?: number;
    onError?: (error: Error, item: T) => void;
  }
): Promise<R[]> => {
  const { concurrency = 5, onError } = options || {};
  const results: R[] = [];
  const errors: Array<{ error: Error; item: T }> = [];

  // Process in chunks for concurrency control
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          return await transformer(item);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errors.push({ error: err, item });
          if (onError) onError(err, item);
          throw err;
        }
      })
    );

    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
};

/**
 * Create a memoized transformer
 */
export const memoizeTransformer = <T, R>(
  transformer: (input: T) => R,
  keyFn?: (input: T) => string
): ((input: T) => R) => {
  const cache = new Map<string, R>();

  return (input: T): R => {
    const key = keyFn ? keyFn(input) : JSON.stringify(input);

    if (cache.has(key)) {
      return cache.get(key) as R;
    }

    const result = transformer(input);
    cache.set(key, result);
    return result;
  };
};

/**
 * Transform content dates to relative time
 */
export const toRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
  return `${Math.floor(seconds / 31536000)} years ago`;
};

/**
 * Transform tags for consistent formatting
 */
export const normalizeTags = (tags: string[]): string[] => {
  return Array.from(new Set(tags.map((tag) => tag.toLowerCase().trim())))
    .filter(Boolean)
    .sort();
};

/**
 * Transform content for export
 */
export const toExportFormat = (
  items: Array<AgentContent | McpContent | CommandContent | HookContent | RuleContent>,
  format: 'json' | 'csv' | 'yaml'
): string => {
  // Parse items through schema for proper typing
  const exportableItems: ExportableItem[] = items.map((item) => {
    // Safely extract name - use title if available, fallback to slug-based name
    const itemName = 'name' in item ? item.name : 'title' in item ? item.title : item.slug;
    const itemTitle = 'title' in item ? item.title : itemName;

    return exportableItemSchema.parse({
      slug: item.slug,
      name: itemName,
      title: itemTitle,
      description: item.description,
      category: item.category,
      tags: item.tags,
      author: item.author,
      dateAdded: item.dateAdded,
      githubUrl: (item as typeof item & { githubUrl?: string }).githubUrl,
      source: (item as typeof item & { source?: string }).source,
      features: 'features' in item ? item.features : [],
      useCases: 'useCases' in item ? item.useCases : [],
      content: (item as typeof item & { content?: string }).content,
      configuration: (item as typeof item & { configuration?: unknown }).configuration,
    });
  });

  switch (format) {
    case 'json':
      return JSON.stringify(exportableItems, null, 2);

    case 'csv': {
      if (exportableItems.length === 0) return '';
      const firstItem = exportableItems[0];
      if (!firstItem) return '';
      const headers = Object.keys(firstItem) as Array<keyof ExportableItem>;
      const rows = exportableItems.map((item) => {
        return headers
          .map((header) => {
            const value = item[header as keyof ExportableItem];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          })
          .join(',');
      });

      return [headers.join(','), ...rows].join('\n');
    }

    case 'yaml': {
      // Simple YAML serialization
      return exportableItems
        .map((item) => {
          const yaml = Object.entries(item)
            .map(([key, value]) => {
              if (value === null || value === undefined) return `${key}: null`;
              if (typeof value === 'string') {
                return value.includes('\n')
                  ? `${key}: |\n  ${value.replace(/\n/g, '\n  ')}`
                  : `${key}: "${value}"`;
              }
              if (Array.isArray(value)) {
                return `${key}:\n${value.map((v) => `  - ${v}`).join('\n')}`;
              }
              return `${key}: ${value}`;
            })
            .join('\n');
          return `---\n${yaml}`;
        })
        .join('\n');
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
