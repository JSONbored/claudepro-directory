/**
 * Companies CRUD Actions - Generated from single config
 * 
 * Consolidated create/update/delete actions using createCrudActionHandlers factory.
 * Uses next-safe-action directly with factory helpers for business logic.
 * Eliminates ~200 lines of repetitive boilerplate.
 */

'use server';

import type {
  ManageCompanyReturns,
  DeleteCompanyReturns,
} from '@heyclaude/database-types/postgres-types';
import { z } from 'zod';
import { companySizeSchema } from '@heyclaude/web-runtime/prisma-zod-schemas';
import { createCrudActionHandlers } from './action-factory';
import { authedAction } from './safe-action';

// Schemas
const createCompanySchema = z.object({
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  size: companySizeSchema.nullable().optional(),
  industry: z.string().nullable().optional(),
  using_cursor_since: z.string().nullable().optional(),
});

const updateCompanySchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  size: companySizeSchema.nullable().optional(),
  industry: z.string().nullable().optional(),
  using_cursor_since: z.string().nullable().optional(),
});

const deleteCompanySchema = z.object({
  company_id: z.string().uuid(),
});

// Generate CRUD action handlers
const crudHandlers = createCrudActionHandlers<
  z.infer<typeof createCompanySchema>,
  z.infer<typeof updateCompanySchema>,
  z.infer<typeof deleteCompanySchema>,
  ManageCompanyReturns,
  ManageCompanyReturns,
  DeleteCompanyReturns
>({
  resource: 'company',
  category: 'content',
  schemas: {
    create: createCompanySchema,
    update: updateCompanySchema,
    delete: deleteCompanySchema,
  },
  rpcs: {
    create: 'manage_company',
    update: 'manage_company',
    delete: 'delete_company',
  },
  transformArgs: {
    create: (input, ctx) => ({
      'p_action': 'create',
      'p_user_id': ctx.userId,
      'p_create_data': {
        'name': input.name,
        'slug': input.slug,
        'logo': input.logo,
        'website': input.website,
        'description': input.description,
        'size': input.size,
        'industry': input.industry,
        'using_cursor_since': input.using_cursor_since,
      },
      'p_update_data': null,
    }),
    update: (input, ctx) => ({
      'p_action': 'update',
      'p_user_id': ctx.userId,
      'p_create_data': null,
      'p_update_data': {
        'id': input.id,
        'name': input.name,
        'slug': input.slug,
        'logo': input.logo,
        'website': input.website,
        'description': input.description,
        'size': input.size,
        'industry': input.industry,
        'using_cursor_since': input.using_cursor_since,
      },
    }),
    delete: (input, ctx) => ({
      'p_company_id': input.company_id,
      'p_user_id': ctx.userId,
    }),
  },
  cacheInvalidation: {
    create: {
      paths: ['/account/companies', '/companies'],
      tags: (result) => {
        const r = result as ManageCompanyReturns;
        return [
          ...(r?.company?.slug ? [`company-${r.company.slug}`] : []),
          ...(r?.company?.id ? [`company-id-${r.company.id}`] : []),
          'companies',
        ];
      },
    },
    update: {
      paths: (_result) => {
        const r = _result as ManageCompanyReturns | undefined;
        return [
          '/account/companies',
          ...(r?.company?.slug ? [`/companies/${r.company.slug}`] : []),
          '/companies',
        ];
      },
      tags: (result) => {
        const r = result as ManageCompanyReturns;
        return [
          ...(r?.company?.slug ? [`company-${r.company.slug}`] : []),
          ...(r?.company?.id ? [`company-id-${r.company.id}`] : []),
          'companies',
        ];
      },
    },
    delete: {
      paths: ['/companies', '/account/companies'],
      tags: (_result, args) => {
        const a = args as z.infer<typeof deleteCompanySchema> | undefined;
        return [
          ...(a?.company_id ? [`company-${a.company_id}`, `company-id-${a.company_id}`] : []),
          'companies',
        ];
      },
    },
  },
});

// Export actions using next-safe-action directly
export const createCompany = authedAction
  .inputSchema(createCompanySchema)
  .metadata({ actionName: 'createCompany', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.create(parsedInput, ctx);
  });

export const updateCompany = authedAction
  .inputSchema(updateCompanySchema)
  .metadata({ actionName: 'updateCompany', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.update(parsedInput, ctx);
  });

export const deleteCompany = authedAction
  .inputSchema(deleteCompanySchema)
  .metadata({ actionName: 'deleteCompany', category: 'content' })
  .action(async ({ parsedInput, ctx }) => {
    return crudHandlers.delete(parsedInput, ctx);
  });
