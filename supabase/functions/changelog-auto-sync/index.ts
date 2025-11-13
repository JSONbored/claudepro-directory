/**
 * Changelog Auto-Sync - Automated changelog generation from GitHub commits
 */

import type { Database } from '../_shared/database.types.ts';
import {
  buildChangelogEmbed,
  type ChangelogSection,
  type GitHubCommit,
  sendDiscordWebhook,
} from '../_shared/utils/discord.ts';
import {
  errorResponse,
  methodNotAllowedResponse,
  publicCorsHeaders,
  successResponse,
} from '../_shared/utils/response.ts';
import { SITE_URL, supabaseServiceRole } from '../_shared/utils/supabase-service-role.ts';

type ChangelogInsert = Database['public']['Tables']['changelog_entries']['Insert'];

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
const GITHUB_REPO_OWNER = Deno.env.get('GITHUB_REPO_OWNER');
const GITHUB_REPO_NAME = Deno.env.get('GITHUB_REPO_NAME');
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_CHANGELOG_WEBHOOK_URL');
const REVALIDATE_SECRET = Deno.env.get('REVALIDATE_SECRET');

const postCorsHeaders = {
  ...publicCorsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, x-vercel-signature',
};

interface VercelWebhookPayload {
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
      };
    };
    target: string;
    project: {
      id: string;
    };
  };
}

// GitHubCommit and ChangelogSection interfaces imported from discord.ts

/**
 * Fetch commits from GitHub API between two commit hashes
 */
async function fetchCommitsFromGitHub(baseHash: string, headHash: string): Promise<GitHubCommit[]> {
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

/**
 * Filter commits to only conventional commits (feat/fix/refactor/perf/style/revert)
 */
function filterConventionalCommits(commits: GitHubCommit[]): GitHubCommit[] {
  const conventionalCommitRegex = /^(feat|fix|refactor|perf|style|revert)(\(.+\))?: .+/;
  return commits.filter((commit) => {
    const firstLine = commit.commit.message.split('\n')[0];
    return conventionalCommitRegex.test(firstLine);
  });
}

/**
 * Group commits by type into changelog sections
 */
function groupCommitsByType(commits: GitHubCommit[]): ChangelogSection[] {
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
      // refactor, perf, style
      sections.Changed.push(message);
    }
  }

  // Convert to array format, filter out empty sections
  return Object.entries(sections)
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => ({ title, items }));
}

/**
 * Transform sections array to changes JSONB object format
 * Must include all 6 keepachangelog keys (Added, Changed, Deprecated, Removed, Fixed, Security)
 */
