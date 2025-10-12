/**
 * Integration Utilities
 * Consolidated external service integration and lazy loading utilities
 * SHA-2101: Part of consolidation effort
 *
 * Consolidates:
 * - github-issue-url.ts (219 LOC) - GitHub issue URL generation
 * - lazy-loader.ts (324 LOC) - Memory-efficient lazy loading
 *
 * Total: 543 LOC consolidated
 *
 * Features:
 * - GitHub issue pre-fill URL generation
 * - Lazy loading for large data sets
 * - Batch loading and pagination support
 * - Memory-efficient caching
 */

import { logger } from '@/src/lib/logger';
import type { LazyLoadedData, LazyLoaderOptions } from '@/src/lib/schemas/app.schema';
import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';
import { batchFetch, batchMap } from '@/src/lib/utils/batch.utils';

// ============================================
// GITHUB INTEGRATION
// ============================================

/**
 * GitHub repository configuration
 * Hardcoded for security - prevents tampering via environment variables
 */
const GITHUB_CONFIG = {
  owner: 'JSONbored',
  repo: 'claudepro-directory',
  baseUrl: 'https://github.com',
} as const;

/**
 * Content type display names for issue titles
 */
const CONTENT_TYPE_LABELS: Record<ConfigSubmissionData['type'], string> = {
  agents: 'Agent',
  mcp: 'MCP Server',
  rules: 'Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
} as const;

/**
 * Generate formatted issue body from submission data
 */
function generateIssueBody(data: ConfigSubmissionData): string {
  const sections: string[] = [
    '## New Configuration Submission',
    '',
    `**Submission Type:** ${CONTENT_TYPE_LABELS[data.type]}`,
    `**Name:** ${data.name}`,
    `**Author:** ${data.author}`,
    `**Category:** ${data.category}`,
    '',
  ];

  // Description section
  sections.push('### Description');
  sections.push(data.description);
  sections.push('');

  // GitHub URL if provided
  if (data.github?.trim()) {
    sections.push('### Repository');
    sections.push(`**GitHub URL:** ${data.github}`);
    sections.push('');
  }

  // Configuration content
  sections.push('### Configuration');
  sections.push('```');
  sections.push('Type-specific content fields - see PR for details');
  sections.push('```');
  sections.push('');

  // Tags if provided
  if (data.tags && data.tags.length > 0) {
    const tagList = data.tags.map((tag) => `\`${tag}\``).join(', ');
    sections.push('### Tags');
    sections.push(tagList);
    sections.push('');
  }

  // Review checklist
  sections.push('---');
  sections.push('### Review Checklist');
  sections.push('- [ ] Configuration format is valid JSON');
  sections.push('- [ ] All required fields are present');
  sections.push('- [ ] Content follows community guidelines');
  sections.push('- [ ] No security concerns identified');
  sections.push('- [ ] GitHub repository is accessible (if provided)');
  sections.push('- [ ] Appropriate labels have been added');
  sections.push('');

  // Metadata
  sections.push('### Submission Metadata');
  sections.push(`**Submitted:** ${new Date().toISOString()}`);
  sections.push(`**Type:** ${data.type}`);
  sections.push('**Status:** Pending Review');
  sections.push('');

  // Footer
  sections.push('---');
  sections.push('');
  sections.push(
    '*This issue was generated automatically from the ClaudePro Directory submission form.*'
  );

  return sections.join('\n');
}

/**
 * Generate GitHub issue creation URL with pre-filled data
 *
 * @param data - Validated submission data
 * @returns Complete GitHub issue URL
 *
 * @example
 * const url = generateGitHubIssueUrl({
 *   type: 'agents',
 *   name: 'Code Review Agent',
 *   description: 'AI-powered code reviewer',
 *   category: 'Development',
 *   author: 'johndoe',
 *   github: 'https://github.com/user/repo',
 *   content: '{"name": "code-reviewer"}',
 *   tags: ['productivity', 'code-review'],
 * });
 */
