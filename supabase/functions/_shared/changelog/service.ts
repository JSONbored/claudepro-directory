import { SITE_URL } from '../clients/supabase.ts';
import type { Database, Json } from '../database.types.ts';
import type { ChangelogSection, GitHubCommit } from '../utils/discord/embeds.ts';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
const GITHUB_REPO_OWNER = Deno.env.get('GITHUB_REPO_OWNER');
const GITHUB_REPO_NAME = Deno.env.get('GITHUB_REPO_NAME');
const REVALIDATE_SECRET = Deno.env.get('REVALIDATE_SECRET');

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

export type ChangelogInsert = Database['public']['Tables']['changelog_entries']['Insert'];
export type ChangelogRow = Database['public']['Tables']['changelog_entries']['Row'];

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

  const data = await response.json();
  return data.commits || [];
}

export function filterConventionalCommits(commits: GitHubCommit[]): GitHubCommit[] {
  const conventionalCommitRegex = /^(feat|fix|refactor|perf|style|revert)(\(.+\))?: .+/;
  return commits.filter((commit) => {
    const firstLine = commit.commit.message.split('\n')[0];
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
    const typeMatch = firstLine.match(/^(\w+)(\(.+\))?: (.+)/);

    if (!typeMatch) continue;

    const [, type, , message] = typeMatch;

    if (type === 'feat') {
      sections.Added.push(message);
    } else if (type === 'fix' || type === 'revert') {
      sections.Fixed.push(message);
    } else {
      sections.Changed.push(message);
    }
  }

  return Object.entries(sections)
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => ({ title, items }));
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
    if (changes[section.title] !== undefined) {
      changes[section.title] = section.items;
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

  const firstCommit = commits[0].commit.message.split('\n')[0];
  const titleMatch = firstCommit.match(/^(feat|fix|refactor|perf|style|revert)(\(.+\))?: (.+)/);

  if (titleMatch) {
    const [, , , message] = titleMatch;
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  return 'General Updates';
}

export function generateTldr(commits: GitHubCommit[]): string {
  const firstCommit = commits[0]?.commit.message.split('\n')[0];
  if (!firstCommit) return 'General improvements and fixes.';

  const match = firstCommit.match(/:(.*)/);
  return match ? match[1].trim() : firstCommit;
}

export function formatCommitRange(base: string, head: string): string {
  return `${base.slice(0, 7)}...${head.slice(0, 7)}`;
}

export async function revalidateChangelogPages(slug: string) {
  if (!REVALIDATE_SECRET) return;

  const urls = [
    `${SITE_URL}/api/revalidate?secret=${REVALIDATE_SECRET}&path=/changelog`,
    `${SITE_URL}/api/revalidate?secret=${REVALIDATE_SECRET}&path=/changelog/${slug}`,
  ];

  await Promise.all(
    urls.map(async (revalidateUrl) => {
      try {
        const response = await fetch(revalidateUrl, { method: 'POST' });
        if (!response.ok) {
          console.error('Failed to revalidate path:', revalidateUrl, await response.text());
        }
      } catch (error) {
        console.error('Revalidate error:', error);
      }
    })
  );
}
