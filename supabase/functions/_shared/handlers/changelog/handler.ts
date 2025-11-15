import {
  buildChangelogMetadata,
  type ChangelogInsert,
  type ChangelogRow,
  deriveChangelogKeywords,
  fetchCommitsFromGitHub,
  filterConventionalCommits,
  generateMarkdownContent,
  generateTldr,
  groupCommitsByType,
  inferTitle,
  revalidateChangelogPages,
  transformSectionsToChanges,
  type VercelWebhookPayload,
} from '../../changelog/service.ts';
import { SITE_URL, supabaseServiceRole } from '../../clients/supabase.ts';
import { edgeEnv } from '../../config/env.ts';
import { insertNotification } from '../../notifications/service.ts';
import { sendDiscordWebhook } from '../../utils/discord/client.ts';
import { buildChangelogEmbed } from '../../utils/discord/embeds.ts';
import {
  badRequestResponse,
  changelogCorsHeaders,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '../../utils/http.ts';
import { verifyVercelSignature } from '../../utils/integrations/vercel.ts';

const VERCEL_WEBHOOK_SECRET = edgeEnv.vercel.webhookSecret;
const DISCORD_CHANGELOG_WEBHOOK_URL = edgeEnv.discord.changelog;

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
    const releaseDate = new Date().toISOString().split('T')[0];
    const slug = `${releaseDate}-${payload.payload.deployment.id.slice(-6)}`;
    const branch = payload.payload.deployment.meta?.branch || 'main';
    const deploymentUrl = payload.payload.deployment.url;
    const contributors = [
      ...new Set(conventionalCommits.map((commit) => commit.commit.author.name)),
    ];
    const metadata = buildChangelogMetadata({
      sections,
      releaseDate,
      deploymentUrl,
      branch,
      commitSha: headCommit,
      commitCount: conventionalCommits.length,
      contributors,
    });
    const keywords = deriveChangelogKeywords(sections, branch);

    const changelogEntry: ChangelogInsert = {
      title,
      slug,
      tldr,
      description: tldr || title,
      content: markdownContent,
      raw_content: markdownContent,
      changes,
      release_date: releaseDate,
      published: true,
      featured: false,
      source: 'automation',
      metadata,
      keywords,
      commit_count: conventionalCommits.length,
      contributors,
      git_commit_sha: headCommit,
      canonical_url: `${SITE_URL}/changelog/${slug}`,
    };

    const { data, error } = await supabaseServiceRole
      .from('changelog')
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

    // Enqueue job for async processing (Discord, notifications, revalidation)
    const queueJob = {
      entryId: data.id,
      slug: data.slug,
      title: data.title,
      tldr,
      sections,
      commits: conventionalCommits,
      releaseDate: data.release_date ?? new Date().toISOString(),
      metadata,
    };

    const { error: queueError } = await supabaseServiceRole.schema('pgmq_public').rpc('send', {
      queue_name: 'changelog_release',
      msg: queueJob,
    });

    if (queueError) {
      // Fallback: Execute side effects synchronously if queue fails
      console.warn('[changelog-sync] Queue enqueue failed, falling back to sync execution', {
        error: queueError.message,
        changelog_id: data.id,
      });

      // Execute side effects synchronously (backward compatibility)
      if (DISCORD_CHANGELOG_WEBHOOK_URL) {
        const embed = buildChangelogEmbed({
          slug: data.slug,
          title: data.title,
          tldr,
          sections,
          commits: conventionalCommits,
          date: data.release_date ?? new Date().toISOString(),
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

      await insertNotification({
        id: data.id,
        title: data.title,
        message: tldr || 'We just shipped a fresh Claude Pro Directory release.',
        type: 'announcement',
        priority: 'high',
        action_label: 'Read release notes',
        action_href: `${SITE_URL}/changelog/${data.slug}`,
        metadata: {
          slug: data.slug,
          changelog_id: data.id,
          source: 'changelog-sync',
        },
      });

      await revalidateChangelogPages(data.slug);

      return successResponse(
        {
          inserted: true,
          changelog_id: data.id,
          sections: sections.length,
          commits: conventionalCommits.length,
          queue_enqueued: false,
          fallback_sync: true,
        },
        200,
        changelogCorsHeaders
      );
    }

    // Queue enqueue succeeded - return immediately (worker will process async)
    console.log('[changelog-sync] Job enqueued successfully', {
      changelog_id: data.id,
      slug: data.slug,
    });

    return successResponse(
      {
        inserted: true,
        changelog_id: data.id,
        sections: sections.length,
        commits: conventionalCommits.length,
        queue_enqueued: true,
      },
      200,
      changelogCorsHeaders
    );
  } catch (error) {
    return errorResponse(error, 'changelog-sync:error', changelogCorsHeaders);
  }
}
