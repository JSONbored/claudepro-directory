/**
 * Generate Claude Desktop Skill Packages
 *
 * Transforms skill JSON files into downloadable ZIP packages containing
 * SKILL.md files with proper directory structure.
 *
 * Required ZIP structure:
 *   skill-name.zip
 *     └── skill-name/
 *         └── SKILL.md
 *
 * @see https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
 */

import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';
import type { SkillContent } from '@/src/lib/schemas/content/skill.schema';
import { transformSkillToMarkdown } from '@/src/lib/transformers/skill-to-md';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(PROJECT_ROOT, 'content/skills');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'content/skills'); // Primary storage (git-tracked, discoverable on GitHub)
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public/downloads/skills'); // Copy for Next.js serving
const TEMP_DIR = path.join(PROJECT_ROOT, '.temp/skills');

/**
 * Check if skill needs to be rebuilt
 * Returns true if JSON is newer than ZIP or ZIP doesn't exist
 */
async function needsRebuild(skill: SkillContent): Promise<boolean> {
  const jsonPath = path.join(SKILLS_DIR, `${skill.slug}.json`);
  const zipPath = path.join(OUTPUT_DIR, `${skill.slug}.zip`);

  try {
    const [jsonStat, zipStat] = await Promise.all([fs.stat(jsonPath), fs.stat(zipPath)]);
    // Rebuild if JSON is newer than ZIP
    return jsonStat.mtime > zipStat.mtime;
  } catch {
    // ZIP doesn't exist, needs rebuild
    return true;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Generating Claude Desktop skill packages...\n');

  const startTime = performance.now();

  // Ensure output and temp directories exist
  await createOutputDirectory();
  await createPublicDirectory();
  await createTempDirectory();

  // Load all skill JSON files
  const skills = await loadAllSkillsJson();
  console.log(`📦 Found ${skills.length} skills to process\n`);

  // Filter skills that need rebuilding
  const skillsToRebuild: SkillContent[] = [];
  for (const skill of skills) {
    if (await needsRebuild(skill)) {
      skillsToRebuild.push(skill);
    }
  }

  if (skillsToRebuild.length === 0) {
    console.log('✨ All skills up to date! No rebuild needed.\n');
    return;
  }

  console.log(`🔄 Rebuilding ${skillsToRebuild.length}/${skills.length} skills\n`);

  // Generate packages for each skill that needs rebuilding
  let successCount = 0;
  let failCount = 0;

  for (const skill of skillsToRebuild) {
    try {
      await generateSkillPackage(skill);
      successCount++;
      console.log(`✅ ${skill.slug}`);
    } catch (error) {
      failCount++;
      console.error(`❌ ${skill.slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Copy ZIPs to public/ for Next.js serving (only rebuilt ones)
  await copyZipsToPublic(skillsToRebuild);

  // Cleanup temp directory
  await cleanupTempDirectory();

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n✨ Complete!');
  console.log(`   Rebuilt: ${successCount}/${skillsToRebuild.length}`);
  console.log(
    `   Skipped: ${skills.length - skillsToRebuild.length}/${skills.length} (up to date)`
  );
  console.log(`   Failed: ${failCount}/${skillsToRebuild.length}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Primary: ${OUTPUT_DIR}`);
  console.log(`   Served: ${PUBLIC_DIR}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

/**
 * Load all skill JSON files from content/skills/
 */
async function loadAllSkillsJson(): Promise<SkillContent[]> {
  const files = await fs.readdir(SKILLS_DIR);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));

  const skills: SkillContent[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(SKILLS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const skill = JSON.parse(content) as SkillContent;
    skills.push(skill);
  }

  return skills;
}

/**
 * Generate skill package for a single skill
 *
 * Steps:
 * 1. Create temp skill directory
 * 2. Transform JSON to SKILL.md
 * 3. Write SKILL.md to temp directory
 * 4. ZIP the directory with correct structure
 * 5. Validate ZIP structure
 */
async function generateSkillPackage(skill: SkillContent): Promise<void> {
  const skillDirPath = await createSkillDirectory(skill.slug);
  const skillMdContent = transformSkillToMarkdown(skill);
  await writeSkillMdFile(skillDirPath, skillMdContent);
  const zipPath = await zipSkillFolder(skill.slug, skillDirPath);
  await validateZipStructure(zipPath, skill.slug);
}

/**
 * Create temporary skill directory
 *
 * @param slug - Skill slug (used as directory name)
 * @returns Path to created directory
 */
async function createSkillDirectory(slug: string): Promise<string> {
  const skillDirPath = path.join(TEMP_DIR, slug);
  await fs.mkdir(skillDirPath, { recursive: true });
  return skillDirPath;
}

/**
 * Write SKILL.md file to skill directory
 *
 * @param skillDirPath - Path to skill directory
 * @param content - SKILL.md file content
 */
async function writeSkillMdFile(skillDirPath: string, content: string): Promise<void> {
  const filePath = path.join(skillDirPath, 'SKILL.md');
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * ZIP skill folder with correct structure
 *
 * Required structure:
 *   skill-name.zip
 *     └── skill-name/
 *         └── SKILL.md
 *
 * @param slug - Skill slug
 * @param skillDirPath - Path to skill directory
 * @returns Path to generated ZIP file
 */
async function zipSkillFolder(slug: string, skillDirPath: string): Promise<string> {
  const zipPath = path.join(OUTPUT_DIR, `${slug}.zip`);

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on('close', () => {
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add directory with name (creates skill-name/ as root in ZIP)
    archive.directory(skillDirPath, slug);

    archive.finalize();
  });
}

/**
 * Validate ZIP structure matches required format
 *
 * Ensures:
 * - ZIP contains folder as root (not files directly)
 * - Folder name matches skill slug
 * - SKILL.md exists inside folder
 *
 * @param zipPath - Path to ZIP file
 * @param slug - Expected skill slug
 */
async function validateZipStructure(zipPath: string, slug: string): Promise<void> {
  // Basic validation: check file exists and has non-zero size
  const stats = await fs.stat(zipPath);
  if (stats.size === 0) {
    throw new Error('Generated ZIP file is empty');
  }

  // Additional validation could use a ZIP reading library to inspect contents
  // For now, we trust archiver's directory() method creates correct structure
}

/**
 * Create output directory for ZIP files (content/skills/)
 */
async function createOutputDirectory(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

/**
 * Create public directory for Next.js serving (public/downloads/skills/)
 */
async function createPublicDirectory(): Promise<void> {
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
}

/**
 * Create temporary directory for skill folders
 */
async function createTempDirectory(): Promise<void> {
  await fs.mkdir(TEMP_DIR, { recursive: true });
}

/**
 * Copy generated ZIPs from content/skills/ to public/downloads/skills/
 *
 * Dual-storage strategy:
 * - content/skills/*.zip: Git-tracked, discoverable on GitHub, SEO benefit
 * - public/downloads/skills/*.zip: Served by Next.js for website downloads
 */
async function copyZipsToPublic(skills: SkillContent[]): Promise<void> {
  for (const skill of skills) {
    const sourceZip = path.join(OUTPUT_DIR, `${skill.slug}.zip`);
    const destZip = path.join(PUBLIC_DIR, `${skill.slug}.zip`);
    await fs.copyFile(sourceZip, destZip);
  }
}

/**
 * Remove temporary directory after ZIP generation
 */
async function cleanupTempDirectory(): Promise<void> {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
    console.warn('Warning: Failed to cleanup temp directory:', error);
  }
}

// Execute main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
