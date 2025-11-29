import  { type Database } from '@heyclaude/database-types';

import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';
import { createServiceRoleClient } from '../toolkit/supabase.js';

type WebhookEventRow = Database['public']['Tables']['webhook_events']['Row'];
type WebhookSource = Database['public']['Tables']['webhook_events']['Row']['source'];
type WebhookEventType = Database['public']['Tables']['webhook_events']['Row']['type'];

interface BacklogEntry {
  age_ms: number;
  attempt_count: number;
  attempted: boolean;
  created_at: string;
  id: string;
  last_error: null | string;
  source: WebhookSource;
  type: WebhookEventType;
}

interface Options {
  json?: boolean;
  limit: number;
  source?: string;
  type?: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = { limit: 25 };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg?.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const next = args[i + 1];
    const value = next && !next.startsWith('--') ? next : undefined;

    switch (key) {
      case 'limit': {
        options.limit = value ? Number.parseInt(value, 10) : options.limit;
        if (Number.isNaN(options.limit) || options.limit <= 0) {
          throw new Error('--limit must be a positive integer.');
        }
        if (value) {
          i += 1;
        }
        break;
      }
      case 'source': {
        if (value) {
          options.source = value;
          i += 1;
        }
        break;
      }
      case 'type': {
        if (value) {
          options.type = value;
          i += 1;
        }
        break;
      }
      case 'json': {
        options.json = true;
        break;
      }
      default: {
        logger.warn(`Ignoring unknown flag "${arg}"`, { script: 'webhooks:list' });
      }
    }
  }

  return options;
}

function formatAge(ageMs: number): string {
  if (!Number.isFinite(ageMs) || ageMs <= 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(ageMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

export async function runListBacklog(): Promise<void> {
  const options = parseArgs();

  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('webhook_events')
    .select('id, source, type, created_at, attempt_count, processed, last_error')
    .eq('processed', false);

  if (options.source) {
    query = query.eq('source', options.source as WebhookSource);
  }

  if (options.type) {
    query = query.eq('type', options.type as WebhookEventType);
  }

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(Math.min(options.limit, 200));

  if (error) {
    logger.error('Failed to fetch webhook backlog', error, { script: 'webhooks:list' });
    process.exit(1);
  }

  if (data.length === 0) {
    logger.info('🎉 No pending webhook events found', { script: 'webhooks:list' });
    return;
  }

  const records = data as WebhookEventRow[];
  const backlogEntries: BacklogEntry[] = records.map((row) => {
    const attemptCount = row.attempt_count;
    const createdAt = row.created_at;
    const age = Date.now() - new Date(createdAt).getTime();

    return {
      id: row.id,
      source: row.source,
      type: row.type,
      created_at: createdAt,
      attempt_count: attemptCount,
      attempted: attemptCount > 0,
      age_ms: age,
      last_error: row.last_error ?? null,
    };
  });

  if (options.json) {
    // For JSON output, use logger for structured logging
    logger.info('Webhook backlog entries', { entries: backlogEntries });
    // Also output to stdout for piping/redirection
    process.stdout.write(JSON.stringify(backlogEntries, null, 2) + '\n');
    return;
  }

  for (const [index, entry] of backlogEntries.entries()) {
    logger.info(
      `${index + 1}. [${entry.source}] ${entry.type} – created ${new Date(entry.created_at).toISOString()}`,
      {
        script: 'webhooks:list',
        id: entry.id,
        attempts: entry.attempt_count,
        attempted: entry.attempted,
        age: formatAge(entry.age_ms),
        last_error: entry.last_error,
      }
    );
  }
}
