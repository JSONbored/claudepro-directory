/**
 * Discord Content Announcement - Supabase Edge Function
 * Database-First Architecture: Triggered by database webhook on content_submissions UPDATE (status → 'merged')
 *
 * Features:
 * - User-facing announcements for newly published content
 * - Beautiful Discord embeds with clean, modern formatting
 * - Category-based color coding with emojis
 * - Direct links to live content pages
 * - Retry logic with exponential backoff (max 3 retries)
 * - Webhook delivery logging to webhook_logs table
 *
 * Environment Variables:
 *   DISCORD_ANNOUNCEMENTS_WEBHOOK_URL - Discord announcements channel webhook URL
 *   NEXT_PUBLIC_SITE_URL               - Site URL for content links
 *   NEXT_PUBLIC_SUPABASE_URL           - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY          - Service role key for logging
 *
 * Triggered by:
 *   Database webhook on content_submissions table (UPDATE events where status changes to 'merged')
 *
 * Payload format:
 *   { type: "UPDATE", table: "content_submissions", record: {...}, old_record: {...}, schema: "public" }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../_shared/database.types.ts';

type ContentSubmission = Database['public']['Tables']['content_submissions']['Row'];
type Content = Database['public']['Tables']['content']['Row'];
type WebhookLogInsert = Database['public']['Tables']['webhook_logs']['Insert'];
type WebhookLogUpdate = Database['public']['Tables']['webhook_logs']['Update'];

// Environment variables
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL');
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Singleton Supabase client - reused across all requests for optimal performance
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration constants
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
  old_record: ContentSubmission | null;
  schema: string;
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

  let logId: string | null = null;

  try {
    // Validate webhook URL is configured
    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_ANNOUNCEMENTS_WEBHOOK_URL environment variable not set');
      return new Response('Discord webhook not configured', { status: 500 });
    }

    // Parse webhook payload from Supabase
    const payload: WebhookPayload = await req.json();
    const { type, record, old_record } = payload;

    // Only process UPDATE events where status changed to 'merged'
    if (type !== 'UPDATE') {
      console.log(`Skipping ${type} event`);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Not an UPDATE event' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Skip if status didn't change to 'merged'
    if (old_record?.status === 'merged' || record.status !== 'merged') {
      console.log(
        `Skipping - status not changed to merged (old: ${old_record?.status}, new: ${record.status})`
      );
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Status not changed to merged' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Query content table for full published content details
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select(
        'id, category, slug, title, display_title, description, author, author_profile_url, tags, date_added'
      )
      .eq('category', record.category)
      .eq('slug', record.auto_slug!)
      .single();

    if (contentError || !content) {
      console.error('Failed to fetch content:', contentError);
      throw new Error(`Content not found for slug: ${record.auto_slug}`);
    }

    // Create initial log entry (using generated Insert type)
    const logInsert: WebhookLogInsert = {
      submission_id: record.id,
      webhook_type: 'discord_announcement',
      status: 'pending',
      request_payload: { record, content },
    };

    const { data: logData } = await supabase
      .from('webhook_logs')
      .insert(logInsert)
      .select('id')
      .single();

    logId = logData?.id || null;

    // Build user-facing Discord embed
    const embed = buildAnnouncementEmbed(content);
    const discordPayload = {
      content: '🎉 **New Content Added to Claude Pro Directory!**',
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
      `Discord announcement sent for content: ${content.id} (retries: ${result.retryCount})`
    );
    return new Response(
      JSON.stringify({
        success: true,
        content_id: content.id,
        retries: result.retryCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Discord announcement error:', error);

    // Update log with failure (using generated Update type)
    if (logId) {
      const logUpdate: WebhookLogUpdate = {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      };

      await supabase.from('webhook_logs').update(logUpdate).eq('id', logId);
    }

    // Return 200 to prevent Supabase webhook retries (notification failures shouldn't block merges)
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
 * Build beautiful user-facing Discord embed for published content
 */
function buildAnnouncementEmbed(content: Content) {
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

  // Get category color (fallback to blurple)
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.agents;

  // Build content URL
  const contentUrl = `${SITE_URL}/${category}/${slug}`;

  // Use display_title if available, otherwise title
  const contentTitle = display_title || title;

  // Format author field (with profile link if available)
  const authorField = author_profile_url ? `[${author}](${author_profile_url})` : author;

  // Format tags with hashtags
  const tagsField = tags && tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' ') : 'None';

  // Format date
  const dateField = new Date(date_added).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Truncate description to 200 characters
  const truncatedDescription =
    description.length > 200 ? description.slice(0, 200) + '...' : description;

  return {
    title: `${getCategoryEmoji(category)} ${contentTitle}`,
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