export function generateGitHubIssueUrl(data: ConfigSubmissionData): string {
  const title = `New ${CONTENT_TYPE_LABELS[data.type]} Submission: ${data.name}`;
  const body = generateIssueBody(data);
  const labels = ['submission', `type:${data.type}`, 'needs-review'].join(',');

  const baseUrl = `${GITHUB_CONFIG.baseUrl}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues/new`;
  const params = new URLSearchParams({
    title,
    body,
    labels,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validate GitHub issue URL length
 */
export function validateIssueUrlLength(url: string): boolean {
  const MAX_URL_LENGTH = 8000;
  return url.length <= MAX_URL_LENGTH;
}

/**
 * Open GitHub issue in new tab
 */
export function openGitHubIssue(url: string): boolean {
  if (!validateIssueUrlLength(url)) {
    throw new Error('Issue content is too large. Please reduce the configuration size.');
  }

  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    return false; // Popup blocked
  }

  return true;
}

/**
 * Generate direct link element for GitHub issue
 */
export function createGitHubIssueLink(data: ConfigSubmissionData): HTMLAnchorElement {
  const url = generateGitHubIssueUrl(data);
  const link = document.createElement('a');

  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open GitHub Issue';

  return link;
}

// ============================================
// LAZY LOADING UTILITIES
// ============================================

/**
 * Lazy loader for large data sets
 * Loads data only when accessed to optimize memory usage
 */
export class LazyLoader<T> {
  private cache: LazyLoadedData<T> = {
    isLoaded: false,
    data: null,
    loadPromise: null,
  };

  constructor(
    private loader: () => Promise<T>,
    private options: LazyLoaderOptions<T> = {}
  ) {
    if (options.preload) {
      this.load().catch(() => {
        // Preload is optional - errors handled in load() method
      });
    }

    if (options.cacheTimeout && options.cacheTimeout > 0) {
      this.setupCacheTimeout(options.cacheTimeout);
    }
  }

  /**
   * Get the data, loading it if necessary
   */
  async get(): Promise<T> {
    if (this.cache.isLoaded && this.cache.data !== null) {
      return this.cache.data;
    }

    if (this.cache.loadPromise) {
      return this.cache.loadPromise;
    }

    return this.load();
  }

  /**
   * Load the data
   */
  private async load(): Promise<T> {
    if (this.cache.loadPromise) {
      return this.cache.loadPromise;
    }

    this.cache.loadPromise = this.loader()
      .then((data) => {
        this.cache.data = data;
        this.cache.isLoaded = true;
        this.options.onLoad?.(data);
        return data;
      })
      .catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Lazy loader failed', err);
        this.options.onError?.(err);
        this.cache.loadPromise = null;
        throw err;
      });

    return this.cache.loadPromise;
  }

  /**
   * Clear the cache to free memory
   */
  clear(): void {
    this.cache = {
      isLoaded: false,
      data: null,
      loadPromise: null,
    };
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.cache.isLoaded;
  }

  /**
   * Setup automatic cache clearing
   */
  private setupCacheTimeout(timeout: number): void {
    let timer: NodeJS.Timeout | null = null;

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        this.clear();
      }, timeout);
    };

    // Reset timer on every access
    const originalGet = this.get.bind(this);
    this.get = async () => {
      resetTimer();
      return originalGet();
    };
  }
}

/**
 * Create a lazy-loaded module for large data sets
 */
export function createLazyModule<T>(
  importFn: () => Promise<{ default: T } | T>,
  options?: {
    preload?: boolean;
    cacheTimeout?: number;
  }
): LazyLoader<T> {
  return new LazyLoader(async () => {
    const module = await importFn();
    if (module && typeof module === 'object' && 'default' in module) {
      return module.default;
    }
    return module as T;
  }, options);
}

/**
 * Batch lazy loader for loading multiple modules efficiently
 */
export class BatchLazyLoader<T extends Record<string, unknown>> {
  private loaders: Map<keyof T, LazyLoader<T[keyof T]>> = new Map();

  constructor(
    loaderMap: { [K in keyof T]: () => Promise<T[K]> },
    options?: {
      preloadKeys?: (keyof T)[];
      cacheTimeout?: number;
    }
  ) {
    // Initialize loaders
    for (const [key, loader] of Object.entries(loaderMap) as Array<
      [keyof T, () => Promise<T[keyof T]>]
    >) {
      const shouldPreload = options?.preloadKeys?.includes(key);
      const loaderOptions: {
        preload?: boolean;
        cacheTimeout?: number;
      } = {};
      if (shouldPreload) loaderOptions.preload = true;
      if (options?.cacheTimeout !== undefined) loaderOptions.cacheTimeout = options.cacheTimeout;

      this.loaders.set(key, new LazyLoader(loader, loaderOptions));
    }
  }

