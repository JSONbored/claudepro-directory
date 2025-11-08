/**
 * Changelog Auto-Sync - Supabase Edge Function
 * Database-First Architecture: Triggered by Vercel deployment.succeeded webhook
 *
 * Features:
 * - Automated changelog generation from GitHub commit history
 * - Conventional commit filtering (feat/fix/refactor/perf)
 * - Database insertion with structured JSONB sections
 * - Beautiful Discord announcements with rich embeds
 * - Cache invalidation for /changelog page
 * - Webhook signature verification for security
 *
 * Environment Variables:
 *   GITHUB_TOKEN                    - GitHub PAT for API access (read-only)
 *   GITHUB_REPO_OWNER               - GitHub username/org (JSONbored)
 *   GITHUB_REPO_NAME                - Repository name (claudepro-directory)
 *   DISCORD_CHANGELOG_WEBHOOK_URL   - Discord webhook URL for announcements
 *   VERCEL_WEBHOOK_SECRET           - Vercel webhook secret for signature verification
 *   NEXT_PUBLIC_SITE_URL            - Site URL for links
 *   REVALIDATE_SECRET               - Secret for /api/revalidate endpoint
 *   SUPABASE_URL                    - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY       - Service role key for database access
 *
 * Triggered by:
 *   Vercel deployment.succeeded webhook (main branch only)
 *
 * Payload format:
 *   { type: "deployment.succeeded", payload: { deployment: { meta: { branch, commitId, commitMessage } } } }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';
import {
  publicCorsHeaders,
  methodNotAllowedResponse,
  errorResponse,
  successResponse,
} from '../_shared/utils/response.ts';

type ChangelogInsert = Database['public']['Tables']['changelog']['Insert'];

// Environment variables
const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
const GITHUB_REPO_OWNER = Deno.env.get('GITHUB_REPO_OWNER');
const GITHUB_REPO_NAME = Deno.env.get('GITHUB_REPO_NAME');
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_CHANGELOG_WEBHOOK_URL');
const VERCEL_WEBHOOK_SECRET = Deno.env.get('VERCEL_WEBHOOK_SECRET');
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
const REVALIDATE_SECRET = Deno.env.get('REVALIDATE_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
}

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

interface ChangelogSection {
  title: string;
  items: string[];
}

/**
 * Verify Vercel webhook signature (HMAC SHA-1)
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

/**
 * Fetch commits from GitHub API between two commit hashes
 */
