import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// NOTE: We import from the source directly to access the manifest and templates
// This requires the build system to handle TSX and resolving these paths
import {
  EMAIL_TEMPLATE_MANIFEST,
  type EmailTemplateDefinition,
  type EmailTemplateSlug,
} from '@heyclaude/edge-runtime/utils/email/templates/manifest.js';
import { Resend } from 'resend';
import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';

// ============================================================================
// Constants & Types
// ============================================================================

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const TEMPLATE_MAP_PATH = join(
  ROOT,
  'packages/edge-runtime/src/utils/email/templates/template-map.json'
);

const MAX_RATE_LIMIT_RETRIES = 5;
const REQUEST_SPACING_MS = 600;
const _DEFAULT_TEMPLATE_VARIABLES = [
  {
    key: 'UNSUBSCRIBE_URL',
    type: 'string' as const,
    fallbackValue: 'https://claudepro.directory/account/preferences?tab=notifications',
  },
  {
    key: 'PREFERENCES_URL',
    type: 'string' as const,
    fallbackValue: 'https://claudepro.directory/account/preferences?tab=notifications',
  },
];

type TemplateDefinition = EmailTemplateDefinition<Record<string, unknown>>;

interface TemplateMapEntry {
  resendTemplateId?: string;
  lastUploadedAt?: string;
}

type TemplateMap = Record<EmailTemplateSlug, TemplateMapEntry>;

interface UploadOptions {
  dryRun: boolean;
  force: boolean;
  onlySlugs?: EmailTemplateSlug[];
}

// ============================================================================
// Helpers
// ============================================================================

async function readTemplateMap(): Promise<TemplateMap> {
  try {
    const raw = await readFile(TEMPLATE_MAP_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<TemplateMap>;
    const map = {} as TemplateMap;
    for (const def of EMAIL_TEMPLATE_MANIFEST as TemplateDefinition[]) {
      map[def.slug as EmailTemplateSlug] = parsed[def.slug as EmailTemplateSlug] ?? {};
    }
    return map;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const emptyMap = {} as TemplateMap;
      for (const def of EMAIL_TEMPLATE_MANIFEST as TemplateDefinition[]) {
        emptyMap[def.slug as EmailTemplateSlug] = {};
      }
      return emptyMap;
    }
    throw error;
  }
}

