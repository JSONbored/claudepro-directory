import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// NOTE: We import from the source directly to access the manifest and templates
// This requires the build system to handle TSX and resolving these paths
import {
  EMAIL_TEMPLATE_MANIFEST as EMAIL_TEMPLATE_MANIFEST_RAW,
  type EmailTemplateDefinition,
  type EmailTemplateSlug,
} from '@heyclaude/edge-runtime/utils/email/templates/manifest.js';
import { Resend } from 'resend';

import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';

// Type assertion to ensure proper typing
const EMAIL_TEMPLATE_MANIFEST: readonly EmailTemplateDefinition<Record<string, unknown>>[] = EMAIL_TEMPLATE_MANIFEST_RAW as readonly EmailTemplateDefinition<Record<string, unknown>>[];

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
  return EMAIL_TEMPLATE_MANIFEST;
}

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

    if (templateId === undefined) {
      await delay(REQUEST_SPACING_MS);
      const createResult = await callWithRateLimitRetry(
        async () => {
          const result = await resend.templates.create({
            name: definition.displayName,
            subject,
            html,
          });
          return result as ResendResponse<{ id: string }>;
        },
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
        async () => {
          const result = await resend.templates.update(idToUpdate, {
            name: definition.displayName,
            subject,
            html,
          });
          return result as ResendResponse;
        },
        slug,
        'update template'
      );
      ensureSuccess(updateResult, `update template (${slug})`);
      logger.info(`Updated template ${slug}`, { script: 'sync-email', audit: true, templateId: idToUpdate });
    }

    // Publish (Resend requires explicit publish step for templates to be live?)
    // Checking docs/behavior: Often create/update is enough for drafts, but if there is a publish API:
    // Based on original script: resend.templates.publish(templateId)
    /* 
       Note: Resend Node SDK types might not strictly expose 'publish' if it's newer or different version
       We cast to unknown to support the method call as in the original script
    */
    await delay(REQUEST_SPACING_MS);
    const publishResult = await callWithRateLimitRetry(
      async () => {
        const templates = resend.templates as unknown as { publish: (id: string) => Promise<ResendResponse> };
        const result = await templates.publish(templateId);
        return result;
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
    logger.info('\n✅ Updated template map with latest Resend IDs.', { script: 'sync-email', audit: true });
  }
}