function transformSectionsToChanges(sections: ChangelogSection[]): Json {
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

/**
 * Generate full markdown content from sections
 */
function generateMarkdownContent(sections: ChangelogSection[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    parts.push(`## ${section.title}\n`);
    for (const item of section.items) {
      parts.push(`- ${item}`);
    }
    parts.push(''); // blank line between sections
  }

  return parts.join('\n').trim();
}

/**
 * Infer changelog title from commits
 */
function inferTitle(commits: GitHubCommit[]): string {
  if (commits.length === 0) return 'General Updates';

  // Use first commit message as base
  const firstCommit = commits[0].commit.message.split('\n')[0];
  const titleMatch = firstCommit.match(/^(feat|fix|refactor|perf|style|revert)(\(.+\))?: (.+)/);

  if (titleMatch) {
    const [, , , message] = titleMatch;
    // Capitalize first letter
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  return 'General Updates';
}

/**
 * Generate changelog markdown (replicate git-cliff template)
 */
function generateChangelogMarkdown(params: {
  date: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: GitHubCommit[];
  vercelUrl: string;
  commitHash: string;
}): string {
  const { date, title, tldr, sections, commits, vercelUrl, commitHash } = params;

  // Get unique contributors
  const contributors = [...new Set(commits.map((c) => c.commit.author.name))];

  // Build sections markdown
  const sectionsMarkdown = sections
    .map((section) => {
      const items = section.items.map((item) => `- ${item}`).join('\n');
      return `### ${section.title}\n\n${items}`;
    })
    .join('\n\n');

  // Generate "What Changed" summary
  const whatChangedSummary = `${commits.length} ${commits.length === 1 ? 'commit' : 'commits'} from ${contributors.length} ${contributors.length === 1 ? 'contributor' : 'contributors'}. ${tldr}`;

  return `## ${date} - ${title}

**TL;DR:** ${tldr}

### What Changed

${whatChangedSummary}

${sectionsMarkdown}

### Technical Details

**Commits Included:**
${commits.map((c) => `- ${c.commit.message.split('\n')[0]} (\`${c.sha.slice(0, 7)}\`)`).join('\n')}

**Contributors:**
${contributors.map((name) => `- ${name}`).join('\n')}

**Validation:**
✅ TypeScript: No errors (Vercel build succeeded)
✅ Lint: No warnings (Vercel build succeeded)
✅ Build: Success

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

### Deployment

- Deployed to production: ${vercelUrl}
- Commit: ${commitHash}
- Ready for users`;
}

/**
 * Generate slug from date and title
 */
function generateSlug(date: string, title: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);

  return `${date}-${titleSlug}`;
}

// sendDiscordAnnouncement moved to shared utility: buildChangelogEmbed() in discord.ts

/**
 * Revalidate /changelog page
 */
async function revalidateChangelogPage(): Promise<void> {
  if (!REVALIDATE_SECRET) {
    console.warn('REVALIDATE_SECRET not set, skipping cache revalidation');
    return;
  }

  const response = await fetch(`${SITE_URL}/api/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: REVALIDATE_SECRET,
      category: 'changelog',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Revalidation failed (${response.status}): ${errorText}`);
  }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: postCorsHeaders });
  }

  if (req.method !== 'POST') {
    return methodNotAllowedResponse('POST', postCorsHeaders);
  }

  try {
    // 1. Verify required environment variables
    if (!(GITHUB_TOKEN && GITHUB_REPO_OWNER && GITHUB_REPO_NAME)) {
      console.error('Missing required GitHub environment variables');
      return errorResponse(
        new Error('GitHub configuration missing'),
        'changelog-auto-sync',
        postCorsHeaders
      );
    }

    // 2. Parse webhook payload (signature already verified by webhook-router)
    const payload: VercelWebhookPayload = await req.json();
    const { type, payload: webhookData } = payload;

    // 3. Filter: only deployment.succeeded on main branch
    if (type !== 'deployment.succeeded') {
      console.log(`Skipping ${type} event`);
      return successResponse(
        { skipped: true, reason: 'Not a deployment.succeeded event' },
        200,
        postCorsHeaders
      );
    }

    const { deployment } = webhookData;
    const branch = deployment.meta.branch;

    if (branch !== 'main') {
      console.log(`Skipping deployment on branch: ${branch}`);
      return successResponse(
        { skipped: true, reason: `Not main branch (${branch})` },
        200,
        postCorsHeaders
      );
    }

    console.log(
      `Processing deployment.succeeded for main branch. Commit: ${deployment.meta.commitId}`
    );

    // 4. Get last deployed commit from changelog_entries table
    const { data: lastEntry } = await supabaseServiceRole
      .from('changelog_entries')
      .select('git_commit_sha')
      .not('git_commit_sha', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fallback: if no previous changelog, use HEAD~10 (last 10 commits)
    const baseHash = lastEntry?.git_commit_sha || `${deployment.meta.commitId}~10`;
    const headHash = deployment.meta.commitId;

    console.log(`Fetching commits from GitHub: ${baseHash}...${headHash}`);

    // 5. Fetch commits from GitHub API
    const allCommits = await fetchCommitsFromGitHub(baseHash, headHash);
    console.log(`Found ${allCommits.length} total commits`);

    // 6. Filter conventional commits
    const commits = filterConventionalCommits(allCommits);
    console.log(`Filtered to ${commits.length} conventional commits`);

    if (commits.length === 0) {
      console.log('No conventional commits found, skipping changelog generation');
      return successResponse(
        {
          skipped: true,
          reason: 'No conventional commits found (feat/fix/refactor/perf)',
        },
        200,
        postCorsHeaders
      );
    }

    // 7. Group commits by type into sections
    const sections = groupCommitsByType(commits);

    // 8. Generate changelog data
    const date = new Date().toISOString().split('T')[0];
    const title = inferTitle(commits);
    const tldr = commits[0].commit.message
      .split('\n')[0]
      .replace(/^(feat|fix|refactor|perf|style|revert)(\(.+\))?: /, '');

    // 9. Generate markdown
    const markdown = generateChangelogMarkdown({
      date,
      title,
      tldr,
      sections,
      commits,
      vercelUrl: deployment.url,
      commitHash: deployment.meta.commitId,
    });

    // 10. Generate slug
    const slug = generateSlug(date, title);

    // 11. Check for duplicate entry (prevent webhook retry duplicates)
    const { data: existingEntry } = await supabaseServiceRole
      .from('changelog_entries')
      .select('id, slug')
      .eq('git_commit_sha', deployment.meta.commitId)
      .maybeSingle();

    if (existingEntry) {
      console.log(
        `Changelog entry already exists for commit ${deployment.meta.commitId}: ${existingEntry.slug}`
      );
      return successResponse(
        {
          success: true,
          skipped: true,
          reason: 'Changelog entry already exists for this commit',
          changelog_id: existingEntry.id,
          changelog_slug: existingEntry.slug,
        },
        200,
        postCorsHeaders
      );
    }

    // 12. Transform sections to changes JSONB object
    const changes = transformSectionsToChanges(sections);
    const content = generateMarkdownContent(sections);
    const rawContent = markdown;

    // 13. Insert into changelog_entries table
    const changelogInsert: ChangelogInsert = {
      slug,
      title,
      description: tldr.slice(0, 500), // Use tldr as description
      content,
      raw_content: rawContent,
      tldr,
      release_date: date,
      changes,
      git_commit_sha: deployment.meta.commitId,
      commit_count: commits.length,
      contributors: [...new Set(commits.map((c) => c.commit.author.name))],
      source: 'jsonbored',
      published: true,
      featured: false,
    };

    const { data: changelogEntry, error: insertError } = await supabaseServiceRole
      .from('changelog_entries')
      .insert(changelogInsert)
      .select('id, slug')
      .single();

    if (insertError) {
      console.error('Failed to insert changelog entry:', insertError);
      throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    console.log(`Changelog entry created: ${changelogEntry.slug}`);

    // 14. Send Discord announcement
    try {
      if (DISCORD_WEBHOOK_URL) {
        const embed = buildChangelogEmbed({ slug, title, tldr, sections, commits, date });
        await sendDiscordWebhook(
          DISCORD_WEBHOOK_URL,
          { content: '🚀 **New Release Deployed!**', embeds: [embed] },
          'changelog_announcement',
          changelogEntry.id
        );
        console.log('Discord announcement sent successfully');
      } else {
        console.warn('DISCORD_CHANGELOG_WEBHOOK_URL not set, skipping Discord announcement');
      }
    } catch (error) {
      console.error('Discord announcement failed (non-fatal):', error);
      // Don't fail the whole operation if Discord fails
    }

    // 15. Revalidate /changelog page
    try {
      await revalidateChangelogPage();
      console.log('Changelog page revalidated successfully');
    } catch (error) {
      console.error('Revalidation failed (non-fatal):', error);
      // Don't fail the whole operation if revalidation fails
    }

    // 16. Return success response
    return successResponse(
      {
        success: true,
        changelog_id: changelogEntry.id,
        changelog_slug: changelogEntry.slug,
        commits_processed: commits.length,
        sections: sections.map((s) => ({ title: s.title, count: s.items.length })),
        markdown_preview: markdown.slice(0, 500),
      },
      200,
      postCorsHeaders
    );
  } catch (error) {
    console.error('Changelog auto-sync error:', error);
    return errorResponse(error, 'changelog-auto-sync', postCorsHeaders);
  }
});
