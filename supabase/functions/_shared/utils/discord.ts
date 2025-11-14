/**
 * Discord webhook utilities - unified outbound webhook handling with webhook_events logging
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../database.types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';

// Singleton Supabase client
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration constants
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Create webhook_events log entry for outbound Discord webhooks
 * Returns event ID for subsequent updates
 */
export async function logOutboundWebhookEvent(
  type: string,
  data: unknown,
  relatedId?: string
): Promise<string | null> {
  const { data: logData, error: logError } = await supabase
    .from('webhook_events')
    .insert({
      source: 'discord',
      direction: 'outbound',
      type,
      data: data as Database['public']['Tables']['webhook_events']['Insert']['data'],
      created_at: new Date().toISOString(),
      processed: false,
      related_id: relatedId || null,
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Failed to log webhook event:', logError);
    return null;
  }

  return logData.id;
}

/**
 * Update webhook_events entry with success/failure status
 */
export async function updateWebhookEventStatus(
  webhookEventId: string,
  success: boolean,
  httpStatus?: number,
  error?: string,
  responsePayload?: unknown,
  retryCount?: number
): Promise<void> {
  await supabase
    .from('webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      http_status_code: httpStatus,
      error: error || null,
      response_payload:
        responsePayload as Database['public']['Tables']['webhook_events']['Update']['response_payload'],
      retry_count: retryCount,
      success,
    })
    .eq('id', webhookEventId);
}

// Category color mapping (Discord embed colors)
export const CATEGORY_COLORS: Record<string, number> = {
  agents: 0x5865f2, // Blurple
  mcp: 0x57f287, // Green
  commands: 0xfee75c, // Yellow
  hooks: 0xeb459e, // Pink
  rules: 0xed4245, // Red
  statuslines: 0xf26522, // Orange
  skills: 0x3ba55d, // Dark Green
  collections: 0x7289da, // Light Blurple
  guides: 0x99aab5, // Gray
};

// Category emoji mapping
const CATEGORY_EMOJIS: Record<string, string> = {
  agents: '🤖',
  mcp: '🔌',
  commands: '⚡',
  hooks: '🪝',
  rules: '📜',
  statuslines: '📊',
  skills: '🛠️',
  collections: '📚',
  guides: '📖',
};

type ContentRow = Database['public']['Tables']['content']['Row'];
type SubmissionRow = Database['public']['Tables']['content_submissions']['Row'];

interface WebhookEventRecord {
  id: string;
  type: string;
  created_at: string;
  error: string | null;
}

/**
 * Send Discord webhook with exponential backoff retry and webhook_events logging
 * Logs all outbound Discord webhooks to webhook_events table with direction='outbound'
 */
export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: unknown,
  webhookType: string,
  relatedId?: string
): Promise<{ status: number; retryCount: number }> {
  let lastError: Error | null = null;
  let webhookEventId: string | null = null;

  // Create initial webhook_events log entry
  const { data: logData, error: logError } = await supabase
    .from('webhook_events')
    .insert({
      source: 'discord',
      direction: 'outbound',
      type: webhookType,
      data: payload as Database['public']['Tables']['webhook_events']['Insert']['data'],
      created_at: new Date().toISOString(),
      processed: false,
      related_id: relatedId || null,
    })
    .select('id')
    .single();

  if (!logError && logData) {
    webhookEventId = logData.id;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Update webhook_events with success
        if (webhookEventId) {
          await supabase
            .from('webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              http_status_code: response.status,
              response_payload: { success: true },
              retry_count: attempt,
            })
            .eq('id', webhookEventId);
        }

        console.log(`Discord webhook sent successfully (attempt ${attempt + 1})`);
        return { status: response.status, retryCount: attempt };
      }

      const errorText = await response.text();
      lastError = new Error(`Discord API returned ${response.status}: ${errorText}`);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on non-retryable errors
      if (lastError.message.includes('4')) {
        throw lastError;
      }
    }

    // Exponential backoff before retry
    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Update webhook_events with failure
  if (webhookEventId) {
    await supabase
      .from('webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        error: lastError?.message || 'Max retries exceeded',
        retry_count: MAX_RETRIES,
      })
      .eq('id', webhookEventId);
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Update existing Discord message with PATCH
 * Includes webhook_events logging and 404 recovery
 * Returns { deleted: true } if message was deleted (404), allowing caller to recreate
 */
