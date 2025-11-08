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
