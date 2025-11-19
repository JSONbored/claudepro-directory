/**
 * Skills ZIP Package Generator
 *
 * Generates Claude Desktop-compatible SKILL.md ZIP packages for skills content.
 * Uses shared storage and database utilities from data-api.
 */

import type { Database } from '../../../../_shared/database-overrides.ts';
import { updateTable } from '../../../../_shared/database-overrides.ts';
import { getStorageServiceClient } from '../../../../_shared/utils/storage/client.ts';
import { uploadObject } from '../../../../_shared/utils/storage/upload.ts';
import type { ContentRow, GenerateResult, PackageGenerator } from '../types.ts';

// Fixed date for deterministic ZIP output
const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');

/**
 * Transform skill data to SKILL.md markdown format
 * Simplified version of transformSkillToMarkdown for edge function
 */
function transformSkillToMarkdown(skill: ContentRow): string {
  const frontmatter = `---
name: ${skill.slug}
description: ${escapeYamlString(skill.description || '')}
---`;

  const sections: string[] = [];

  if (skill.content) {
    sections.push(skill.content);
  }

  const metadata = (skill.metadata as Record<string, unknown>) || {};

  // Prerequisites
  const dependencies = metadata['dependencies'] as string[] | null;
  if (dependencies && dependencies.length > 0) {
    sections.push(`## Prerequisites\n\n${dependencies.map((d) => `- ${d}`).join('\n')}`);
  }

  // Features
  if (skill.features && Array.isArray(skill.features) && skill.features.length > 0) {
    sections.push(
      `## Key Features\n\n${(skill.features as string[]).map((f) => `- ${f}`).join('\n')}`
    );
  }

  // Use Cases
  if (skill.use_cases && Array.isArray(skill.use_cases) && skill.use_cases.length > 0) {
    sections.push(
      `## Use Cases\n\n${(skill.use_cases as string[]).map((uc) => `- ${uc}`).join('\n')}`
    );
  }

  // Examples
  const examples = skill.examples as Array<{
    title: string;
    code: string;
    language: string;
    description?: string;
  }> | null;
  if (examples && examples.length > 0) {
    const exampleBlocks = examples
      .map((ex, idx) => {
        const parts = [`### Example ${idx + 1}: ${ex.title}`];
        if (ex.description) parts.push(ex.description);
        parts.push(`\`\`\`${ex.language}\n${ex.code}\n\`\`\``);
        return parts.join('\n\n');
      })
      .join('\n\n');
    sections.push(`## Examples\n\n${exampleBlocks}`);
  }

  // Troubleshooting
  const troubleshooting = metadata['troubleshooting'] as Array<{
    issue: string;
    solution: string;
  }> | null;
  if (troubleshooting && troubleshooting.length > 0) {
    const items = troubleshooting
      .map((item) => `### ${item.issue}\n\n${item.solution}`)
      .join('\n\n');
    sections.push(`## Troubleshooting\n\n${items}`);
  }

  // Learn More
  if (skill.documentation_url) {
    sections.push(
      `## Learn More\n\nFor additional documentation and resources, visit:\n\n${skill.documentation_url}`
    );
  }

  return `${frontmatter}\n\n${sections.filter(Boolean).join('\n\n')}`.trim();
}

