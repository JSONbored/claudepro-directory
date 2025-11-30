import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// NOTE: edge-runtime uses Deno-style imports that tsc can't resolve in Node.js context.
// We import types from the package export, but the manifest is imported via relative path
// since the manifest.ts file imports templates using Deno-style subpaths.
import type {
  EmailTemplateDefinition,
  EmailTemplateSlug,
} from '@heyclaude/edge-runtime/utils/email/templates/manifest';

// Runtime import via relative path (tsx handles this fine, tsc cannot resolve Deno imports)
// @ts-expect-error -- edge-runtime manifest uses Deno-style imports that tsc can't resolve
import { EMAIL_TEMPLATE_MANIFEST as EMAIL_TEMPLATE_MANIFEST_RAW } from '@heyclaude/edge-runtime/utils/email/templates/manifest';
import { Resend } from 'resend';

import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';

// Type assertion for the manifest
const EMAIL_TEMPLATE_MANIFEST = EMAIL_TEMPLATE_MANIFEST_RAW as readonly EmailTemplateDefinition<Record<string, unknown>>[];

// ============================================================================
// Constants & Types
// ============================================================================

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const TEMPLATE_MAP_PATH = path.join(
  ROOT,
  'packages/edge-runtime/src/utils/email/templates/template-map.json'
);

const MAX_RATE_LIMIT_RETRIES = 5;
const REQUEST_SPACING_MS = 600;

type TemplateDefinition = EmailTemplateDefinition<Record<string, unknown>>;

interface TemplateMapEntry {
  lastUploadedAt?: string;
  resendTemplateId?: string;
}

type TemplateMap = Record<EmailTemplateSlug, TemplateMapEntry>;

interface ResendError {
  message?: string;
  statusCode?: number;
}

interface ResendResponse<T = unknown> {
  data?: T;
  error?: ResendError;
}

// Helper to get properly typed manifest
function getTypedManifest(): readonly TemplateDefinition[] {
  return EMAIL_TEMPLATE_MANIFEST as readonly TemplateDefinition[];
}

interface UploadOptions {
  dryRun: boolean;
  force: boolean;
  onlySlugs?: EmailTemplateSlug[] | undefined;
}

// ============================================================================
// Helpers
// ============================================================================

async function readTemplateMap(): Promise<TemplateMap> {
  try {
    const raw = await readFile(TEMPLATE_MAP_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TemplateMap>;
    const map = {} as TemplateMap;
    const manifest = getTypedManifest();
    for (const def of manifest) {
      const slug: EmailTemplateSlug = def.slug;
      map[slug] = parsed[slug] ?? {};
    }
    return map;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      const emptyMap = {} as TemplateMap;
      const manifest = getTypedManifest();
      for (const def of manifest) {
        const slug: EmailTemplateSlug = def.slug;
        emptyMap[slug] = {};
      }
      return emptyMap;
    }
    throw error;
  }
}

