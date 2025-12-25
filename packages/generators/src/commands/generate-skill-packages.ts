import {
  transformSkillToMarkdown,
  type SkillRow,
} from '@heyclaude/web-runtime/transformers/skill-to-md';
import archiver from 'archiver';

import { prisma } from '@heyclaude/data-layer/prisma/client';
import { env } from '@heyclaude/shared-runtime/schemas/env';

import { ensureEnvVars } from '../toolkit/env.ts';
import { generatePackages, type PackageGeneratorConfig } from '../toolkit/package-generator.ts';
import { createServiceRoleClient, DEFAULT_SUPABASE_URL } from '../toolkit/supabase.ts';

const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');

export async function runGenerateSkillPackages(): Promise<void> {
  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    const { logger } = await import('../toolkit/logger.ts');
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'generate-skill-packages',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  const config: PackageGeneratorConfig<SkillRow, string> = {
    commandName: 'generate-skill-packages',
    itemName: 'skill',
    itemNamePlural: 'skills',
    cacheKeyPrefix: 'skill:',
    storageBucket: 'skills',
    fileExtension: '.zip',
    concurrency: 5,
    loadItems: loadAllSkillsFromDatabase,
    transformToPackageContent: (skill) => transformSkillToMarkdown(skill),
    buildPackage: async (skill, skillMd) => generateZipBuffer(skill.slug, skillMd),
    uploadAndUpdate: async (supabase, skill, zipBuffer, _contentHash) => {
      return uploadToStorage(supabase, skill, zipBuffer);
    },
  };

  await generatePackages(config);
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

async function loadAllSkillsFromDatabase(): Promise<SkillRow[]> {
  // OPTIMIZATION: Use select to fetch only required fields (9 fields)
  // This reduces data transfer significantly (from 30+ fields to 9 fields per skill)
  // Fields match transformSkillToMarkdown requirements
  const skills = await prisma.content.findMany({
    where: {
      category: 'skills',
    },
    select: {
      id: true,
      slug: true,
      description: true,
      content: true,
      metadata: true,
      features: true,
      use_cases: true,
      examples: true,
      documentation_url: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  return skills as SkillRow[];
}

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceRoleClient>,
  skill: SkillRow,
  zipBuffer: Buffer,
  _contentHash?: string
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

  await prisma.content.update({
    where: {
      id: skill.id,
    },
    data: {
      storage_url: publicUrl,
    },
  });

  return publicUrl;
}
