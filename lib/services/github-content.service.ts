import { githubConfig } from '@/lib/schemas/env.schema';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

interface CacheEntry {
  data: GitHubFile[];
  etag: string;
  timestamp: number;
}

class GitHubContentService {
  private cache = new Map<string, CacheEntry>();
  private readonly baseUrl = 'https://api.github.com';
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'claudepro-directory',
    };

    if (githubConfig.token) {
      headers.Authorization = `token ${githubConfig.token}`;
    }

    return headers;
  }

  private getCacheKey(path: string): string {
    return `${githubConfig.owner}/${githubConfig.repo}/${githubConfig.branch}/${path}`;
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTimeout;
  }

  async getDirectoryContents(path: string): Promise<GitHubFile[]> {
    const cacheKey = this.getCacheKey(path);
    const cachedEntry = this.cache.get(cacheKey);

    const headers = this.getHeaders();
    if (cachedEntry?.etag) {
      headers['If-None-Match'] = cachedEntry.etag;
    }

    try {
      const url = `${this.baseUrl}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}?ref=${githubConfig.branch}`;
      const response = await fetch(url, { headers });

      if (response.status === 304 && cachedEntry) {
        cachedEntry.timestamp = Date.now();
        return cachedEntry.data;
      }

      if (!response.ok) {
        if (cachedEntry && this.isValidCache(cachedEntry)) {
          return cachedEntry.data;
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as GitHubFile[];
      const etag = response.headers.get('etag') || '';

      this.cache.set(cacheKey, {
        data,
        etag,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      if (cachedEntry && this.isValidCache(cachedEntry)) {
        return cachedEntry.data;
      }
      throw error;
    }
  }

  async getFileContent(path: string): Promise<string> {
    const cacheKey = `content:${this.getCacheKey(path)}`;
    const cachedEntry = this.cache.get(cacheKey);

    const headers = this.getHeaders();
    if (cachedEntry?.etag) {
      headers['If-None-Match'] = cachedEntry.etag;
    }

    try {
      const url = `${this.baseUrl}/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}?ref=${githubConfig.branch}`;
      const response = await fetch(url, { headers });

      if (response.status === 304 && cachedEntry) {
        cachedEntry.timestamp = Date.now();
        return cachedEntry.data[0] as unknown as string;
      }

      if (!response.ok) {
        if (cachedEntry && this.isValidCache(cachedEntry)) {
          return cachedEntry.data[0] as unknown as string;
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const fileData = (await response.json()) as GitHubFile;

      if (!fileData.content) {
        throw new Error(`File content not available: ${path}`);
      }

      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const etag = response.headers.get('etag') || '';

      this.cache.set(cacheKey, {
        data: [content] as unknown as GitHubFile[],
        etag,
        timestamp: Date.now(),
      });

      return content;
    } catch (error) {
      if (cachedEntry && this.isValidCache(cachedEntry)) {
        return cachedEntry.data[0] as unknown as string;
      }
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const githubContentService = new GitHubContentService();
