'use server';

/**
 * Companies Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions (manage_company, delete_company)
 */

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { searchCompanies } from '@/src/lib/data/companies';
import { cacheConfigs, timeoutConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import {
  deleteImageFromStorage,
  extractPathFromUrl,
  IMAGE_CONFIG,
  uploadImageToStorage,
  validateImageBuffer,
} from '@/src/lib/storage/image-storage';
import { createClient as createSupabaseAdminClient } from '@/src/lib/supabase/admin-client';
import { revalidateCacheTags } from '@/src/lib/supabase/cache-helpers';
import { createClient as createSupabaseServerClient } from '@/src/lib/supabase/server';

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

const companySearchSchema = z.object({
  query: z.string().min(2).max(100),
  limit: z.number().int().min(1).max(20).optional(),
});

const uploadLogoSchema = z.object({
  fileName: z.string().min(1).max(256),
  mimeType: z.enum(IMAGE_CONFIG.ALLOWED_TYPES),
  fileBase64: z.string().min(1),
  companyId: z.string().uuid().optional(),
  oldLogoUrl: z.string().url().optional(),
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
      const supabase = await createSupabaseServerClient();

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
      revalidateTag(`company-${result.company.slug}`, 'default');
      revalidateTag(`company-id-${result.company.id}`, 'default');

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
      const supabase = await createSupabaseServerClient();
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
      revalidateTag(`company-${result.company.slug}`, 'default');
      revalidateTag(`company-id-${result.company.id}`, 'default');

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
      const supabase = await createSupabaseServerClient();

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
      revalidateTag(`company-${parsedInput.company_id}`, 'default');
      revalidateTag(`company-id-${parsedInput.company_id}`, 'default');

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

export const searchCompaniesAction = authedAction
  .metadata({ actionName: 'searchCompanies', category: 'content' })
  .schema(companySearchSchema)
  .action(async ({ parsedInput }) => {
    try {
      const limit = parsedInput.limit ?? 10;
      const companies = await searchCompanies(parsedInput.query, limit);
      const timeoutConfig = await timeoutConfigs();
      const debounceMs =
        (timeoutConfig['timeout.ui.form_debounce_ms'] as number | undefined) ?? 300;

      return { companies, debounceMs };
    } catch (error) {
      logger.error(
        'Failed to search companies',
        error instanceof Error ? error : new Error(String(error)),
        { query: parsedInput.query }
      );
      throw error;
    }
  });

export async function getCompanyByIdAction(companyId: string) {
  if (!companyId) {
    return null;
  }

  const config = await cacheConfigs();
  const ttl = (config['cache.company_detail.ttl_seconds'] as number) || 1800;

  const fetchCompany = async () => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, slug, logo, website, description')
      .eq('id', companyId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch company by ID', error, { companyId });
      return null;
    }

    return data;
  };

  const cachedLookup = unstable_cache(fetchCompany, [`company-by-id-${companyId}`], {
    revalidate: ttl,
    tags: ['companies', `company-id-${companyId}`],
  });

  return cachedLookup();
}

export const uploadCompanyLogoAction = authedAction
  .metadata({ actionName: 'uploadCompanyLogo', category: 'content' })
  .schema(uploadLogoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { companyId, oldLogoUrl, fileBase64, fileName, mimeType } = parsedInput;

    const buffer = Buffer.from(fileBase64, 'base64');
    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file');
    }

    if (companyId) {
      const supabase = await createSupabaseServerClient();
      const { data: company, error } = await supabase
        .from('companies')
        .select('id, owner_id')
        .eq('id', companyId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to verify company ownership before logo upload', error, {
          companyId,
          userId: ctx.userId,
        });
        throw new Error('Unable to verify company ownership.');
      }

      if (!company) {
        throw new Error('Company not found.');
      }

      if (company.owner_id !== ctx.userId) {
        throw new Error('You do not have permission to manage this company.');
      }
    }

    const supabaseAdmin = await createSupabaseAdminClient();
    const uploadResult = await uploadImageToStorage({
      bucket: 'company-logos',
      data: buffer,
      mimeType,
      userId: ctx.userId,
      fileName,
      supabase: supabaseAdmin,
    });

    if (!(uploadResult.success && uploadResult.publicUrl)) {
      const companyIdForLog = companyId ?? 'unassigned';
      logger.error('Company logo upload failed', new Error(uploadResult.error || 'Upload failed'), {
        userId: ctx.userId,
        companyId: companyIdForLog,
      });
      throw new Error(uploadResult.error || 'Failed to upload logo.');
    }

    if (oldLogoUrl) {
      const existingPath = extractPathFromUrl(oldLogoUrl, 'company-logos');
      if (existingPath) {
        await deleteImageFromStorage('company-logos', existingPath, supabaseAdmin);
      }
    }

    return {
      success: true,
      publicUrl: uploadResult.publicUrl,
      path: uploadResult.path,
    };
  });
