/**
 * Jobs Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions + Polar.sh API
 */

import { z } from 'zod';

// Re-export generated actions for backward compatibility
export * from './create-job.generated.ts';
export * from './update-job.generated.ts';
export * from './delete-job.generated.ts';
export * from './toggle-job-status.generated.ts';

// Export input types (can't export from 'use server' files)
// These match the schemas in the generated files
const createJobSchema = z.object({
  company: z.string().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).nullable().optional(),
  category: z.enum(['engineering', 'design', 'product', 'marketing', 'sales', 'support', 'research', 'data', 'operations', 'leadership', 'consulting', 'education', 'other']).nullable().optional(),
  link: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  remote: z.boolean().nullable().optional(),
  workplace: z.enum(['Remote', 'On site', 'Hybrid']).nullable().optional(),
  experience: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  requirements: z.array(z.string()).nullable().optional(),
  benefits: z.array(z.string()).nullable().optional(),
  contact_email: z.string().nullable().optional(),
  company_logo: z.string().nullable().optional(),
  tier: z.enum(['standard', 'featured']),
  plan: z.enum(['one-time', 'subscription'])
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
