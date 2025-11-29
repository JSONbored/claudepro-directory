import  { type Database } from '@heyclaude/database-types';

import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';
import { createServiceRoleClient } from '../toolkit/supabase.js';

type WebhookEventRow = Database['public']['Tables']['webhook_events']['Row'];

interface Options {
  id?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg?.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const next = args[i + 1];
    const value = next && !next.startsWith('--') ? next : undefined;

    if (key === 'id' && value) {
      options.id = value;
      i += 1;
    } else {
      logger.warn(`Ignoring unknown flag "${arg}"`, { script: 'webhooks:replay' });
    }
  }

  return options;
}

export async function runReplayWebhook(): Promise<void> {
  const options = parseArgs();

  if (!options.id) {
    logger.error('Missing required flag "--id <uuid>"', undefined, { script: 'webhooks:replay' });
    process.exit(1);
  }

  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);
  const supabase = createServiceRoleClient();

  const { data, error } = await (
    supabase as unknown as {
      rpc: <T = WebhookEventRow>(
        fn: string,
        params: Record<string, unknown>
      ) => Promise<{
        data: null | T;
        error: unknown;
      }>;
    }
  ).rpc<WebhookEventRow>('replay_webhook_event', {
    p_webhook_event_id: options.id,
  });

  if (error !== undefined && error !== null) {
    logger.error('Failed to replay webhook event', error, {
      script: 'webhooks:replay',
      id: options.id,
    });
    process.exit(1);
  }

  logger.info('✅ Webhook event replay queued', {
    script: 'webhooks:replay',
    id: data?.id ?? options.id,
    source: data?.source,
    type: data?.type,
    attempt_count: data?.attempt_count ?? null,
  });
}
