import { SITE_URL } from '../clients/supabase.ts';
import { edgeEnv } from '../config/env.ts';
import type { Database as DatabaseGenerated, Json } from '../database.types.ts';
import { invalidateCacheByKey } from '../utils/cache.ts';
import type { ChangelogSection, GitHubCommit } from '../utils/discord/embeds.ts';

const GITHUB_TOKEN = edgeEnv.github.token;
const GITHUB_REPO_OWNER = edgeEnv.github.repoOwner;
const GITHUB_REPO_NAME = edgeEnv.github.repoName;
const REVALIDATE_SECRET = edgeEnv.revalidate.secret;

export interface VercelWebhookPayload {
  type: string;
  id: string;
  createdAt: number;
  payload: {
    deployment: {
      id: string;
      url: string;
      meta: {
        branch: string;
        commitId: string;
        commitMessage: string;
        previousCommitId?: string;
      };
    };
    target: string;
    project: {
      id: string;
    };
  };
}

// Use DatabaseGenerated directly to match the Supabase client type
// This ensures type compatibility with createClient<DatabaseGenerated>
export type ChangelogInsert = DatabaseGenerated['public']['Tables']['changelog']['Insert'];
export type ChangelogRow = DatabaseGenerated['public']['Tables']['changelog']['Row'];

