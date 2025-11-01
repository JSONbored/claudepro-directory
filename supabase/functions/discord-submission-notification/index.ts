/**
 * Discord Submission Notification - Supabase Edge Function
 * Database-First Architecture: Triggered by database webhook on content_submissions INSERT
 *
 * Features:
 * - Beautiful Discord embeds with rich formatting
 * - Spam filtering (skip notifications for high spam scores)
 * - Category-based color coding
 * - Direct links to Supabase dashboard for moderation
 * - Retry logic with exponential backoff (max 3 retries)
 * - Webhook delivery logging to webhook_logs table
 *
 * Environment Variables:
 *   DISCORD_WEBHOOK_URL         - Discord webhook URL from channel settings
 *   SUPABASE_PROJECT_ID         - Project ID for dashboard links
 *   NEXT_PUBLIC_SUPABASE_URL    - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   - Service role key for logging
 *
 * Triggered by:
 *   Database webhook on content_submissions table (INSERT events)
 *
 * Payload format:
 *   { type: "INSERT", table: "content_submissions", record: {...}, schema: "public" }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';

type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];
type WebhookLogInsert = Database['public']['Tables']['webhook_logs']['Insert'];
type WebhookLogUpdate = Database['public']['Tables']['webhook_logs']['Update'];

// Environment variables
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const SUPABASE_PROJECT_ID = Deno.env.get('SUPABASE_PROJECT_ID') || 'hxeckduifagerhxsktev';
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Configuration constants
const SPAM_THRESHOLD = 0.7;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

// Category color mapping (Discord embed colors)
const CATEGORY_COLORS: Record<string, number> = {
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

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: ContentSubmission;
  schema: string;
  old_record: ContentSubmission | null;
}

/**
 * Send Discord webhook with exponential backoff retry
 */
async function sendWithRetry(
  url: string,
  payload: unknown,
  maxRetries: number
): Promise<{ status: number; retryCount: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
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
    if (attempt < maxRetries) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Initialize Supabase client for logging (uses generated types)
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let logId: string | null = null;

  try {
    // Validate webhook URL is configured
    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL environment variable not set');
      return new Response('Discord webhook not configured', { status: 500 });
    }

    // Parse webhook payload from Supabase
    const payload: WebhookPayload = await req.json();
    const { type, record } = payload;

    // Only process INSERT events
    if (type !== 'INSERT') {
      console.log(`Skipping ${type} event`);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Not an INSERT event' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Skip spam submissions (don't notify)
    if (record.spam_score !== null && record.spam_score > SPAM_THRESHOLD) {
      console.log(`Skipping spam submission (score: ${record.spam_score})`);
      return new Response(JSON.stringify({ skipped: true, reason: 'Spam detected' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create initial log entry (using generated Insert type)
    const logInsert: WebhookLogInsert = {
      submission_id: record.id,
      webhook_type: 'discord_notification',
      status: 'pending',
      request_payload: { record },
    };

    const { data: logData } = await supabase
      .from('webhook_logs')
      .insert(logInsert)
      .select('id')
      .single();

    logId = logData?.id || null;

    // Build Discord embed
    const embed = buildDiscordEmbed(record);
    const discordPayload = {
      content: '🆕 **New Content Submission**',
      embeds: [embed],
    };

    // Send to Discord with retry logic
    const result = await sendWithRetry(DISCORD_WEBHOOK_URL, discordPayload, MAX_RETRIES);

    // Update log with success (using generated Update type)
    if (logId) {
      const logUpdate: WebhookLogUpdate = {
        status: 'success',
        http_status_code: result.status,
        response_payload: { success: true },
        retry_count: result.retryCount,
        completed_at: new Date().toISOString(),
      };

      await supabase.from('webhook_logs').update(logUpdate).eq('id', logId);
    }

    console.log(
      `Discord notification sent for submission: ${record.id} (retries: ${result.retryCount})`
    );
    return new Response(
      JSON.stringify({
        success: true,
        submission_id: record.id,
        retries: result.retryCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Discord notification error:', error);

    // Update log with failure (using generated Update type)
    if (logId) {
      const logUpdate: WebhookLogUpdate = {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      };

      await supabase.from('webhook_logs').update(logUpdate).eq('id', logId);
    }

    // Return 200 to prevent Supabase webhook retries (notification failures shouldn't block submissions)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Build rich Discord embed for content submission
 */
function buildDiscordEmbed(submission: ContentSubmission) {
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

  // Get category color (fallback to blurple)
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.agents;

  // Build dashboard URL for moderation
  const dashboardUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor/${encodeURIComponent('content_submissions')}?filter=id%3Aeq%3A${id}`;

  // Format author field (with profile link if available)
  const authorField = author_profile_url ? `[${author}](${author_profile_url})` : author;

  // Build fields array
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

  // Add GitHub URL if provided
  if (github_url) {
    fields.push({
      name: '🔗 GitHub',
      value: `[View Repository](${github_url})`,
      inline: false,
    });
  }

  // Add tags if provided
  if (tags && tags.length > 0) {
    fields.push({
      name: '🏷️ Tags',
      value: tags.map((tag) => `\`${tag}\``).join(', '),
      inline: false,
    });
  }

  // Add submitter email
  if (submitter_email) {
    fields.push({
      name: '📧 Submitted by',
      value: submitter_email,
      inline: false,
    });
  }

  // Add moderation link
  fields.push({
    name: '⚙️ Actions',
    value: `[Review in Supabase Dashboard](${dashboardUrl})`,
    inline: false,
  });

  return {
    title: `${getCategoryEmoji(category)} ${name}`,
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
 * Get emoji for category
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
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
  return emojiMap[category] || '📄';
}