export async function updateDiscordMessage(
  webhookUrl: string,
  messageId: string,
  payload: unknown,
  webhookType: string,
  relatedId?: string,
  metadata?: Record<string, unknown>
): Promise<{ status: number; deleted: boolean; retryCount: number }> {
  let lastError: Error | null = null;

  // Log webhook event BEFORE Discord API call
  // Use metadata if provided (action, job_id, status), otherwise fall back to payload spread
  const logData = metadata
    ? { ...metadata, discord_message_id: messageId }
    : { ...payload, discord_message_id: messageId };

  const webhookEventId = await logOutboundWebhookEvent(`${webhookType}_update`, logData, relatedId);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${webhookUrl}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Handle 404 - message was deleted
      if (response.status === 404) {
        console.log('Discord message deleted (404) - caller should recreate');
        if (webhookEventId) {
          await updateWebhookEventStatus(
            webhookEventId,
            false,
            404,
            'Discord message not found (deleted)',
            null,
            attempt
          );
        }
        return { status: 404, deleted: true, retryCount: attempt };
      }

      if (response.ok) {
        if (webhookEventId) {
          await updateWebhookEventStatus(
            webhookEventId,
            true,
            response.status,
            undefined,
            { success: true },
            attempt
          );
        }
        console.log(`Discord message updated successfully (attempt ${attempt + 1})`);
        return { status: response.status, deleted: false, retryCount: attempt };
      }

      const errorText = await response.text();
      lastError = new Error(`Discord API returned ${response.status}: ${errorText}`);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on non-retryable errors
      if (lastError.message.includes('4')) {
        throw lastError;
      }
    }

    // Exponential backoff before retry
    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Update webhook_events with failure
  if (webhookEventId) {
    await updateWebhookEventStatus(
      webhookEventId,
      false,
      undefined,
      lastError?.message || 'Max retries exceeded',
      null,
      MAX_RETRIES
    );
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Build Discord embed for published content announcement
 */
export function buildContentEmbed(content: ContentRow) {
  const {
    category,
    slug,
    title,
    display_title,
    description,
    author,
    author_profile_url,
    tags,
    date_added,
  } = content;

  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.agents;
  const contentUrl = `${SITE_URL}/${category}/${slug}`;
  const contentTitle = display_title || title;
  const authorField = author_profile_url ? `[${author}](${author_profile_url})` : author;
  const tagsField = tags && tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' ') : 'None';
  const dateField = new Date(date_added).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const truncatedDescription =
    description.length > 200 ? `${description.slice(0, 200)}...` : description;

  return {
    title: `${CATEGORY_EMOJIS[category] || '📄'} ${contentTitle}`,
    description: truncatedDescription,
    color,
    url: contentUrl,
    fields: [
      {
        name: '✨ Type',
        value: `\`${category}\``,
        inline: true,
      },
      {
        name: '👤 Author',
        value: authorField,
        inline: true,
      },
      {
        name: '🏷️ Tags',
        value: tagsField,
        inline: false,
      },
      {
        name: '🔗 Try it now',
        value: `[View on Claude Pro Directory](${contentUrl})`,
        inline: false,
      },
    ],
    footer: {
      text: `Added on ${dateField} • Claude Pro Directory`,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build Discord embed for content submission notification
 */
export function buildSubmissionEmbed(submission: SubmissionRow) {
  const {
    id,
    name,
    description,
    category,
    submission_type,
    author,
    author_profile_url,
    github_url,
    tags,
    submitter_email,
    created_at,
  } = submission;

  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.agents;

  // Extract project ID from SUPABASE_URL
  const SUPABASE_PROJECT_ID =
    SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';

  const dashboardUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor/${encodeURIComponent(
    'content_submissions'
  )}?filter=id%3Aeq%3A${id}`;

  const authorField = author_profile_url ? `[${author}](${author_profile_url})` : author;

  const fields = [
    {
      name: '📝 Type',
      value: `\`${submission_type}\``,
      inline: true,
    },
    {
      name: '📂 Category',
      value: `\`${category}\``,
      inline: true,
    },
    {
      name: '👤 Author',
      value: authorField,
      inline: true,
    },
  ];

  if (github_url) {
    fields.push({
      name: '🔗 GitHub',
      value: `[View Repository](${github_url})`,
      inline: false,
    });
  }

  if (tags && tags.length > 0) {
    fields.push({
      name: '🏷️ Tags',
      value: tags.map((tag) => `\`${tag}\``).join(', '),
      inline: false,
    });
  }

  if (submitter_email) {
    fields.push({
      name: '📧 Submitted by',
      value: submitter_email,
      inline: false,
    });
  }

  fields.push({
    name: '⚙️ Actions',
    value: `[Review in Supabase Dashboard](${dashboardUrl})`,
    inline: false,
  });

  return {
    title: `${CATEGORY_EMOJIS[category] || '📄'} ${name}`,
    description: description.slice(0, 300) + (description.length > 300 ? '...' : ''),
    color,
    fields,
    footer: {
      text: `Submission ID: ${id.slice(0, 8)}`,
    },
    timestamp: new Date(created_at).toISOString(),
  };
}

/**
 * Build Discord embed for error notifications
 */
export function buildErrorEmbed(event: WebhookEventRecord) {
  return {
    title: '🚨 Edge Function Error',
    description: event.error || 'Unknown error',
    color: 15158332, // Red
    fields: [
      {
        name: '🔧 Event Type',
        value: `\`${event.type}\``,
        inline: true,
      },
      {
        name: '📅 Timestamp',
        value: new Date(event.created_at).toLocaleString('en-US', {
          timeZone: 'UTC',
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        inline: true,
      },
      {
        name: '🆔 Event ID',
        value: `\`${event.id}\``,
        inline: false,
      },
    ],
    footer: {
      text: 'ClaudePro Directory - Edge Function Monitoring',
    },
    timestamp: event.created_at,
  };
}

/**
 * Types for changelog embed builder
 */
export interface GitHubCommit {
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

export interface ChangelogSection {
  title: string;
  items: string[];
}

/**
 * Build Discord embed for changelog release announcement
 */
export function buildChangelogEmbed(params: {
  slug: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: GitHubCommit[];
  date: string;
}) {
  const { slug, title, tldr, sections, commits, date } = params;

  const contributors = [...new Set(commits.map((c) => c.commit.author.name))];

  // Count items by section
  const addedCount = sections.find((s) => s.title === 'Added')?.items.length || 0;
  const changedCount = sections.find((s) => s.title === 'Changed')?.items.length || 0;
  const fixedCount = sections.find((s) => s.title === 'Fixed')?.items.length || 0;

  // Build engaging description with highlights
  const highlights = [];
  if (addedCount > 0)
    highlights.push(`✨ **${addedCount}** new feature${addedCount === 1 ? '' : 's'}`);
  if (changedCount > 0)
    highlights.push(`🔧 **${changedCount}** improvement${changedCount === 1 ? '' : 's'}`);
  if (fixedCount > 0)
    highlights.push(`🐛 **${fixedCount}** bug fix${fixedCount === 1 ? '' : 'es'}`);

  const description = highlights.join(' • ');

  // Build fields with actual changelog content
  const fields = [];

  // TL;DR section
  if (tldr && tldr.length > 0) {
    fields.push({
      name: '📝 TL;DR',
      value: tldr.slice(0, 300) + (tldr.length > 300 ? '...' : ''),
      inline: false,
    });
  }

  // Added section
  const addedSection = sections.find((s) => s.title === 'Added');
  if (addedSection && addedSection.items.length > 0) {
    const items = addedSection.items.slice(0, 5); // Max 5 items
    const value = items
      .map((item) => `• ${item.slice(0, 80)}${item.length > 80 ? '...' : ''}`)
      .join('\n');
    fields.push({
      name: "✨ What's New",
      value:
        value +
        (addedSection.items.length > 5 ? `\n*...and ${addedSection.items.length - 5} more*` : ''),
      inline: false,
    });
  }

  // Changed section
  const changedSection = sections.find((s) => s.title === 'Changed');
  if (changedSection && changedSection.items.length > 0) {
    const items = changedSection.items.slice(0, 5);
    const value = items
      .map((item) => `• ${item.slice(0, 80)}${item.length > 80 ? '...' : ''}`)
      .join('\n');
    fields.push({
      name: '🔧 Improvements',
      value:
        value +
        (changedSection.items.length > 5
          ? `\n*...and ${changedSection.items.length - 5} more*`
          : ''),
      inline: false,
    });
  }

  // Fixed section
  const fixedSection = sections.find((s) => s.title === 'Fixed');
  if (fixedSection && fixedSection.items.length > 0) {
    const items = fixedSection.items.slice(0, 5);
    const value = items
      .map((item) => `• ${item.slice(0, 80)}${item.length > 80 ? '...' : ''}`)
      .join('\n');
    fields.push({
      name: '🐛 Bug Fixes',
      value:
        value +
        (fixedSection.items.length > 5 ? `\n*...and ${fixedSection.items.length - 5} more*` : ''),
      inline: false,
    });
  }

  // Stats footer field - safely handle case with no commits
  if (commits.length > 0) {
    const latestCommit = commits[commits.length - 1];
    // Get GITHUB_REPO_OWNER and GITHUB_REPO_NAME from environment
    const GITHUB_REPO_OWNER = Deno.env.get('GITHUB_REPO_OWNER') || 'unknown';
    const GITHUB_REPO_NAME = Deno.env.get('GITHUB_REPO_NAME') || 'unknown';
    const commitUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commit/${latestCommit.sha}`;
    const shortSha = latestCommit.sha.slice(0, 7);

    fields.push({
      name: '📊 Release Stats',
      value: `${commits.length} commit${commits.length === 1 ? '' : 's'} • ${contributors.length} contributor${contributors.length === 1 ? '' : 's'}\n[View commit \`${shortSha}\` on GitHub](${commitUrl})`,
      inline: false,
    });
  }

  return {
    title: `📋 ${title}`,
    description,
    color: 0x3ba55d, // Green for releases
    url: `${SITE_URL}/changelog/${slug}`,
    fields,
    footer: {
      text: `Claude Pro Directory • Released ${date}`,
      icon_url: 'https://claudepro.directory/favicon.ico',
    },
    timestamp: new Date().toISOString(),
  };
}
