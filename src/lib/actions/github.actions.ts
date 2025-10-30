/**
 * GitHub API Actions - Database-first GitHub data fetching with caching
 */

'use server';

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';
import { publicGithubRepoStatsRowSchema } from '@/src/lib/schemas/generated/db-schemas';
import { createClient } from '@/src/lib/supabase/server';

// Use ONLY generated schema - pick repo_url field
const getGitHubStarsSchema = publicGithubRepoStatsRowSchema.pick({ repo_url: true });

export const getGitHubStars = rateLimitedAction
  .metadata({ actionName: 'getGitHubStars', category: 'content' })
  .schema(getGitHubStarsSchema)
  .action(async ({ parsedInput }) => {
    const { repo_url } = parsedInput;
    const repoUrl = repo_url;
    const supabase = await createClient();

    // Step 1: Check database cache (1-hour TTL)
    const { data: cachedData, error: cacheError } = await supabase.rpc('get_github_stars', {
      p_repo_url: repoUrl,
    });

    if (cacheError) {
      logger.error('Failed to fetch GitHub stars from cache', cacheError, { repoUrl });
      throw new Error('Failed to fetch GitHub stars');
    }

    const cache = cachedData?.[0];

    // Step 2: If cached and fresh, return immediately
    if (cache?.is_cached) {
      return {
        stars: cache.stars,
        forks: cache.forks,
        watchers: cache.watchers,
        openIssues: cache.open_issues,
        lastFetchedAt: cache.last_fetched_at,
        cached: true,
      };
    }

    // Step 3: Cache is stale/missing - fetch from GitHub API
    const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    if (!match?.[1]) {
      throw new Error('Invalid GitHub URL format');
    }

    const repo = match[1];

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 3600 }, // 1 hour cache at Next.js level too
      });

      if (!response.ok) {
        // Rate limited or API error - return stale cache if available
        if (cache?.stars !== undefined) {
          logger.warn('GitHub API failed, returning stale cache', undefined, {
            repo,
            status: response.status,
            error: `Status ${response.status}`,
          });
          return {
            stars: cache.stars,
            forks: cache.forks,
            watchers: cache.watchers,
            openIssues: cache.open_issues,
            lastFetchedAt: cache.last_fetched_at,
            cached: true,
            stale: true,
          };
        }
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.stargazers_count !== 'number') {
        throw new Error('Invalid GitHub API response');
      }

      // Step 4: Upsert fresh data into database
      const { error: upsertError } = await supabase.rpc('upsert_github_stars', {
        p_repo_url: repoUrl,
        p_stars: data.stargazers_count,
        p_forks: data.forks_count ?? null,
        p_watchers: data.watchers_count ?? null,
        p_open_issues: data.open_issues_count ?? null,
      });

      if (upsertError) {
        logger.error('Failed to upsert GitHub stars', upsertError, { repo });
        // Non-fatal - return data anyway
      }

      return {
        stars: data.stargazers_count,
        forks: data.forks_count ?? null,
        watchers: data.watchers_count ?? null,
        openIssues: data.open_issues_count ?? null,
        lastFetchedAt: new Date().toISOString(),
        cached: false,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to fetch GitHub stars from API', err, { repo });

      // Return stale cache if available
      if (cache?.stars !== undefined) {
        return {
          stars: cache.stars,
          forks: cache.forks,
          watchers: cache.watchers,
          openIssues: cache.open_issues,
          lastFetchedAt: cache.last_fetched_at,
          cached: true,
          stale: true,
        };
      }

      throw new Error('Failed to fetch GitHub stars and no cache available');
    }
  });
