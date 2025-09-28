/**
 * Lazy Content Loaders
 * Provides lazy-loaded access to large generated content files
 */

import { z } from 'zod';
import type { HookContent, MCPServerContent } from '@/lib/schemas/content.schema';
import { BatchLazyLoader, createLazyModule, PaginatedLazyLoader } from './lazy-loader';

// Schema for metadata lookup
const metadataLookupSchema = z.record(z.string(), z.any());

// Type aliases for consistency
export type McpContent = MCPServerContent;

// Lazy load the full MCP content
export const mcpFullLoader = createLazyModule<McpContent[]>(
  () => import('@/generated/mcp-full').then((m) => [...m.mcpFull]),
  {
    preload: false, // Don't preload by default
    cacheTimeout: 5 * 60 * 1000, // Clear cache after 5 minutes of inactivity
  }
);

// Lazy load the full hooks content
export const hooksFullLoader = createLazyModule<HookContent[]>(
  () => import('@/generated/hooks-full').then((m) => [...m.hooksFull]),
  {
    preload: false,
    cacheTimeout: 5 * 60 * 1000,
  }
);

// Batch loader for all metadata files
export const metadataLoader = new BatchLazyLoader(
  {
    mcpMetadata: () => import('@/generated/mcp-metadata').then((m) => m.mcpMetadata),
    hooksMetadata: () => import('@/generated/hooks-metadata').then((m) => m.hooksMetadata),
    agentsMetadata: () => import('@/generated/agents-metadata').then((m) => m.agentsMetadata),
    commandsMetadata: () => import('@/generated/commands-metadata').then((m) => m.commandsMetadata),
    rulesMetadata: () => import('@/generated/rules-metadata').then((m) => m.rulesMetadata),
  },
  {
    preloadKeys: [], // Don't preload any by default
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
  }
);

// Paginated loader for large content lists
export class ContentPaginatedLoader<T> extends PaginatedLazyLoader<T> {
  constructor(
    private allContent: () => Promise<T[]>,
    pageSize: number = 20
  ) {
    super(
      async (page, size) => {
        const content = await allContent();
        const start = page * size;
        const end = start + size;
        return content.slice(start, end);
      },
      {
        pageSize,
        maxCachedPages: 5, // Keep max 5 pages in memory
      }
    );
  }

  /**
   * Get total item count
   */
  async getTotalCount(): Promise<number> {
    const content = await this.allContent();
    return content.length;
  }

  /**
   * Search within content
   */
  async search(predicate: (item: T) => boolean, limit?: number): Promise<T[]> {
    const content = await this.allContent();
    const results = content.filter(predicate);
    return limit ? results.slice(0, limit) : results;
  }
}

// Create paginated loaders for large content
export const mcpPaginatedLoader = new ContentPaginatedLoader(() => mcpFullLoader.get());

export const hooksPaginatedLoader = new ContentPaginatedLoader(() => hooksFullLoader.get());

/**
 * Helper function to get specific content by slug
 */
export async function getMcpContentBySlug(slug: string): Promise<McpContent | null> {
  const allContent = await mcpFullLoader.get();
  return allContent.find((item) => item.slug === slug) || null;
}

export async function getHookContentBySlug(slug: string): Promise<HookContent | null> {
  const allContent = await hooksFullLoader.get();
  return allContent.find((item) => item.slug === slug) || null;
}

/**
 * Helper to get metadata without loading full content
 */
export async function getMcpMetadataBySlug(slug: string) {
  const metadata = await metadataLoader.get('mcpMetadata');
  const parsed = metadataLookupSchema.parse(metadata);
  return parsed[slug] || null;
}

export async function getHooksMetadataBySlug(slug: string) {
  const metadata = await metadataLoader.get('hooksMetadata');
  const parsed = metadataLookupSchema.parse(metadata);
  return parsed[slug] || null;
}

/**
 * Memory management utilities
 */
export const contentMemoryManager = {
  /**
   * Clear all cached content to free memory
   */
  clearAll(): void {
    mcpFullLoader.clear();
    hooksFullLoader.clear();
    metadataLoader.clear();
    mcpPaginatedLoader.clear();
    hooksPaginatedLoader.clear();
  },

  /**
   * Clear specific content type
   */
  clear(contentType: 'mcp' | 'hooks' | 'metadata'): void {
    switch (contentType) {
      case 'mcp':
        mcpFullLoader.clear();
        mcpPaginatedLoader.clear();
        break;
      case 'hooks':
        hooksFullLoader.clear();
        hooksPaginatedLoader.clear();
        break;
      case 'metadata':
        metadataLoader.clear();
        break;
    }
  },

  /**
   * Get memory usage statistics
   */
  getStats(): {
    mcpLoaded: boolean;
    hooksLoaded: boolean;
    metadataLoaded: string[];
    paginatedStats: {
      mcp: ReturnType<PaginatedLazyLoader<unknown>['getCacheStats']>;
      hooks: ReturnType<PaginatedLazyLoader<unknown>['getCacheStats']>;
    };
  } {
    return {
      mcpLoaded: mcpFullLoader.isLoaded(),
      hooksLoaded: hooksFullLoader.isLoaded(),
      metadataLoaded: metadataLoader.getLoadedKeys() as string[],
      paginatedStats: {
        mcp: mcpPaginatedLoader.getCacheStats(),
        hooks: hooksPaginatedLoader.getCacheStats(),
      },
    };
  },
};