function escapeYamlString(str: string): string {
  const needsQuoting =
    str.includes(':') ||
    str.includes('"') ||
    str.includes("'") ||
    str.includes('#') ||
    str.includes('\n');

  if (needsQuoting) {
    const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  return str;
}

/**
 * Generate ZIP file buffer using Deno-compatible ZIP library
 *
 * Note: For Deno edge functions, we need a Deno-compatible ZIP library.
 * Options:
 * 1. Use jsr:@zip/zip (if available)
 * 2. Use npm:jszip (if Deno supports npm packages)
 * 3. Implement minimal ZIP creation using Web Streams API
 *
 * For now, using a simple approach that creates a basic ZIP structure.
 * This can be enhanced with a proper ZIP library once we verify Deno compatibility.
 */
async function generateZipBuffer(slug: string, skillMdContent: string): Promise<Uint8Array> {
  // TODO: Replace with proper Deno-compatible ZIP library
  // For now, create a minimal ZIP structure manually
  // This is a simplified implementation - a proper ZIP library would be better

  // Create ZIP file structure manually
  // ZIP format: [Local File Header][File Data][Central Directory][End of Central Directory]

  const fileName = `${slug}/SKILL.md`;
  const fileContent = new TextEncoder().encode(skillMdContent);
  const dosTime = dateToDosTime(FIXED_DATE);
  const dosDate = dateToDosDate(FIXED_DATE);

  // Local File Header (30 bytes + filename length)
  const localFileHeader = new Uint8Array(30 + fileName.length);
  const view = new DataView(localFileHeader.buffer);

  // ZIP signature: 0x04034b50
  view.setUint32(0, 0x04034b50, true);
  // Version needed to extract: 20 (2.0)
  view.setUint16(4, 20, true);
  // General purpose bit flag: 0
  view.setUint16(6, 0, true);
  // Compression method: 0 (stored, no compression)
  view.setUint16(8, 0, true);
  // Last mod file time: DOS time
  view.setUint16(10, dosTime & 0xffff, true);
  // Last mod file date: DOS date
  view.setUint16(12, dosDate, true);
  // CRC-32: 0 (we'll calculate if needed, but for simplicity use 0)
  view.setUint32(14, 0, true);
  // Compressed size
  view.setUint32(18, fileContent.length, true);
  // Uncompressed size
  view.setUint32(22, fileContent.length, true);
  // File name length
  view.setUint16(26, fileName.length, true);
  // Extra field length: 0
  view.setUint16(28, 0, true);
  // File name
  new TextEncoder().encodeInto(fileName, localFileHeader.subarray(30));

  // Central Directory Header (46 bytes + filename length)
  const centralDirHeader = new Uint8Array(46 + fileName.length);
  const cdView = new DataView(centralDirHeader.buffer);

  // Central file header signature: 0x02014b50
  cdView.setUint32(0, 0x02014b50, true);
  // Version made by: 20
  cdView.setUint16(4, 20, true);
  // Version needed: 20
  cdView.setUint16(6, 20, true);
  // General purpose bit flag: 0
  cdView.setUint16(8, 0, true);
  // Compression method: 0
  cdView.setUint16(10, 0, true);
  // Last mod file time
  cdView.setUint16(12, dosTime & 0xffff, true);
  // Last mod file date
  cdView.setUint16(14, dosDate, true);
  // CRC-32: 0
  cdView.setUint32(16, 0, true);
  // Compressed size
  cdView.setUint32(20, fileContent.length, true);
  // Uncompressed size
  cdView.setUint32(24, fileContent.length, true);
  // File name length
  cdView.setUint16(28, fileName.length, true);
  // Extra field length: 0
  cdView.setUint16(30, 0, true);
  // File comment length: 0
  cdView.setUint16(32, 0, true);
  // Disk number start: 0
  cdView.setUint16(34, 0, true);
  // Internal file attributes: 0
  cdView.setUint16(36, 0, true);
  // External file attributes: 0
  cdView.setUint32(38, 0, true);
  // Relative offset of local header
  cdView.setUint32(42, 0, true);
  // File name
  new TextEncoder().encodeInto(fileName, centralDirHeader.subarray(46));

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  // End of central dir signature: 0x06054b50
  eocdView.setUint32(0, 0x06054b50, true);
  // Number of this disk: 0
  eocdView.setUint16(4, 0, true);
  // Number of disk with start of central directory: 0
  eocdView.setUint16(6, 0, true);
  // Total number of entries in central directory on this disk: 1
  eocdView.setUint16(8, 1, true);
  // Total number of entries in central directory: 1
  eocdView.setUint16(10, 1, true);
  // Size of central directory
  eocdView.setUint32(12, centralDirHeader.length, true);
  // Offset of start of central directory
  eocdView.setUint32(16, localFileHeader.length + fileContent.length, true);
  // ZIP file comment length: 0
  eocdView.setUint16(20, 0, true);

  // Combine all parts
  const totalLength =
    localFileHeader.length + fileContent.length + centralDirHeader.length + eocd.length;
  const zipBuffer = new Uint8Array(totalLength);
  let offset = 0;

  zipBuffer.set(localFileHeader, offset);
  offset += localFileHeader.length;

  zipBuffer.set(fileContent, offset);
  offset += fileContent.length;

  // Update central directory offset
  cdView.setUint32(42, localFileHeader.length, true);
  zipBuffer.set(centralDirHeader, offset);
  offset += centralDirHeader.length;

  // Update EOCD offset
  eocdView.setUint32(16, localFileHeader.length + fileContent.length, true);
  zipBuffer.set(eocd, offset);

  return zipBuffer;
}

/**
 * Convert Date to DOS time format (16-bit, used in ZIP files)
 * DOS time: hour << 11 | minute << 5 | second >> 1
 */
function dateToDosTime(date: Date): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return (hour << 11) | (minute << 5) | (second >> 1);
}

/**
 * Convert Date to DOS date format (16-bit, used in ZIP files)
 * DOS date: (year - 1980) << 9 | month << 5 | day
 */
function dateToDosDate(date: Date): number {
  const year = date.getFullYear() - 1980;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (year << 9) | (month << 5) | day;
}

export class SkillsGenerator implements PackageGenerator {
  canGenerate(content: ContentRow): boolean {
    return content.category === 'skills' && content.slug != null && content.slug.trim().length > 0;
  }

  async generate(content: ContentRow): Promise<GenerateResult> {
    if (!content.slug) {
      throw new Error('Skill slug is required');
    }

    // 1. Transform skill to SKILL.md markdown
    const skillMd = transformSkillToMarkdown(content);

    // 2. Generate ZIP buffer
    const zipBuffer = await generateZipBuffer(content.slug, skillMd);
    const fileSizeKB = (zipBuffer.length / 1024).toFixed(2);

    // 3. Upload to Supabase Storage using shared utility
    const fileName = `packages/${content.slug}.zip`;
    const uploadResult = await uploadObject({
      bucket: this.getBucketName(),
      buffer: zipBuffer.buffer as ArrayBuffer, // Uint8Array.buffer is ArrayBufferLike, cast to ArrayBuffer
      mimeType: 'application/zip',
      objectPath: fileName,
      cacheControl: '3600',
      upsert: true,
      client: getStorageServiceClient(),
    });

    if (!(uploadResult.success && uploadResult.publicUrl)) {
      throw new Error(uploadResult['error'] || 'Failed to upload skill package to storage');
    }

    // 4. Update database with storage URL
    // Use updateTable helper to properly handle Database type
    const updateData = {
      storage_url: uploadResult.publicUrl,
    } satisfies Database['public']['Tables']['content']['Update'];
    const { error: updateError } = await updateTable('content', updateData, content.id);

    if (updateError) {
      throw new Error(
        `Database update failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      );
    }

    return {
      storageUrl: uploadResult.publicUrl,
      metadata: {
        file_size_kb: fileSizeKB,
        package_type: 'skill',
      },
    };
  }

  getBucketName(): string {
    return 'skills';
  }

  getDatabaseFields(): string[] {
    return ['storage_url'];
  }
}