interface BuildChangelogMetadataParams {
  sections: ChangelogSection[];
  releaseDate: string;
  deploymentUrl: string;
  branch: string;
  commitSha: string;
  commitCount: number;
  contributors: string[];
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStructuredSections(sections: ChangelogSection[]): Json[] {
  return sections
    .filter((section) => Array.isArray(section.items) && section.items.length > 0)
    .flatMap((section) => {
      const listItems = section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
      if (!listItems) {
        return [];
      }
      return [
        {
          type: 'heading',
          level: 3,
          content: section.title,
        },
        {
          type: 'text',
          content: `<ul>${listItems}</ul>`,
        },
      ];
    }) as Json[];
}

export function buildChangelogMetadata(params: BuildChangelogMetadataParams): Json {
  const structuredSections = buildStructuredSections(params.sections);

  const metadata: Record<string, Json> = {
    release: {
      date: params.releaseDate,
      branch: params.branch,
      deployment_url: params.deploymentUrl,
    },
    git: {
      commit_sha: params.commitSha,
      commit_count: params.commitCount,
      contributors: params.contributors,
    },
  };

  if (structuredSections.length > 0) {
    metadata['sections'] = structuredSections;
  }

  return metadata;
}

export function deriveChangelogKeywords(
  sections: ChangelogSection[],
  branch?: string
): string[] | undefined {
  const baseKeywords = ['changelog', 'release'];
  const sectionKeywords = sections.map((section) => section.title.toLowerCase());
  const branchKeyword = branch ? [branch] : [];
  const keywords = Array.from(new Set([...baseKeywords, ...sectionKeywords, ...branchKeyword]));
  return keywords.length ? keywords : undefined;
}

export async function fetchCommitsFromGitHub(
  baseHash: string,
  headHash: string
): Promise<GitHubCommit[]> {
  const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/compare/${baseHash}...${headHash}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ClaudeProDirectory-ChangelogBot',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { commits?: unknown[] };
  return (data.commits || []) as GitHubCommit[];
}

export function filterConventionalCommits(commits: GitHubCommit[]): GitHubCommit[] {
  const conventionalCommitRegex = /^(feat|fix|refactor|perf|style|revert)(\(.+\))?: .+/;
  return commits.filter((commit) => {
    const firstLine = commit.commit.message.split('\n')[0];
    if (!firstLine) return false;
    return conventionalCommitRegex.test(firstLine);
  });
}

export function groupCommitsByType(commits: GitHubCommit[]): ChangelogSection[] {
  const sections: Record<string, string[]> = {
    Added: [],
    Changed: [],
    Fixed: [],
  };

  for (const commit of commits) {
    const firstLine = commit.commit.message.split('\n')[0];
    if (!firstLine) continue;

    const typeMatch = firstLine.match(/^(\w+)(\(.+\))?: (.+)/);

    if (!typeMatch) continue;

    const [, type, , message] = typeMatch;
    if (!message) continue;

    if (type === 'feat') {
      sections['Added']?.push(message);
    } else if (type === 'fix' || type === 'revert') {
      sections['Fixed']?.push(message);
    } else {
      sections['Changed']?.push(message);
    }
  }

  return Object.entries(sections)
    .filter(([, items]) => items && items.length > 0)
    .map(([title, items]) => ({ title, items: items ?? [] }));
}

export function transformSectionsToChanges(sections: ChangelogSection[]): Json {
  const changes: Record<string, string[]> = {
    Added: [],
    Changed: [],
    Deprecated: [],
    Removed: [],
    Fixed: [],
    Security: [],
  };

  for (const section of sections) {
    const changeKey = section.title;
    if (changes[changeKey] !== undefined) {
      changes[changeKey] = section.items;
    }
  }

  return changes as Json;
}

export function generateMarkdownContent(sections: ChangelogSection[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    parts.push(`## ${section.title}\n`);
    for (const item of section.items) {
      parts.push(`- ${item}`);
    }
    parts.push('');
  }

  return parts.join('\n').trim();
}

export function inferTitle(commits: GitHubCommit[]): string {
  if (commits.length === 0) return 'General Updates';

  const firstCommit = commits[0];
  if (!firstCommit) return 'General Updates';

  const firstLine = firstCommit.commit.message.split('\n')[0];
  if (!firstLine) return 'General Updates';

  const titleMatch = firstLine.match(/^(feat|fix|refactor|perf|style|revert)(\(.+\))?: (.+)/);

  if (titleMatch) {
    const message = titleMatch[3];
    if (!message) return 'General Updates';
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  return 'General Updates';
}

export function generateTldr(commits: GitHubCommit[]): string {
  const firstCommit = commits[0]?.commit.message.split('\n')[0];
  if (!firstCommit) return 'General improvements and fixes.';

  const match = firstCommit.match(/:(.*)/);
  return match?.[1] ? match[1].trim() : firstCommit;
}

export function formatCommitRange(base: string, head: string): string {
  return `${base.slice(0, 7)}...${head.slice(0, 7)}`;
}

export async function revalidateChangelogPages(
  slug: string,
  options?: { invalidateTags?: boolean }
) {
  if (!REVALIDATE_SECRET) return;

  // Tag invalidation (new, optional, defaults to true)
  if (options?.invalidateTags !== false) {
    await invalidateCacheByKey('cache.invalidate.changelog', ['changelog'], {
      category: 'changelog',
      slug,
      logContext: {
        function: 'changelog-service',
        action: 'revalidate',
        slug,
      },
    }).catch(async (error) => {
      const { errorToString } = await import('../utils/error-handling.ts');
      console.warn('[changelog-service] Cache tag invalidation failed', {
        function: 'changelog-service',
        action: 'revalidate',
        slug,
        error: errorToString(error),
      });
    });
  }

  // Path revalidation (existing behavior, modernized to use body-based API)
  const paths = ['/changelog', `/changelog/${slug}`];

  await Promise.all(
    paths.map(async (path) => {
      try {
        const response = await fetch(`${SITE_URL}/api/revalidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: REVALIDATE_SECRET,
            category: 'changelog',
            slug: path === '/changelog' ? undefined : slug,
          }) as string,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[changelog-service] Failed to revalidate path', {
            function: 'changelog-service',
            action: 'revalidate',
            slug,
            path,
            status: response.status,
            error: errorText,
          });
        }
      } catch (error) {
        const { errorToString } = await import('../utils/error-handling.ts');
        console.error('[changelog-service] Revalidate error', {
          function: 'changelog-service',
          action: 'revalidate',
          slug,
          path,
          error: errorToString(error),
        });
      }
    })
  );
}