async function writeTemplateMap(map: TemplateMap) {
  const orderedEntries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  const orderedMap = orderedEntries.reduce<Record<string, TemplateMapEntry>>(
    (acc, [slug, entry]) => {
      acc[slug] = entry;
      return acc;
    },
    {}
  );
  await writeFile(TEMPLATE_MAP_PATH, `${JSON.stringify(orderedMap, null, 2)}\n`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRateLimitRetry<T>(
  request: () => Promise<T>,
  slug: EmailTemplateSlug,
  action: string
): Promise<T> {
  let hitRateLimit = false;
  let retries = 0;

  for (let attempt = 1; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    const result = await request();
    // Resend SDK usually throws, but if it returns an error object check for it
    const error = (result as { error?: { statusCode?: number; message?: string } })?.error;

    if (!error) {
      if (hitRateLimit) {
        logger.warn(
          `[RATE LIMIT] ${action} for ${slug} retried ${retries} time(s); completed successfully.`,
          { script: 'sync-email' }
        );
      }
      return result;
    }

    if (error.statusCode === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      hitRateLimit = true;
      retries++;
      const delayMs = Math.max(400 * attempt, REQUEST_SPACING_MS);
      await delay(delayMs);
      continue;
    }
    return result;
  }
  throw new Error(`Exceeded retry budget for ${action} (${slug}) due to repeated rate limits.`);
}

function ensureSuccess<T extends { error: unknown; data: unknown }>(result: T, action: string) {
  if ((result as { error: unknown }).error) {
    const error = (result as { error: { message?: string } }).error;
    throw new Error(`Resend ${action} failed: ${error?.message ?? 'unknown error'}`);
  }
  if (!(result as { data: unknown }).data) {
    throw new Error(`Resend ${action} failed: empty response`);
  }
}

// ============================================================================
// Main Command
// ============================================================================

export async function runSyncEmail() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const onlyArg = args.find((arg) => arg.startsWith('--only='));

  const options: UploadOptions = {
    dryRun,
    force,
    onlySlugs: onlyArg
      ? (onlyArg
          .split('=')[1]
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) as EmailTemplateSlug[])
      : undefined,
  };

  // Ensure API key
  await ensureEnvVars(['RESEND_API_KEY']);
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is undefined after check');

  const resend = new Resend(apiKey);
  const manifest = EMAIL_TEMPLATE_MANIFEST as TemplateDefinition[];
  const map = await readTemplateMap();

  const definitions = options.onlySlugs
    ? manifest.filter((d) => options.onlySlugs?.includes(d.slug as EmailTemplateSlug))
    : manifest;

  if (!definitions.length) {
    logger.info('No templates matched the provided filters.', { script: 'sync-email' });
    return;
  }

  logger.info('📧 Syncing Email Templates', { script: 'sync-email' });
  logger.info(`  Dry run: ${dryRun}`, { script: 'sync-email' });
  logger.info(`  Force: ${force}`, { script: 'sync-email' });
  logger.info(`  Templates: ${definitions.length}\n`, { script: 'sync-email' });

  for (const definition of definitions) {
    const props = definition.buildSampleData();
    const subject = definition.buildSubject(props);

    // @ts-expect-error - render is async in our definition but Resend might expect strict React
    const html = await definition.render(props);

    logger.info(`[${dryRun ? 'DRY-RUN' : 'UPLOAD'}] ${definition.slug}`, {
      script: 'sync-email',
      subject,
      size: `${html.length} bytes`,
    });

    if (dryRun) continue;

    const slug = definition.slug as EmailTemplateSlug;
    const entry = map[slug] ?? {};
    let templateId = force ? undefined : entry.resendTemplateId;

    if (templateId) {
      await delay(REQUEST_SPACING_MS);
      const idToUpdate = templateId;
      const updateResult = await callWithRateLimitRetry(
        async () => {
          const result = resend.templates.update(idToUpdate, {
            name: definition.displayName,
            subject,
            html,
            // Use explicit From/ReplyTo from definition or defaults if needed
            // For now we assume Resend default or definitions handle it
          });
          return (await result) as { error: unknown; data: unknown };
        },
        slug,
        'update template'
      );
      ensureSuccess(updateResult, `update template (${slug})`);
    } else {
      await delay(REQUEST_SPACING_MS);
      const createResult = await callWithRateLimitRetry(
        async () => {
          const result = resend.templates.create({
            name: definition.displayName,
            subject,
            html,
          });
          return (await result) as { error: unknown; data: { id: string } };
        },
        slug,
        'create template'
      );
      ensureSuccess(createResult, `create template (${slug})`);
      templateId = createResult.data.id;
    }

    // Publish (Resend requires explicit publish step for templates to be live?)
    // Checking docs/behavior: Often create/update is enough for drafts, but if there is a publish API:
    // Based on original script: resend.templates.publish(templateId)
    /* 
       Note: Resend Node SDK types might not strictly expose 'publish' if it's newer or different version
       We cast to any to support the method call as in the original script
    */
    await delay(REQUEST_SPACING_MS);
    const publishResult = await callWithRateLimitRetry(
      async () => {
        // @ts-expect-error - publish method existence check
        const result = (
          resend.templates as unknown as { publish: (id: string) => Promise<unknown> }
        ).publish(templateId as string);
        return (await result) as { error: unknown; data: unknown };
      },
      slug,
      'publish template'
    );
    ensureSuccess(publishResult, `publish template (${slug})`);

    map[slug] = {
      resendTemplateId: templateId,
      lastUploadedAt: new Date().toISOString(),
    };
  }

  if (!dryRun) {
    await writeTemplateMap(map);
    logger.info('\n✅ Updated template map with latest Resend IDs.', { script: 'sync-email' });
  }
}
