/**
 * Process Email Sequences - Supabase Edge Function
 * Database-First Architecture: ALL logic in PostgreSQL, Edge handles rendering + sending
 *
 * TRIGGERED BY: pg_cron hourly (SELECT net.http_post(...))
 * CALLS: get_due_sequence_emails() RPC → Returns JSONB array of due emails
 * SENDS: React email templates via Resend API
 * UPDATES: mark_sequence_email_processed() + schedule_next_sequence_step()
 */

import React from 'npm:react@18.3.1';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

import { OnboardingGettingStarted } from '../_shared/templates/onboarding-getting-started.tsx';
import { OnboardingPowerTips } from '../_shared/templates/onboarding-power-tips.tsx';
import { OnboardingCommunity } from '../_shared/templates/onboarding-community.tsx';
import { OnboardingStayEngaged } from '../_shared/templates/onboarding-stay-engaged.tsx';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BETTERSTACK_HEARTBEAT = Deno.env.get('BETTERSTACK_HEARTBEAT_EMAIL_SEQUENCES');

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface DueEmail {
  id: string;
  email: string;
  step: number;
}

const STEP_SUBJECTS: Record<number, string> = {
  2: 'Getting Started with ClaudePro Directory',
  3: 'Power User Tips for Claude',
  4: 'Join the ClaudePro Community',
  5: 'Stay Engaged with ClaudePro',
};

Deno.serve(async (req) => {
  try {
    console.log('🚀 Starting email sequence processing...');

    // Get due emails from PostgreSQL
    const { data, error } = await supabase.rpc('get_due_sequence_emails');

    if (error) {
      console.error('❌ Failed to get due emails:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dueEmails = (data as DueEmail[]) || [];

    if (dueEmails.length === 0) {
      console.log('✅ No due emails to process');
      return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📧 Processing ${dueEmails.length} due emails...`);

    let sentCount = 0;
    let failedCount = 0;

    // Process each due email
    for (const { id, email, step } of dueEmails) {
      try {
        console.log(`  → Sending step ${step} to ${email}...`);

        const html = await renderEmailForStep(step, email);

        // Send via Resend
        const result = await resend.emails.send({
          from: 'ClaudePro Directory <noreply@claudepro.directory>',
          to: email,
          subject: STEP_SUBJECTS[step],
          html,
          tags: [
            { name: 'template', value: 'onboarding_sequence' },
            { name: 'step', value: step.toString() },
          ],
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        console.log(`    ✓ Sent (ID: ${result.data?.id})`);

        // Mark as processed (success=true)
        await supabase.rpc('mark_sequence_email_processed', {
          p_schedule_id: id,
          p_email: email,
          p_step: step,
          p_success: true,
        });

        // Schedule next step if not complete
        if (step < 5) {
          await supabase.rpc('schedule_next_sequence_step', {
            p_email: email,
            p_current_step: step,
          });
          console.log(`    ✓ Scheduled step ${step + 1}`);
        }

        sentCount++;

        // Rate limit: 100ms delay between emails
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`    ✗ Failed to send to ${email}:`, error);

        // Mark as processed (success=false) to prevent retry loop
        await supabase.rpc('mark_sequence_email_processed', {
          p_schedule_id: id,
          p_email: email,
          p_step: step,
          p_success: false,
        });

        failedCount++;
      }
    }

    console.log(
      `✅ Processing complete: ${sentCount} sent, ${failedCount} failed`
    );

    if (BETTERSTACK_HEARTBEAT) {
      try {
        const heartbeatUrl = failedCount === 0
          ? BETTERSTACK_HEARTBEAT
          : `${BETTERSTACK_HEARTBEAT}/fail`;

        await fetch(heartbeatUrl, {
          method: failedCount === 0 ? 'GET' : 'POST',
          ...(failedCount > 0 && {
            body: `Failed to send ${failedCount}/${dueEmails.length} sequence emails`,
          }),
          signal: AbortSignal.timeout(5000),
        });

        console.log(`💓 BetterStack heartbeat sent (${failedCount === 0 ? 'success' : 'failure'})`);
      } catch (error) {
        console.warn('⚠️  BetterStack heartbeat failed (non-critical):', error);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, failed: failedCount }), {
      headers: { 'Content-Type': 'application/json' },
    });
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
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Render React Email template for specific sequence step
 */
async function renderEmailForStep(step: number, email: string): Promise<string> {
  const componentMap: Record<number, typeof OnboardingGettingStarted> = {
    2: OnboardingGettingStarted,
    3: OnboardingPowerTips,
    4: OnboardingCommunity,
    5: OnboardingStayEngaged,
  };

  const Component = componentMap[step];
  if (!Component) {
    throw new Error(`No template found for step ${step}`);
  }

  return await renderAsync(React.createElement(Component, { email }));
}
