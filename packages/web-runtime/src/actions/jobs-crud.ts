/**
 * Jobs CRUD Actions - Generated from single config
 * 
 * Consolidated create/update/delete actions using createCrudActionHandlers factory.
 * Uses next-safe-action directly with factory helpers for business logic.
 * Eliminates ~200 lines of repetitive boilerplate.
 */

'use server';

import type {
  CreateJobWithPaymentReturns,
  UpdateJobReturns,
  DeleteJobReturns,
} from '@heyclaude/database-types/postgres-types';
import { z } from 'zod';
import {
  jobTypeSchema,
  jobCategorySchema,
  jobPlanSchema,
  jobTierSchema,
  workplaceTypeSchema,
  experience_levelSchema,
} from '@heyclaude/web-runtime/prisma-zod-schemas';
import { createCrudActionHandlers } from './action-factory';
import { authedAction } from './safe-action';

// Schemas
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

const updateJobSchema = z.object({
  job_id: z.string().uuid(),
  updates: z.any(),
});

const deleteJobSchema = z.object({
  job_id: z.string().uuid(),
});

// Export input type (can't export from 'use server' files, but types are OK)
export type CreateJobInput = z.infer<typeof createJobSchema>;

// Generate CRUD action handlers
const crudHandlers = createCrudActionHandlers<
  z.infer<typeof createJobSchema>,
  z.infer<typeof updateJobSchema>,
  z.infer<typeof deleteJobSchema>,
  CreateJobWithPaymentReturns,
  UpdateJobReturns,
  DeleteJobReturns
>({
  resource: 'job',
  category: 'content',
  schemas: {
    create: createJobSchema,
    update: updateJobSchema,
    delete: deleteJobSchema,
  },
  rpcs: {
    create: 'create_job_with_payment',
    update: 'update_job',
    delete: 'delete_job',
  },
  transformArgs: {
    create: (input, ctx) => ({
      'p_user_id': ctx.userId,
      'p_job_data': {
        'company': input.company,
        'company_id': input.company_id,
        'title': input.title,
        'description': input.description,
        'type': input.type,
        'category': input.category,
        'link': input.link,
        'location': input.location,
        'salary': input.salary,
        'remote': input.remote,
        'workplace': input.workplace,
        'experience': input.experience,
        'tags': input.tags,
        'requirements': input.requirements,
        'benefits': input.benefits,
        'contact_email': input.contact_email,
        'company_logo': input.company_logo,
      },
      'p_tier': input.tier,
      'p_plan': input.plan,
    }),
    update: (input, ctx) => ({
      'p_job_id': input.job_id,
      'p_user_id': ctx.userId,
      'p_updates': input.updates,
    }),
    delete: (input, ctx) => ({
      'p_job_id': input.job_id,
      'p_user_id': ctx.userId,
    }),
  },
  cacheInvalidation: {
    create: {
      paths: ['/jobs', '/account/jobs'],
      tags: (result) => {
        const r = result as CreateJobWithPaymentReturns;
        return [
          ...(r?.job_id ? [`job-${r.job_id}`] : []),
          ...(r?.company_id ? [`company-${r.company_id}`, `company-id-${r.company_id}`] : []),
          'jobs',
          'companies',
        ];
      },
    },
    update: {
      paths: (_result, args) => {
        const a = args as z.infer<typeof updateJobSchema> | undefined;
        return [
          '/account/jobs',
          ...(a?.job_id ? [`/account/jobs/${a.job_id}/edit`] : []),
          '/jobs',
        ];
      },
      tags: (_result, args) => {
        const a = args as z.infer<typeof updateJobSchema> | undefined;
        return [
          ...(a?.job_id ? [`job-${a.job_id}`] : []),
          'jobs',
          'companies',
        ];
      },
    },
    delete: {
      paths: ['/jobs', '/account/jobs'],
      tags: (_result, args) => {
        const a = args as z.infer<typeof deleteJobSchema> | undefined;
        return [
          ...(a?.job_id ? [`job-${a.job_id}`] : []),
          'jobs',
          'companies',
        ];
      },
    },
  },
  hooks: {
    create: [
      {
        name: 'onJobCreated',
        handler: async (result, args, ctx) => {
          const { onJobCreated } = await import('./hooks/job-hooks.ts');
          const hookResult = await onJobCreated(result as CreateJobWithPaymentReturns, ctx, args);
          // Hook returns enriched result with checkoutUrl - cast to match return type
          return hookResult as unknown as CreateJobWithPaymentReturns;
        },
      },
    ],
  },
});

// Export actions using next-safe-action directly
export const createJob = authedAction
  .inputSchema(createJobSchema)
  .metadata({ actionName: 'createJob', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.create(parsedInput, ctx);
  });

export const updateJob = authedAction
  .inputSchema(updateJobSchema)
  .metadata({ actionName: 'updateJob', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.update(parsedInput, ctx);
  });

export const deleteJob = authedAction
  .inputSchema(deleteJobSchema)
  .metadata({ actionName: 'deleteJob', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.delete(parsedInput, ctx);
  });
