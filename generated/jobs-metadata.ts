/**
 * Auto-generated metadata file
 * Category: Jobs
 * Generated: 2025-10-23T12:46:56.708Z
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { Job } from '@/src/lib/schemas/content/job.schema';

export type JobMetadata = Pick<Job, 'id' | 'slug' | 'title' | 'company' | 'location' | 'type' | 'remote' | 'salary' | 'posted_at'>;

export const jobsMetadata: JobMetadata[] = [];

export const jobsMetadataBySlug = new Map(jobsMetadata.map(item => [item.slug, item]));

export function getJobMetadataBySlug(slug: string): JobMetadata | null {
  return jobsMetadataBySlug.get(slug) || null;
}
