/**
 * Skills ZIP Package Generator
 *
 * Generates Claude Desktop-compatible SKILL.md ZIP packages for skills content.
 * Uses shared storage and database utilities from data-api.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  getStorageServiceClient,
  supabaseServiceRole,
  uploadObject,
} from '@heyclaude/edge-runtime';
import type { ContentRow, GenerateResult, PackageGenerator } from '../types.ts';

// Fixed date for deterministic ZIP output
const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');

/**
 * Compute the CRC-32 checksum for the given byte array.
 *
 * @param data - The input bytes to checksum
 * @returns The CRC-32 checksum as an unsigned 32‑bit number
 */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Convert a ContentRow skill into a SKILL.md Markdown document with YAML frontmatter and conditional sections.
 *
 * Produces Markdown that includes frontmatter (name and escaped description) followed by any of the following
 * sections when present: Content, Prerequisites, Key Features, Use Cases, Examples, Troubleshooting, and Learn More.
 *
 * @param skill - The ContentRow representing the skill and its metadata
 * @returns The generated SKILL.md content as a Markdown string
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

  // Safely extract properties from metadata
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc ? desc.value : undefined;
  };

  const getStringArray = (value: unknown): string[] | null => {
    if (!Array.isArray(value)) {
      return null;
    }
    const result: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        result.push(item);
      }
    }
    return result.length > 0 ? result : null;
  };

  const metadata = skill.metadata;
  const metadataObj =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : undefined;

  // Prerequisites
  const dependencies = metadataObj
    ? getStringArray(getProperty(metadataObj, 'dependencies'))
    : null;
  if (dependencies && dependencies.length > 0) {
    sections.push(`## Prerequisites\n\n${dependencies.map((d) => `- ${d}`).join('\n')}`);
  }

  // Features
  const features = getStringArray(skill.features);
  if (features && features.length > 0) {
    sections.push(`## Key Features\n\n${features.map((f) => `- ${f}`).join('\n')}`);
  }

  // Use Cases
  const useCases = getStringArray(skill.use_cases);
  if (useCases && useCases.length > 0) {
    sections.push(`## Use Cases\n\n${useCases.map((uc) => `- ${uc}`).join('\n')}`);
  }

  // Examples
  const examplesRaw = skill.examples;
  const examples = Array.isArray(examplesRaw)
    ? examplesRaw
        .map((ex) => {
          if (typeof ex !== 'object' || ex === null) {
            return null;
          }
          const titleDesc = Object.getOwnPropertyDescriptor(ex, 'title');
          const codeDesc = Object.getOwnPropertyDescriptor(ex, 'code');
          const languageDesc = Object.getOwnPropertyDescriptor(ex, 'language');
          const descriptionDesc = Object.getOwnPropertyDescriptor(ex, 'description');

          if (
            !titleDesc ||
            typeof titleDesc.value !== 'string' ||
            !codeDesc ||
            typeof codeDesc.value !== 'string' ||
            !languageDesc ||
            typeof languageDesc.value !== 'string'
          ) {
            return null;
          }

          const example: {
            title: string;
            code: string;
            language: string;
            description?: string;
          } = {
            title: titleDesc.value,
            code: codeDesc.value,
            language: languageDesc.value,
          };
          if (descriptionDesc && typeof descriptionDesc.value === 'string') {
            example.description = descriptionDesc.value;
          }
          return example;
        })
        .filter(
          (ex): ex is { title: string; code: string; language: string; description?: string } =>
            ex !== null
        )
    : null;

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
  const troubleshootingRaw = metadataObj ? getProperty(metadataObj, 'troubleshooting') : undefined;
  const troubleshooting = Array.isArray(troubleshootingRaw)
    ? troubleshootingRaw
        .map((item) => {
          if (typeof item !== 'object' || item === null) {
            return null;
          }
          const issueDesc = Object.getOwnPropertyDescriptor(item, 'issue');
          const solutionDesc = Object.getOwnPropertyDescriptor(item, 'solution');

          if (
            !issueDesc ||
            typeof issueDesc.value !== 'string' ||
            !solutionDesc ||
            typeof solutionDesc.value !== 'string'
          ) {
            return null;
          }

          return {
            issue: issueDesc.value,
            solution: solutionDesc.value,
          };
        })
        .filter((item): item is { issue: string; solution: string } => item !== null)
    : null;

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

/**
 * Escapes a string for safe inclusion in YAML frontmatter, adding double quotes only when required.
 *
 * @param str - The input string to escape for YAML
 * @returns The original `str` if no quoting is required; otherwise `str` with backslashes and double quotes escaped and wrapped in double quotes
 */
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
 * Create a minimal ZIP archive containing a single file at `{slug}/SKILL.md` with the provided Markdown content.
 *
 * The archive uses a fixed DOS timestamp for deterministic metadata, stores the file without compression, and includes a CRC-32 checksum.
 *
 * @param slug - Directory name (slug) to use as the archive path prefix for the SKILL.md file
 * @param skillMdContent - The SKILL.md file content to include in the archive
 * @returns A Uint8Array containing the bytes of the ZIP archive with one entry: `{slug}/SKILL.md`
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
  const crc = crc32(fileContent);

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
  // CRC-32: Calculated
  view.setUint32(14, crc, true);
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
  // CRC-32: Calculated
  cdView.setUint32(16, crc, true);
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
  // Relative offset of local header (0, since it's the first file)
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
  // Offset of start of central directory (after local header + file content)
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

  // Central Directory is already correctly configured with offset 0
  // EOCD is already correctly configured with offset (localHeader + content)

  zipBuffer.set(centralDirHeader, offset);
  offset += centralDirHeader.length;

  zipBuffer.set(eocd, offset);

  return zipBuffer;
}

/**
 * Converts a Date to a 16-bit DOS time value used in ZIP file headers.
 *
 * @param date - The date to convert
 * @returns A 16-bit DOS time value encoding hour, minute, and seconds (seconds stored as seconds/2)
 */
function dateToDosTime(date: Date): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return (hour << 11) | (minute << 5) | (second >> 1);
}

/**
 * Encode a Date as a 16-bit DOS date value used in ZIP file headers.
 *
 * @param date - The date to encode (year, month, day are used)
 * @returns The 16-bit DOS date value encoding year, month, and day
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
    // Convert Uint8Array to ArrayBuffer for upload
    // Create a new ArrayBuffer by copying the Uint8Array data
    const arrayBuffer = new Uint8Array(zipBuffer).buffer;
    const uploadResult = await uploadObject({
      bucket: this.getBucketName(),
      buffer: arrayBuffer,
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
    } satisfies DatabaseGenerated['public']['Tables']['content']['Update'];
    const { error: updateError } = await supabaseServiceRole
      .from('content')
      .update(updateData)
      .eq('id', content.id);

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