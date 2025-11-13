'use server';

/**
 * Companies Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions (manage_company, delete_company)
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import { createClient } from '@/src/lib/supabase/server';

// Minimal Zod schemas - database CHECK constraints do real validation
const companyDataSchema = z.object({
  name: z.string(),
  logo: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  using_cursor_since: z.string().optional().nullable(),
});

const updateCompanySchema = companyDataSchema.extend({
  id: z.string().uuid(),
});

const deleteCompanySchema = z.object({
  company_id: z.string().uuid(),
});

// Export inferred types
export type CreateCompanyInput = z.infer<typeof companyDataSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// =====================================================
// COMPANY CRUD ACTIONS
// =====================================================

/**
 * Create new company
 * Calls manage_company RPC with 'create' action
 */
export const createCompany = authedAction
  .metadata({ actionName: 'createCompany', category: 'content' })
  .schema(companyDataSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const supabase = await createClient();

      // Call RPC function (handles slug generation, validation)
      const { data, error } = await supabase.rpc('manage_company', {
        p_action: 'create',
        p_user_id: ctx.userId,
        p_data: parsedInput,
      });

      if (error) {
        logger.error('Failed to create company via RPC', new Error(error.message), {
          userId: ctx.userId,
          name: parsedInput.name,
        });
        throw new Error(error.message);
      }

      const result = data as unknown as {
        success: boolean;
        company: {
          id: string;
          name: string;
          slug: string;
          [key: string]: unknown;
        };
      };

      if (!result.success) {
        throw new Error('Company creation failed');
      }

      logger.info('Company created successfully', {
        userId: ctx.userId,
        companyId: result.company.id,
        companyName: result.company.name,
      });

      revalidatePath('/account/companies');
      revalidatePath('/companies');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.company_create'] as string[];
      revalidateCacheTags(invalidateTags);

      return {
        success: true,
        companyId: result.company.id,
        company: result.company,
      };
    } catch (error) {
      logger.error(
        'Failed to create company',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: ctx.userId,
          name: parsedInput.name,
        }
      );
      throw error;
    }
  });

/**
 * Update existing company
 * Calls manage_company RPC with 'update' action + ownership verification
 */
export const updateCompany = authedAction
  .metadata({ actionName: 'updateCompany', category: 'content' })
  .schema(updateCompanySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const supabase = await createClient();
      const { id, ...updates } = parsedInput;

      // Call RPC function (handles ownership check, validation)
      const { data, error } = await supabase.rpc('manage_company', {
        p_action: 'update',
        p_user_id: ctx.userId,
        p_data: { id, ...updates },
      });

      if (error) {
        logger.error('Failed to update company via RPC', new Error(error.message), {
          userId: ctx.userId,
          companyId: id,
        });
        throw new Error(error.message);
      }

      const result = data as unknown as {
        success: boolean;
        company: {
          id: string;
          name: string;
          slug: string;
          [key: string]: unknown;
        };
      };

      if (!result.success) {
        throw new Error('Company update failed');
      }

      logger.info('Company updated successfully', {
        userId: ctx.userId,
        companyId: result.company.id,
      });

      revalidatePath('/account/companies');
      revalidatePath(`/companies/${result.company.slug}`);
      revalidatePath('/companies');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.company_update'] as string[];
      revalidateCacheTags(invalidateTags);

      return {
        success: true,
        companyId: result.company.id,
        company: result.company,
      };
    } catch (error) {
      logger.error(
        'Failed to update company',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: ctx.userId,
          companyId: parsedInput.id,
        }
      );
      throw error;
    }
  });

/**
 * Delete company (soft delete)
 * Calls delete_company RPC with ownership verification + active jobs check
 */
export const deleteCompany = authedAction
  .metadata({ actionName: 'deleteCompany', category: 'content' })
  .schema(deleteCompanySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const supabase = await createClient();

      // Call RPC function (handles ownership check, active jobs check, soft delete)
      const { data, error } = await supabase.rpc('delete_company', {
        p_company_id: parsedInput.company_id,
        p_user_id: ctx.userId,
      });

      if (error) {
        logger.error('Failed to delete company via RPC', new Error(error.message), {
          userId: ctx.userId,
          companyId: parsedInput.company_id,
        });
        throw new Error(error.message);
      }

      const result = data as unknown as {
        success: boolean;
        company_id: string;
      };

      if (!result.success) {
        throw new Error('Company deletion failed');
      }

      logger.info('Company deleted successfully', {
        userId: ctx.userId,
        companyId: result.company_id,
      });

      revalidatePath('/account/companies');
      revalidatePath('/companies');

      // Statsig-powered cache invalidation
      const config = await cacheConfigs();
      const invalidateTags = config['cache.invalidate.company_delete'] as string[];
      revalidateCacheTags(invalidateTags);

      return {
        success: true,
        companyId: result.company_id,
      };
    } catch (error) {
      logger.error(
        'Failed to delete company',
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: ctx.userId,
          companyId: parsedInput.company_id,
        }
      );
      throw error;
    }
  });
