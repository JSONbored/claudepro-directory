/**
 * Send Weekly Digest - Supabase Edge Function
 * Database-First Architecture: PostgreSQL generates digest, Edge Function sends emails
 *
 * TRIGGERED BY: pg_cron Monday 01:00 UTC (via net.http_post)
 * CALLS: get_weekly_digest() RPC → Returns JSONB with content
 * SENDS: Weekly digest email via Resend API (React Email templates)
 * MONITORS: BetterStack heartbeat on success
 */

import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { renderAsync } from 'npm:@react-email/components@0.0.22';

import { WeeklyDigest } from '../_shared/templates/weekly-digest.tsx';
import type { DigestContentItem, DigestTrendingItem } from '../_shared/templates/weekly-digest.tsx';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_AUDIENCE_ID = Deno.env.get('RESEND_AUDIENCE_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const BETTERSTACK_HEARTBEAT = Deno.env.get('BETTERSTACK_HEARTBEAT_WEEKLY_TASKS');

interface DigestData {
  weekOf: string;
  weekStart: string;
  weekEnd: string;
  newContent: DigestContentItem[];
  trendingContent: DigestTrendingItem[];
}

Deno.serve(async (req) => {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Service misconfigured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const resend = new Resend(RESEND_API_KEY);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('📧 Starting weekly digest send...');

    const previousWeekStart = getPreviousWeekStart();
    console.log(`📅 Generating digest for week starting: ${previousWeekStart}`);

    const { data: digest, error: digestError } = await supabase.rpc('get_weekly_digest', {
      p_week_start: previousWeekStart,
    });

    if (digestError) {
      console.error('❌ Failed to get digest:', digestError);
      return new Response(
        JSON.stringify({ error: `Digest generation failed: ${digestError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const digestData = digest as DigestData;

    if (!digestData.newContent?.length && !digestData.trendingContent?.length) {
      console.log('⏭️  No content available - skipping digest send');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_content', weekOf: digestData.weekOf }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(
      `📊 Digest ready: ${digestData.newContent.length} new, ${digestData.trendingContent.length} trending`
    );

    const subscribers = await getAllSubscribers(resend, RESEND_AUDIENCE_ID);

    if (subscribers.length === 0) {
      console.log('⏭️  No subscribers found - skipping digest send');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_subscribers', weekOf: digestData.weekOf }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📤 Sending digest to ${subscribers.length} subscribers...`);

    const results = await sendBatchDigest(resend, subscribers, digestData);

    console.log(
      `✅ Digest send complete: ${results.success} sent, ${results.failed} failed (${results.successRate})`
    );

    if (BETTERSTACK_HEARTBEAT) {
      try {
        const heartbeatUrl = results.failed === 0
          ? BETTERSTACK_HEARTBEAT
          : `${BETTERSTACK_HEARTBEAT}/fail`;

        await fetch(heartbeatUrl, {
          method: results.failed === 0 ? 'GET' : 'POST',
          ...(results.failed > 0 && {
            body: `Failed to send ${results.failed}/${subscribers.length} emails\nErrors: ${results.errors.slice(0, 5).join('\n')}`,
          }),
          signal: AbortSignal.timeout(5000),
        });

        console.log(`💓 BetterStack heartbeat sent (${results.failed === 0 ? 'success' : 'failure'})`);
      } catch (error) {
        console.warn('⚠️  BetterStack heartbeat failed (non-critical):', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: results.failed === 0,
        sent: results.success,
        failed: results.failed,
        total: subscribers.length,
        successRate: results.successRate,
        weekOf: digestData.weekOf,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);

    if (BETTERSTACK_HEARTBEAT) {
      try {
        await fetch(`${BETTERSTACK_HEARTBEAT}/fail`, {
          method: 'POST',
          body: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          signal: AbortSignal.timeout(5000),
        });
      } catch (heartbeatError) {
        console.warn('⚠️  BetterStack heartbeat failed (non-critical):', heartbeatError);
      }
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function getPreviousWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const currentWeekMonday = new Date(now);
  currentWeekMonday.setDate(now.getDate() - daysToMonday);
  currentWeekMonday.setHours(0, 0, 0, 0);
  const previousWeekMonday = new Date(currentWeekMonday);
  previousWeekMonday.setDate(currentWeekMonday.getDate() - 7);
  return previousWeekMonday.toISOString().split('T')[0];
}

async function getAllSubscribers(resend: Resend, audienceId: string): Promise<string[]> {
  const subscribers: string[] = [];
  let cursor: string | null = null;

  do {
    const response = await resend.contacts.list({
      audienceId,
      ...(cursor && { cursor }),
    });

    if (response.error) {
      throw new Error(`Failed to fetch subscribers: ${response.error.message}`);
    }

    if (response.data?.data) {
      const emails = response.data.data
        .filter((contact) => !contact.unsubscribed)
        .map((contact) => contact.email);
      subscribers.push(...emails);
    }

    cursor = response.data?.next_cursor || null;
  } while (cursor);

  return subscribers;
}

async function sendBatchDigest(
  resend: Resend,
  subscribers: string[],
  digest: DigestData
): Promise<{ success: number; failed: number; successRate: string; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  const subject = `This Week in Claude - ${digest.weekOf}`;

  for (const email of subscribers) {
    try {
      const html = await renderAsync(
        React.createElement(WeeklyDigest, {
          email,
          weekOf: digest.weekOf,
          newContent: digest.newContent,
          trendingContent: digest.trendingContent,
        })
      );

      const result = await resend.emails.send({
        from: 'ClaudePro Directory <hello@mail.claudepro.directory>',
        to: email,
        subject,
        html,
        tags: [
          { name: 'template', value: 'weekly_digest' },
          { name: 'week', value: digest.weekOf },
        ],
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      success++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`${email}: ${errorMsg}`);
      console.error(`  ✗ Failed to send to ${email}:`, errorMsg);
    }
  }

  const successRate = `${((success / subscribers.length) * 100).toFixed(1)}%`;
  return { success, failed, successRate, errors };
}