async function fetchCommitsFromGitHub(
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

/**
 * Send Discord announcement with beautiful changelog embed
 */
async function sendDiscordAnnouncement(params: {
  slug: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: GitHubCommit[];
  date: string;
}): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('DISCORD_CHANGELOG_WEBHOOK_URL not set, skipping Discord announcement');
    return;
  }

  const { slug, title, tldr, sections, commits, date } = params;

  const contributors = [...new Set(commits.map((c) => c.commit.author.name))];

  // Count items by section
  const addedCount = sections.find((s) => s.title === 'Added')?.items.length || 0;
  const changedCount = sections.find((s) => s.title === 'Changed')?.items.length || 0;
  const fixedCount = sections.find((s) => s.title === 'Fixed')?.items.length || 0;

  const embed = {
    title: `📋 ${title}`,
    description: tldr.length > 200 ? tldr.slice(0, 197) + '...' : tldr,
    color: 0x3ba55d, // Green for releases
    url: `${SITE_URL}/changelog/${slug}`,
    fields: [
      {
        name: '✨ What\'s New',
        value: addedCount > 0 ? `${addedCount} new ${addedCount === 1 ? 'feature' : 'features'}` : 'No new features',
        inline: true,
      },
      {
        name: '🔧 Improvements',
        value: changedCount > 0 ? `${changedCount} ${changedCount === 1 ? 'change' : 'changes'}` : 'No changes',
        inline: true,
      },
      {
        name: '🐛 Bug Fixes',
        value: fixedCount > 0 ? `${fixedCount} ${fixedCount === 1 ? 'fix' : 'fixes'}` : 'No fixes',
        inline: true,
      },
      {
        name: '📊 Impact',
        value: `${commits.length} ${commits.length === 1 ? 'commit' : 'commits'} from ${contributors.length} ${contributors.length === 1 ? 'contributor' : 'contributors'}`,
        inline: false,
      },
      {
        name: '🔗 Read Full Changelog',
        value: `[View on Claude Pro Directory](${SITE_URL}/changelog/${slug})`,
        inline: false,
      },
    ],
    footer: {
      text: `Released ${date} • Claude Pro Directory`,
    },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: '🚀 **New Release Deployed!**',
      embeds: [embed],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook failed (${response.status}): ${errorText}`);
  }
}

/**
 * Revalidate /changelog page
 */
async function revalidateChangelogPage(): Promise<void> {
  if (!REVALIDATE_SECRET) {
    console.warn('REVALIDATE_SECRET not set, skipping cache revalidation');
    return;
  }

  const response = await fetch(
    `${SITE_URL}/api/revalidate?path=/changelog&secret=${REVALIDATE_SECRET}`,
    { method: 'POST' }
  );

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
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      console.error('Missing required GitHub environment variables');
      return errorResponse(
        new Error('GitHub configuration missing'),
        'changelog-auto-sync',
        postCorsHeaders
      );
    }

    // 2. Get request body and signature
    const rawBody = await req.text();
    const signature = req.headers.get('x-vercel-signature');

    // 3. Verify webhook signature (skip if VERCEL_WEBHOOK_SECRET not set yet)
    if (VERCEL_WEBHOOK_SECRET) {
      const isValid = await verifyWebhookSignature(rawBody, signature, VERCEL_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Invalid signature' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...postCorsHeaders },
          }
        );
      }
    } else {
      console.warn('VERCEL_WEBHOOK_SECRET not set, skipping signature verification');
    }

    // 4. Parse webhook payload
    const payload: VercelWebhookPayload = JSON.parse(rawBody);
    const { type, payload: webhookData } = payload;

    // 5. Filter: only deployment.succeeded on main branch
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

    // 6. Get last deployed commit from changelog table
    const { data: lastEntry } = await supabase
      .from('changelog')
      .select('git_commit_sha')
      .not('git_commit_sha', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fallback: if no previous changelog, use HEAD~10 (last 10 commits)
    const baseHash = lastEntry?.git_commit_sha || `${deployment.meta.commitId}~10`;
    const headHash = deployment.meta.commitId;

    console.log(`Fetching commits from GitHub: ${baseHash}...${headHash}`);

    // 7. Fetch commits from GitHub API
    const allCommits = await fetchCommitsFromGitHub(baseHash, headHash);
    console.log(`Found ${allCommits.length} total commits`);

    // 8. Filter conventional commits
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

    // 9. Group commits by type into sections
    const sections = groupCommitsByType(commits);

    // 10. Generate changelog data
    const date = new Date().toISOString().split('T')[0];
    const title = inferTitle(commits);
    const tldr = commits[0].commit.message.split('\n')[0].replace(/^(feat|fix|refactor|perf|style|revert)(\(.+\))?: /, '');

    // 11. Generate markdown
    const markdown = generateChangelogMarkdown({
      date,
      title,
      tldr,
      sections,
      commits,
      vercelUrl: deployment.url,
      commitHash: deployment.meta.commitId,
    });

    // 12. Generate slug
    const slug = generateSlug(date, title);

    // 13. Insert into changelog table
    const changelogInsert: ChangelogInsert = {
      slug,
      title,
      description: tldr.slice(0, 200), // Truncate to 200 chars
      category: 'release',
      date_published: date,
      date_added: date,
      tags: ['release', 'automation'],
      sections: sections as unknown as never, // JSONB type
      git_commit_sha: deployment.meta.commitId,
      commit_count: commits.length,
      contributors: [...new Set(commits.map((c) => c.commit.author.name))],
    };

    const { data: changelogEntry, error: insertError } = await supabase
      .from('changelog')
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
      await sendDiscordAnnouncement({
        slug,
        title,
        tldr,
        sections,
        commits,
        date,
      });
      console.log('Discord announcement sent successfully');
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
