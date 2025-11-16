import { Resend } from 'npm:resend@6.4.2';

import {
  EMAIL_TEMPLATE_MANIFEST,
  type EmailTemplateDefinition,
  type EmailTemplateSlug,
} from '../utils/email/templates/manifest.ts';

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

const TEMPLATE_MAP_URL = new URL('../utils/email/templates/template-map.json', import.meta.url);
const MAX_RATE_LIMIT_RETRIES = 5;
const REQUEST_SPACING_MS = 600;
const DEFAULT_TEMPLATE_VARIABLES = [
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

async function readTemplateMap(): Promise<TemplateMap> {
  try {
    const raw = await Deno.readTextFile(TEMPLATE_MAP_URL);
    const parsed = JSON.parse(raw) as Partial<TemplateMap>;
    const map = {} as TemplateMap;
    for (const def of EMAIL_TEMPLATE_MANIFEST as TemplateDefinition[]) {
      map[def.slug as EmailTemplateSlug] = parsed[def.slug as EmailTemplateSlug] ?? {};
    }
    return map;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
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
  await Deno.writeTextFile(TEMPLATE_MAP_URL, `${JSON.stringify(orderedMap, null, 2)}\n`);
}

function parseArgs(args: string[]): UploadOptions {
  const options: UploadOptions = {
    dryRun: false,
    force: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg.startsWith('--only=')) {
      const value = arg.split('=')[1];
      if (value) {
        options.onlySlugs = value
          .split(',')
          .map((slug) => slug.trim())
          .filter(Boolean) as EmailTemplateSlug[];
      }
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      Deno.exit(0);
    }
  }

  return options;
}

function printUsage() {
  console.log(`Upload Claude Pro email templates to Resend

Usage:
  deno run -A upload-resend-templates.ts [--dry-run] [--only=slug,slug] [--force]

Options:
  --dry-run     Render templates and list payloads without calling Resend.
  --only        Comma-separated list of template slugs to upload.
  --force       Create a new template even if an ID already exists.`);
}

function ensureEnv(): string {
  const apiKey = Deno.env.get('RESEND_TEMPLATE_API_KEY') ?? Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    throw new Error(
      'Missing RESEND_TEMPLATE_API_KEY (or RESEND_API_KEY). Add it to .env.edge.local before running this script.'
    );
  }
  return apiKey;
}

function selectDefinitions(
  manifest: TemplateDefinition[],
  only?: EmailTemplateSlug[]
): TemplateDefinition[] {
  if (!only?.length) {
    return manifest;
  }
  const onlySet = new Set(only);
  return manifest.filter((entry) => onlySet.has(entry.slug as EmailTemplateSlug));
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

function logTemplateSummary(
  slug: EmailTemplateSlug,
  subject: string,
  length: number,
  options: UploadOptions
) {
  const mode = options.dryRun ? 'DRY-RUN' : 'UPLOAD';
  console.log(`[${mode}] ${slug} — subject="${subject}" (${length.toLocaleString()} bytes)`);
}

async function uploadTemplates() {
  const options = parseArgs(Deno.args);
  const apiKey = ensureEnv();
  const resend = new Resend(apiKey);
  const manifest = EMAIL_TEMPLATE_MANIFEST as TemplateDefinition[];
  const map = await readTemplateMap();
  const definitions = selectDefinitions(manifest, options.onlySlugs);

  if (!definitions.length) {
    console.log('No templates matched the provided filters.');
    return;
  }

  for (const definition of definitions) {
    const props = definition.buildSampleData();
    const subject = definition.buildSubject(props);
    const html = await definition.render(props);
    logTemplateSummary(definition.slug as EmailTemplateSlug, subject, html.length, options);

    if (options.dryRun) {
      continue;
    }

    const slug = definition.slug as EmailTemplateSlug;
    const entry = map[slug] ?? {};
    let templateId = options.force ? undefined : entry.resendTemplateId;

    if (templateId) {
      await delay(REQUEST_SPACING_MS);
      const idToUpdate = templateId; // Store in const to avoid non-null assertion
      const updateResult = await callWithRateLimitRetry(
        async () => {
          const result = resend.templates.update(idToUpdate, {
            name: definition.displayName,
            subject,
            html,
            from: definition.from,
            replyTo: definition.replyTo,
            variables: DEFAULT_TEMPLATE_VARIABLES,
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
            from: definition.from,
            replyTo: definition.replyTo,
            variables: DEFAULT_TEMPLATE_VARIABLES,
          });
          // Resend's ChainableTemplateResult needs to be awaited or converted
          return (await result) as { error: unknown; data: { id: string } };
        },
        slug,
        'create template'
      );
      ensureSuccess(createResult, `create template (${slug})`);
      templateId = createResult.data.id;
    }

    await delay(REQUEST_SPACING_MS);
    const publishResult = await callWithRateLimitRetry(
      async () => {
        const result = resend.templates.publish(templateId);
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

  if (!options.dryRun) {
    await writeTemplateMap(map);
    console.log('Updated template map with latest Resend IDs.');
  }
}

if (import.meta.main) {
  uploadTemplates().catch((error) => {
    console.error('Template upload failed:', error);
    Deno.exit(1);
  });
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
    const error = (result as { error?: { statusCode?: number; message?: string } }).error;
    if (!error) {
      if (hitRateLimit) {
        console.warn(
          `[RATE LIMIT] ${action} for ${slug} retried ${retries} time(s); completed successfully.`
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
