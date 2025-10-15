/**
 * Job Content Schema
 * Zod validation for job listings (replaces TypeScript-only JobContent type)
 *
 * Matches database schema from Supabase
 */

import { z } from 'zod';
import { nonEmptyString, slugString, urlString } from '@/src/lib/schemas/primitives/base-strings';

// Job-specific enums
export const jobTypeSchema = z.enum([
  'full-time',
  'part-time',
  'contract',
  'internship',
  'freelance',
]);
export const jobWorkplaceSchema = z.enum(['On site', 'Remote', 'Hybrid']);
export const jobExperienceSchema = z.enum(['Entry', 'Mid', 'Senior', 'Lead', 'Executive']);
export const jobPlanSchema = z.enum(['standard', 'featured', 'premium']);
export const jobStatusSchema = z.enum(['draft', 'active', 'expired', 'paused', 'deleted']);

/**
 * Database job schema (complete record from Supabase)
 */
export const jobDatabaseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  company_id: z.string().uuid().nullable(),

  // Job details
  slug: slugString,
  title: nonEmptyString.max(200),
  company: nonEmptyString.max(200),
  location: nonEmptyString.max(200).nullable(),
  description: nonEmptyString,
  salary: z.string().max(100).nullable(),
  remote: z.boolean().default(false),
  type: jobTypeSchema,
  workplace: jobWorkplaceSchema.nullable(),
  experience: jobExperienceSchema.nullable(),
  category: nonEmptyString.max(100),
  tags: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  link: urlString, // Apply URL
  contact_email: z.string().email().nullable(),
  company_logo: urlString.nullable(),

  // Business fields
  plan: jobPlanSchema.default('standard'),
  active: z.boolean().default(false),
  status: jobStatusSchema.default('draft'),
  posted_at: z.string().datetime().nullable(),
  expires_at: z.string().datetime().nullable(),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),

  // Analytics
  view_count: z.number().int().nonnegative().default(0),
  click_count: z.number().int().nonnegative().default(0),

  // Audit
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type JobDatabase = z.infer<typeof jobDatabaseSchema>;

/**
 * Job creation schema (for forms/submissions)
 * Omits auto-generated fields (id, timestamps, etc.)
 *
 * Production-grade pattern with exactOptionalPropertyTypes: true
 * - .optional() = field can be omitted from form submission
 * - Values are transformed to null before DB insertion (see actions)
 * - Eliminates ambiguity of .nullable().optional() anti-pattern
 */
export const createJobSchema = z.object({
  title: nonEmptyString.min(3).max(200, 'Title must be less than 200 characters'),
  company: nonEmptyString.min(2).max(200, 'Company name must be less than 200 characters'),
  location: nonEmptyString.max(200, 'Location must be less than 200 characters').optional(),
  description: nonEmptyString.min(50, 'Description must be at least 50 characters'),
  salary: z.string().max(100).optional(),
  remote: z.boolean().default(false),
  type: jobTypeSchema,
  workplace: jobWorkplaceSchema.optional(),
  experience: jobExperienceSchema.optional(),
  category: nonEmptyString.max(100),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(10, 'Maximum 10 tags'),
  requirements: z.array(z.string()).min(1, 'Add at least one requirement').max(20),
  benefits: z.array(z.string()).max(20).default([]),
  link: urlString, // Apply URL
  contact_email: z.string().email().optional(),
  company_logo: urlString.optional(),
  company_id: z.string().uuid().optional(),
  plan: jobPlanSchema.default('standard'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

/**
 * Job update schema (for editing existing jobs)
 * All fields optional except what's required to identify the job
 */
export const updateJobSchema = z.object({
  id: z.string().uuid(),
  title: nonEmptyString.min(3).max(200).optional(),
  company: nonEmptyString.min(2).max(200).optional(),
  location: nonEmptyString.max(200).nullable().optional(),
  description: nonEmptyString.min(50).optional(),
  salary: z.string().max(100).nullable().optional(),
  remote: z.boolean().optional(),
  type: jobTypeSchema.optional(),
  workplace: jobWorkplaceSchema.nullable().optional(),
  experience: jobExperienceSchema.nullable().optional(),
  category: nonEmptyString.max(100).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  requirements: z.array(z.string()).min(1).max(20).optional(),
  benefits: z.array(z.string()).max(20).optional(),
  link: urlString.optional(),
  contact_email: z.string().email().nullable().optional(),
  company_logo: urlString.nullable().optional(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

/**
 * Job toggle status schema
 */
export const toggleJobStatusSchema = z.object({
  id: z.string().uuid(),
  status: jobStatusSchema,
});

/**
 * Job display schema (for frontend consumption)
 * Transforms database record to match existing JobContent type
 */
export const jobContentSchema = jobDatabaseSchema.transform((data) => ({
  // Map to existing JobContent type fields
  slug: data.slug,
  description: data.description,
  category: data.category,
  author: data.company, // Company name as author
  dateAdded: data.created_at.substring(0, 10), // ISO date string (YYYY-MM-DD)
  tags: data.tags,
  title: data.title,
  company: data.company,
  location: data.location || '',
  salary: data.salary || '',
  type: data.type,
  postedAt: data.posted_at || data.created_at,
  requirements: data.requirements,
  benefits: data.benefits,
  applyUrl: data.link,
  contactEmail: data.contact_email || '',
  remote: data.remote,
  featured: data.featured,
  companyLogo: data.company_logo || '',
  // Additional fields for display
  id: data.id,
  status: data.status,
  viewCount: data.view_count,
  clickCount: data.click_count,
  plan: data.plan,
  active: data.active,
  workplace: data.workplace,
  experience: data.experience,
}));

export type JobContent = z.infer<typeof jobContentSchema>;
