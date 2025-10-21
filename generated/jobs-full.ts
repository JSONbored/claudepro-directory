/**
 * Auto-generated full content file
 * Category: Jobs
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
