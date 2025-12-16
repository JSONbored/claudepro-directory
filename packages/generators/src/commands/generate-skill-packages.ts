import { performance } from 'node:perf_hooks';

import { transformSkillToMarkdown, type SkillRow } from '@heyclaude/web-runtime/transformers/skill-to-md';
import archiver from 'archiver';

import { computeHash, hasHashChanged, setHash } from '../toolkit/cache.ts';
import { ensureEnvVars } from '../toolkit/env.ts';
import { logger } from '../toolkit/logger.ts';
import { createServiceRoleClient, DEFAULT_SUPABASE_URL } from '../toolkit/supabase.ts';

const CONCURRENCY = 5;
const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');

export async function runGenerateSkillPackages(): Promise<void> {
  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'generate-skill-packages',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  const supabase = createServiceRoleClient();

  logger.info('🚀 Generating Claude Desktop skill packages (database-first, optimized)...\n');
  logger.info('═'.repeat(80));

  const startTime = performance.now();

  logger.info('\n📊 Loading skills from database...');
  const skills = await loadAllSkillsFromDatabase(supabase);
  logger.info(`✅ Found ${skills.length} skills in database\n`, { skillCount: skills.length });

  logger.info('🔍 Computing content hashes and filtering changed skills...');
  const skillsToRebuild: Array<{ hash: string; skill: SkillRow; skillMd: string; }> = [];

  for (const skill of skills) {
    const skillMd = transformSkillToMarkdown(skill);
    const hash = computeHash(skillMd);

    if (needsRebuild(skill, skillMd)) {
      skillsToRebuild.push({ skill, skillMd, hash });
    }
  }

  if (skillsToRebuild.length === 0) {
    logger.info('✨ All skills up to date! No rebuild needed.\n');
    logger.info('💡 Content hashes match - zero ZIPs regenerated\n');
    return;
  }

  logger.info(`🔄 Rebuilding ${skillsToRebuild.length}/${skills.length} skills\n`, {
    rebuilding: skillsToRebuild.length,
    total: skills.length,
  });
  logger.info(`⚡ Processing ${CONCURRENCY} skills concurrently...\n`, {
    concurrency: CONCURRENCY,
  });
  logger.info('═'.repeat(80));

  const allResults: Array<{ message: string; slug: string; status: 'error' | 'success'; }> = [];

  for (let i = 0; i < skillsToRebuild.length; i += CONCURRENCY) {
    const batch = skillsToRebuild.slice(i, i + CONCURRENCY);
    const batchResults = await processBatch(batch, supabase);

    allResults.push(...batchResults);

    for (const result of batchResults) {
      if (result.status === 'success') {
        logger.info(`✅ ${result.slug} (${result.message})`, {
          slug: result.slug,
          message: result.message,
        });
      } else {
        logger.error(`❌ ${result.slug}: ${result.message}`, undefined, {
          slug: result.slug,
          message: result.message,
        });
      }
    }
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const successCount = allResults.filter((r) => r.status === 'success').length;
  const failCount = allResults.filter((r) => r.status === 'error').length;

  logger.info(`\n${'═'.repeat(80)}`);
  logger.info('\n📊 BUILD SUMMARY:\n');
  logger.info(`   Total skills: ${skills.length}`);
  logger.info(`   ✅ Built: ${successCount}/${skillsToRebuild.length}`);
  logger.info(`   ⏭️  Skipped: ${skills.length - skillsToRebuild.length} (content unchanged)`);
  logger.info(`   ❌ Failed: ${failCount}/${skillsToRebuild.length}`);
  logger.info(`   ⏱️  Duration: ${duration}s`);
  logger.info(`   ⚡ Concurrency: ${CONCURRENCY} parallel uploads`);
  logger.info('   🗄️  Storage: Supabase Storage (source of truth)', {
    total: skills.length,
    built: successCount,
    skipped: skills.length - skillsToRebuild.length,
    failed: failCount,
    duration: `${duration}s`,
    concurrency: CONCURRENCY,
  });

  if (failCount > 0) {
    const failedResults = allResults.filter((r) => r.status === 'error');
    logger.error('\n❌ FAILED BUILDS:\n', undefined, {
      failCount,
      failedBuilds: failedResults.map((r) => ({
        slug: r.slug,
        message: r.message,
      })),
    });
    for (const r of failedResults) {
      logger.error(`   ${r.slug}: ${r.message}`, undefined, { slug: r.slug, message: r.message });
    }
    process.exit(1);
  }

  logger.info('\n✨ Build complete! Next run will skip unchanged skills.\n');
}

function needsRebuild(skill: SkillRow, skillMdContent: string): boolean {
  const contentHash = computeHash(skillMdContent);
  return hasHashChanged(`skill:${skill.slug}`, contentHash);
}

async function generateZipBuffer(slug: string, skillMdContent: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('data', (chunk: Buffer) => buffers.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(buffers)));
    archive.on('error', reject);

    archive.append(skillMdContent, {
      name: `${slug}/SKILL.md`,
      date: FIXED_DATE,
      mode: 0o644,
    });

    void archive.finalize();
  });
}

async function loadAllSkillsFromDatabase(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('category', 'skills')
    .order('slug');

  if (error) {
    throw new Error(`Failed to fetch skills from database: ${error.message}`);
  }

  return data as SkillRow[];
}

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceRoleClient>,
  skill: SkillRow,
  zipBuffer: Buffer
): Promise<string> {
  const fileName = `packages/${skill.slug}.zip`;

  const { error: uploadError } = await supabase.storage.from('skills').upload(fileName, zipBuffer, {
    contentType: 'application/zip',
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('skills').getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('content')
    .update({ storage_url: publicUrl })
    .eq('id', skill.id);

  if (updateError) {
    throw new Error(`Database update failed: ${updateError.message}`);
  }

  return publicUrl;
}

async function processBatch(
  skills: Array<{ hash: string; skill: SkillRow; skillMd: string; }>,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<Array<{ message: string; slug: string; status: 'error' | 'success'; }>> {
  const results = await Promise.allSettled(
    skills.map(async ({ skill, skillMd, hash }) => {
      const buildStartTime = performance.now();

      const zipBuffer = await generateZipBuffer(skill.slug, skillMd);
      const fileSizeKB = (zipBuffer.length / 1024).toFixed(2);

      await uploadToStorage(supabase, skill, zipBuffer);

      const buildDuration = performance.now() - buildStartTime;

      setHash(`skill:${skill.slug}`, hash, {
        reason: 'Skill package rebuilt',
        duration: buildDuration,
        files: [`${skill.slug}.zip`],
      });

      return {
        slug: skill.slug,
        status: 'success' as const,
        message: `${fileSizeKB}KB`,
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    const skill = skills[index];
    if (!skill) {
      return {
        slug: 'unknown',
        status: 'error' as const,
        message: 'Skill not found at index',
      };
    }
    return {
      slug: skill.skill.slug,
      status: 'error' as const,
      message: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}