  /**
   * Get data for a specific key
   */
  async get<K extends keyof T>(key: K): Promise<T[K]> {
    const loader = this.loaders.get(key);
    if (!loader) {
      throw new Error(`No loader registered for key: ${String(key)}`);
    }
    return loader.get() as Promise<T[K]>;
  }

  /**
   * Get multiple keys at once
   */
  async getMany<K extends keyof T>(keys: K[]): Promise<Pick<T, K>> {
    const results = await batchMap(keys, async (key) => [key, await this.get(key)] as const);

    return Object.fromEntries(results) as Pick<T, K>;
  }

  /**
   * Clear cache for specific keys or all
   */
  clear(keys?: (keyof T)[]): void {
    const targetKeys = keys || Array.from(this.loaders.keys());
    for (const key of targetKeys) {
      this.loaders.get(key)?.clear();
    }
  }

  /**
   * Check which modules are loaded
   */
  getLoadedKeys(): (keyof T)[] {
    const loaded: (keyof T)[] = [];
    for (const [key, loader] of this.loaders) {
      if (loader.isLoaded()) {
        loaded.push(key);
      }
    }
    return loaded;
  }
}

/**
 * Memory-efficient paginated data loader
 */
export class PaginatedLazyLoader<T> {
  private pages: Map<number, T[]> = new Map();
  private loadingPages: Map<number, Promise<T[]>> = new Map();

  constructor(
    private loader: (page: number, pageSize: number) => Promise<T[]>,
    private options: {
      pageSize: number;
      maxCachedPages?: number;
      totalItems?: number;
    }
  ) {}

  /**
   * Get items for a specific page
   */
  async getPage(page: number): Promise<T[]> {
    const cachedPage = this.pages.get(page);
    if (cachedPage) {
      return cachedPage;
    }

    const loadingPromise = this.loadingPages.get(page);
    if (loadingPromise) {
      return loadingPromise;
    }

    const loadPromise = this.loader(page, this.options.pageSize)
      .then((data) => {
        this.pages.set(page, data);
        this.loadingPages.delete(page);
        this.enforcePageLimit();
        return data;
      })
      .catch((error) => {
        this.loadingPages.delete(page);
        throw error;
      });

    this.loadingPages.set(page, loadPromise);
    return loadPromise;
  }

  /**
   * Get a range of items
   */
  async getRange(startIndex: number, endIndex: number): Promise<T[]> {
    const startPage = Math.floor(startIndex / this.options.pageSize);
    const endPage = Math.floor(endIndex / this.options.pageSize);

    const pagePromises: Promise<T[]>[] = [];
    for (let page = startPage; page <= endPage; page++) {
      pagePromises.push(this.getPage(page));
    }

    const pages = await batchFetch(pagePromises);
    const allItems = pages.flat();

    const startOffset = startIndex % this.options.pageSize;
    const itemsNeeded = endIndex - startIndex + 1;

    return allItems.slice(startOffset, startOffset + itemsNeeded);
  }

  /**
   * Enforce maximum cached pages limit
   */
  private enforcePageLimit(): void {
    if (!this.options.maxCachedPages || this.pages.size <= this.options.maxCachedPages) {
      return;
    }

    const pagesToRemove = this.pages.size - this.options.maxCachedPages;
    const pageNumbers = Array.from(this.pages.keys());

    for (let i = 0; i < pagesToRemove; i++) {
      const pageNumber = pageNumbers[i];
      if (pageNumber !== undefined) {
        this.pages.delete(pageNumber);
      }
    }
  }

  /**
   * Clear all cached pages
   */
  clear(): void {
    this.pages.clear();
    this.loadingPages.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cachedPages: number;
    loadingPages: number;
    cachedItems: number;
  } {
    const cachedItems = Array.from(this.pages.values()).reduce((sum, page) => sum + page.length, 0);

    return {
      cachedPages: this.pages.size,
      loadingPages: this.loadingPages.size,
      cachedItems,
    };
  }
}
