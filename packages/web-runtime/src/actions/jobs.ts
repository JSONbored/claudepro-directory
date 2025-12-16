/**
 * Jobs Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions + Polar.sh API
 */

import { z } from 'zod';
import {
  jobTypeSchema,
  jobCategorySchema,
  jobPlanSchema,
  jobTierSchema,
  workplaceTypeSchema,
  experience_levelSchema,
} from '@heyclaude/web-runtime/prisma-zod-schemas';

// Generated actions have been migrated to use Prisma-generated Zod schemas
// See individual action files: create-job.ts, update-job.ts, delete-job.ts, toggle-job-status.ts

// Export input types (can't export from 'use server' files)
// These match the schemas in the generated files and use Prisma-generated Zod schemas
const createJobSchema = z.object({
  company: z.string().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  type: jobTypeSchema.nullable().optional(),
  category: jobCategorySchema.nullable().optional(),
  link: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  remote: z.boolean().nullable().optional(),
  workplace: workplaceTypeSchema.nullable().optional(),
  experience: experience_levelSchema.nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  requirements: z.array(z.string()).nullable().optional(),
  benefits: z.array(z.string()).nullable().optional(),
  contact_email: z.string().nullable().optional(),
  company_logo: z.string().nullable().optional(),
  tier: jobTierSchema,
  plan: jobPlanSchema,
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