async function writeTemplateMap(map: TemplateMap) {
  const orderedEntries = Object.entries(map).toSorted(([a], [b]) => a.localeCompare(b));
  const orderedMap: Record<string, TemplateMapEntry> = {};
  for (const [slug, entry] of orderedEntries) {
    orderedMap[slug] = entry;
  }
  await writeFile(TEMPLATE_MAP_PATH, `${JSON.stringify(orderedMap, null, 2)}\n`);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRateLimitRetry<T extends ResendResponse>(
  request: () => Promise<T>,
  slug: EmailTemplateSlug,
  action: string
): Promise<T> {
  let hitRateLimit = false;
  let retries = 0;

  for (let attempt = 1; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    const result = await request();
    const error = result.error;

    if (error === undefined) {
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

function ensureSuccess<T extends ResendResponse>(result: T, action: string) {
  if (result.error !== undefined) {
    const errorMessage = result.error.message ?? 'unknown error';
    throw new Error(`Resend ${action} failed: ${errorMessage}`);
  }
  if (result.data === undefined) {
    throw new Error(`Resend ${action} failed: empty response`);
  }
}

// ============================================================================
// Main Command
/**
 * Syncs local email templates from the repository manifest to the Resend service by creating, updating, and publishing templates.
 *
 * This command-line entrypoint reads the typed email template manifest and the on-disk template map, then for each selected template:
 * - builds sample data, subject, and rendered HTML,
 * - creates a new Resend template or updates an existing one (optionally forcing creation),
 * - publishes the template,
 * - and updates the template map with the Resend template ID and upload timestamp.
 *
 * Side effects:
 * - Reads the template manifest and the template map file from disk.
 * - Writes an updated template map to disk when not run in dry-run mode.
 * - Makes network requests to the Resend API (create / update / publish).
 *
 * Command-line flags:
 * - --dry-run: Log actions but do not perform network requests or write the template map.
 * - --force: Create new templates instead of reusing existing Resend template IDs.
 * - --only=<slug1,slug2>: Limit sync to the specified comma-separated template slugs.
 *
 * @param dryRun - When true (via `--dry-run`), no network requests or file writes are performed.
 * @param force - When true (via `--force`), existing Resend template IDs are ignored and new templates are created.
 * @param only - Comma-separated list of template slugs provided via `--only=` to restrict which templates are processed.
 * @throws Error - If required environment variables (e.g., RESEND_API_KEY) are missing, if Resend API responses are invalid, or if retryable requests exhaust their retry budget.
 * @example
 *   # Full sync (creates/updates and publishes templates)
 *   node scripts/sync-email
 *
 *   # Dry run: show actions without network or disk changes
 *   node scripts/sync-email --dry-run
 *
 *   # Force creation of new templates for a subset
 *   node scripts/sync-email --force --only=welcome,new-user
 *
 * @returns void
 */

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
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) throw new Error('RESEND_API_KEY is undefined after check');

  const resend = new Resend(apiKey);
  const manifest = getTypedManifest();
  const map = await readTemplateMap();

  const definitions = options.onlySlugs
    ? manifest.filter((d: TemplateDefinition) => options.onlySlugs?.includes(d.slug) ?? false)
    : manifest;

  if (definitions.length === 0) {
    logger.info('No templates matched the provided filters.', { script: 'sync-email', audit: true });
    return;
  }

  logger.info('📧 Syncing Email Templates', { script: 'sync-email', audit: true });
  logger.info(`  Dry run: ${dryRun}`, { script: 'sync-email', audit: true });
  logger.info(`  Force: ${force}`, { script: 'sync-email', audit: true });
  logger.info(`  Templates: ${definitions.length}\n`, { script: 'sync-email', audit: true });

  for (const definition of definitions) {
    const props: Record<string, unknown> = definition.buildSampleData();
    const subject: string = definition.buildSubject(props);
    const html: string = await definition.render(props);
    const slug: EmailTemplateSlug = definition.slug;

    logger.info(`[${dryRun ? 'DRY-RUN' : 'UPLOAD'}] ${slug}`, {
      script: 'sync-email',
      subject,
      size: `${html.length} bytes`,
      audit: true,
    });

    if (dryRun) continue;

    const entry = map[slug] ?? {};
    let templateId: string | undefined = force ? undefined : entry.resendTemplateId;

    // Resend SDK templates API - types may not be fully exposed in all SDK versions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Resend templates API types incomplete
    const templates = (resend as any).templates as {
      create: (opts: { name: string; subject: string; html: string }) => Promise<ResendResponse<{ id: string }>>;
      update: (opts: { id: string; name: string; subject: string; html: string }) => Promise<ResendResponse>;
      publish: (id: string) => Promise<ResendResponse>;
    };

    if (templateId === undefined) {
      await delay(REQUEST_SPACING_MS);
      const createResult = await callWithRateLimitRetry(
        async () => templates.create({
          name: definition.displayName,
          subject,
          html,
        }),
        slug,
        'create template'
      );
      ensureSuccess(createResult, `create template (${slug})`);
      if (createResult.data && 'id' in createResult.data) {
        templateId = createResult.data.id;
      } else {
        throw new Error(`Create template (${slug}) returned invalid response`);
      }
      logger.info(`Created template ${slug}`, { script: 'sync-email', audit: true, templateId });
    } else {
      await delay(REQUEST_SPACING_MS);
      const idToUpdate = templateId;
      const updateResult = await callWithRateLimitRetry(
        async () => templates.update({
          id: idToUpdate,
          name: definition.displayName,
          subject,
          html,
        }),
        slug,
        'update template'
      );
      ensureSuccess(updateResult, `update template (${slug})`);
      logger.info(`Updated template ${slug}`, { script: 'sync-email', audit: true, templateId: idToUpdate });
    }

    // Publish template to make it live
    await delay(REQUEST_SPACING_MS);
    const publishResult = await callWithRateLimitRetry(
      async () => templates.publish(templateId!),
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
    logger.info('\n✅ Updated template map with latest Resend IDs.', { script: 'sync-email', audit: true });
  }
}