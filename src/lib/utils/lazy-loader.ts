/**
 * Lazy Loading Utility for Large Generated Files
 * Optimizes memory usage by loading data only when needed
 */

import { logger } from "@/src/lib/logger";
import type {
  LazyLoadedData,
  LazyLoaderOptions,
} from "@/src/lib/schemas/app.schema";

/**
 * Creates a lazy-loaded data wrapper that loads data only when accessed
 */
export class LazyLoader<T> {
  private cache: LazyLoadedData<T> = {
    isLoaded: false,
    data: null,
    loadPromise: null,
  };

  constructor(
    private loader: () => Promise<T>,
    private options: LazyLoaderOptions<T> = {},
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
        logger.error("Lazy loader failed", err);
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
  },
): LazyLoader<T> {
  return new LazyLoader(async () => {
    const module = await importFn();
    if (module && typeof module === "object" && "default" in module) {
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
    },
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
      if (options?.cacheTimeout !== undefined)
        loaderOptions.cacheTimeout = options.cacheTimeout;

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
    const results = await Promise.all(
      keys.map(async (key) => [key, await this.get(key)] as const),
    );

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
    },
  ) {}

  /**
   * Get items for a specific page
   */
  async getPage(page: number): Promise<T[]> {
    // Check cache
    if (this.pages.has(page)) {
      return this.pages.get(page)!;
    }

    // Check if already loading
    if (this.loadingPages.has(page)) {
      return this.loadingPages.get(page)!;
    }

    // Load page
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

    const pages = await Promise.all(pagePromises);
    const allItems = pages.flat();

    // Calculate the exact slice needed
    const startOffset = startIndex % this.options.pageSize;
    const itemsNeeded = endIndex - startIndex + 1;

    return allItems.slice(startOffset, startOffset + itemsNeeded);
  }

  /**
   * Enforce maximum cached pages limit
   */
  private enforcePageLimit(): void {
    if (
      !this.options.maxCachedPages ||
      this.pages.size <= this.options.maxCachedPages
    ) {
      return;
    }

    // Remove oldest pages (assuming Map maintains insertion order)
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
    const cachedItems = Array.from(this.pages.values()).reduce(
      (sum, page) => sum + page.length,
      0,
    );

    return {
      cachedPages: this.pages.size,
      loadingPages: this.loadingPages.size,
      cachedItems,
    };
  }
}
