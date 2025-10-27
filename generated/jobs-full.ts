/**
 * Auto-generated full content file
 * Category: Jobs
 * Generated: 2025-10-23T12:46:56.708Z
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { Job } from '@/src/lib/schemas/content/job.schema';

export const jobsFull: Job[] = [];

export const jobsFullBySlug = new Map(jobsFull.map(item => [item.slug, item]));

export function getJobFullBySlug(slug: string) {
  return jobsFullBySlug.get(slug) || null;
}

export type JobFull = typeof jobsFull[number];
