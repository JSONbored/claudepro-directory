import {
  type ChangelogInsert,
  type ChangelogRow,
  fetchCommitsFromGitHub,
  filterConventionalCommits,
  generateMarkdownContent,
  generateTldr,
  groupCommitsByType,
  inferTitle,
  revalidateChangelogPages,
  transformSectionsToChanges,
  type VercelWebhookPayload,
} from '../utils/changelog.ts';
import { buildChangelogEmbed, sendDiscordWebhook } from '../utils/discord.ts';
import {
  badRequestResponse,
  changelogCorsHeaders,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '../utils/response.ts';
import { supabaseServiceRole } from '../utils/supabase-service-role.ts';
import { verifyVercelSignature } from '../utils/vercel.ts';

const VERCEL_WEBHOOK_SECRET = Deno.env.get('VERCEL_WEBHOOK_SECRET');
const DISCORD_CHANGELOG_WEBHOOK_URL = Deno.env.get('DISCORD_CHANGELOG_WEBHOOK_URL');

export async function handleChangelogSyncRequest(req: Request): Promise<Response> {
  try {
    const body = await req.text();
    const payload = JSON.parse(body) as VercelWebhookPayload;

    const signature = req.headers.get('x-vercel-signature');
    if (!(signature && VERCEL_WEBHOOK_SECRET)) {
      return unauthorizedResponse('Missing Vercel signature', changelogCorsHeaders);
    }

    const verified = await verifyVercelSignature(body, signature, VERCEL_WEBHOOK_SECRET);
    if (!verified) {
      return unauthorizedResponse('Invalid Vercel signature', changelogCorsHeaders);
    }

    if (payload.type !== 'deployment.succeeded') {
      return successResponse(
        { skipped: true, reason: `Unsupported webhook type: ${payload.type}` },
        200,
        changelogCorsHeaders
      );
    }

    const baseCommit = payload.payload.deployment.meta?.previousCommitId;
    const headCommit = payload.payload.deployment.meta?.commitId;

    if (!(baseCommit && headCommit)) {
      return badRequestResponse(
        'Missing commit metadata in deployment payload',
        changelogCorsHeaders
      );
    }

    const commits = await fetchCommitsFromGitHub(baseCommit, headCommit);
    const conventionalCommits = filterConventionalCommits(commits);

    if (conventionalCommits.length === 0) {
      return successResponse(
        { skipped: true, reason: 'No conventional commits found in deployment range' },
        200,
        changelogCorsHeaders
      );
    }

    const sections = groupCommitsByType(conventionalCommits);
    const markdownContent = generateMarkdownContent(sections);
    const title = inferTitle(conventionalCommits);
    const tldr = generateTldr(conventionalCommits);
    const changes = transformSectionsToChanges(sections);

    const changelogEntry: ChangelogInsert = {
      title,
      summary: tldr,
      content: markdownContent,
      changes,
      published_at: new Date().toISOString(),
      release_tag: payload.payload.deployment.meta?.commitId || '',
      vercel_deployment_url: payload.payload.deployment.url,
      branch: payload.payload.deployment.meta?.branch || 'main',
      commit_hash: headCommit,
      slug: `${new Date().toISOString().split('T')[0]}-${payload.payload.deployment.id.slice(-6)}`,
      author: 'Automated Release',
      automated: true,
      deployment_id: payload.payload.deployment.id,
    };

    const { data, error } = await supabaseServiceRole
      .from('changelog_entries')
      .insert(changelogEntry)
      .select('*')
      .single<ChangelogRow>();

    if (error) {
      return errorResponse(error, 'changelog-sync:insert', changelogCorsHeaders);
    }
    if (!data) {
      return errorResponse(
        new Error('Failed to insert changelog entry'),
        'changelog-sync:insert-empty',
        changelogCorsHeaders
      );
    }

    if (DISCORD_CHANGELOG_WEBHOOK_URL) {
      const embed = buildChangelogEmbed({
        slug: data.slug,
        title: data.title,
        tldr,
        sections,
        commits: conventionalCommits,
        date: data.published_at ?? new Date().toISOString(),
      });

      await sendDiscordWebhook(
        DISCORD_CHANGELOG_WEBHOOK_URL,
        {
          content: '🚀 **New Release Deployed**',
          embeds: [embed],
        },
        'changelog_notification',
        {
          relatedId: data.id,
          metadata: {
            changelog_id: data.id,
            slug: data.slug,
          },
        }
      );
    }

    await revalidateChangelogPages(data.slug);

    return successResponse(
      {
        inserted: true,
        changelog_id: data.id,
        sections: sections.length,
        commits: conventionalCommits.length,
      },
      200,
      changelogCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'changelog-sync:error', changelogCorsHeaders);
  }
}
