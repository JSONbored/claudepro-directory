/**
 * Discord Error Relay - Supabase Edge Function
 * Database-First Architecture: Triggered by database webhook on webhook_events table
 *
 * Features:
 * - Filters errors (only sends when error IS NOT NULL)
 * - Beautiful Discord embeds with error details
 * - Idempotent (skips already-processed errors)
 * - Secure (Discord webhook URL from environment variable)
 *
 * Environment Variables:
 *   DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK - Discord error channel webhook URL
 *
 * Triggered by:
 *   Database webhook on webhook_events table (INSERT/UPDATE events)
 *
 * Payload format:
 *   { type: "INSERT" | "UPDATE", table: "webhook_events", record: {...}, old_record: {...}, schema: "public" }
 */

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: {
    id: string;
    type: string;
    created_at: string;
    data: Record<string, unknown>;
    processed: boolean;
    processed_at: string | null;
    error: string | null;
    retry_count: number;
    next_retry_at: string | null;
    received_at: string;
    svix_id: string | null;
  };
  old_record: Record<string, unknown> | null;
  schema: string;
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

  try {
    // Validate Discord webhook URL is configured
    const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK');
    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_EDGE_FUNCTION_ERRORS_WEBHOOK environment variable not set');
      return new Response('Discord webhook not configured', { status: 500 });
    }

    // Parse webhook payload from Supabase
    const payload: WebhookPayload = await req.json();
    const { type, record } = payload;

    // Only process INSERT and UPDATE events
    if (type !== 'INSERT' && type !== 'UPDATE') {
      console.log(`Skipping ${type} event`);
      return new Response(
        JSON.stringify({ skipped: true, reason: 'Not an INSERT/UPDATE event' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Skip if no error (only send notifications when error exists)
    if (!record.error) {
      console.log('Skipping - no error present');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'No error present' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Discord embed
    const embed = {
      title: '🚨 Edge Function Error',
      description: record.error,
      color: 15158332, // Red
      fields: [
        {
          name: '🔧 Event Type',
          value: `\`${record.type}\``,
          inline: true,
        },
        {
          name: '📅 Timestamp',
          value: new Date(record.created_at).toLocaleString('en-US', {
            timeZone: 'UTC',
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          inline: true,
        },
        {
          name: '🔄 Retry Count',
          value: record.retry_count.toString(),
          inline: true,
        },
        {
          name: '✅ Processed',
          value: record.processed ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: '🆔 Event ID',
          value: `\`${record.id}\``,
          inline: false,
        },
      ],
      footer: {
        text: 'ClaudePro Directory - Edge Function Monitoring',
      },
      timestamp: record.created_at,
    };

    // Add Svix ID if present (for Resend webhooks)
    if (record.svix_id) {
      embed.fields.push({
        name: '📬 Svix ID',
        value: `\`${record.svix_id}\``,
        inline: false,
      });
    }

    // Send to Discord
    const discordPayload = {
      embeds: [embed],
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord API returned ${response.status}: ${errorText}`);
    }

    console.log(`Discord error notification sent for event: ${record.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        event_id: record.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Discord error relay error:', error);

    // Return 200 to prevent Supabase webhook retries (notification failures shouldn't block processing)
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
