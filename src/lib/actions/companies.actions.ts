'use server';

/**
 * Companies Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions (manage_company, delete_company)
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { invalidateByKeys, runRpc } from '@/src/lib/actions/action-helpers';
import { getTimeoutConfigValue } from '@/src/lib/actions/feature-flags.actions';
import { authedAction, rateLimitedAction } from '@/src/lib/actions/safe-action';
import { getCompanyAdminProfile } from '@/src/lib/data/companies/admin';
import { searchCompanies } from '@/src/lib/data/companies/public';
import type { CacheInvalidateKey } from '@/src/lib/data/config/cache-config';
import { logger } from '@/src/lib/logger';
import {
  deleteImageFromStorage,
  extractPathFromUrl,
  IMAGE_CONFIG,
  uploadImageToStorage,
  validateImageBuffer,
} from '@/src/lib/storage/image-storage';
import { createClient as createSupabaseAdminClient } from '@/src/lib/supabase/admin-client';
import { logActionFailure } from '@/src/lib/utils/error.utils';

// UUID validation helper
const uuidRefine = (val: string | null | undefined) => {
  if (val === null || val === undefined || val === '') return true; // Allow null/empty for optional
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
};

// URL validation helper
const urlRefine = (val: string | null | undefined) => {
  if (val === null || val === undefined || val === '') return true; // Allow null/empty for optional
  try {
    const url = new URL(val);
    // Check protocol is http or https
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Minimal Zod schemas - database CHECK constraints do real validation
const companyDataSchema = z.object({
  name: z.string(),
  logo: z.string().refine(urlRefine, { message: 'Invalid URL format' }).optional().nullable(),
  website: z.string().refine(urlRefine, { message: 'Invalid URL format' }).optional().nullable(),
  description: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  using_cursor_since: z.string().optional().nullable(),
});

const updateCompanySchema = companyDataSchema.extend({
  id: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }),
});

const deleteCompanySchema = z.object({
  company_id: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }),
});

const companySearchSchema = z.object({
  query: z.string().min(2).max(100),
  limit: z.number().int().min(1).max(20).optional(),
});

const uploadLogoSchema = z.object({
  fileName: z.string().min(1).max(256),
  mimeType: z.enum(IMAGE_CONFIG.ALLOWED_TYPES),
  fileBase64: z.string().min(1),
  companyId: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }).optional(),
  oldLogoUrl: z.string().refine(urlRefine, { message: 'Invalid URL format' }).optional(),
});

// Export inferred types
export type CreateCompanyInput = z.infer<typeof companyDataSchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

async function invalidateCompanyCaches(options: {
  keys?: CacheInvalidateKey[];
  extraTags?: string[];
}) {
  await invalidateByKeys({
    ...(options.keys ? { invalidateKeys: options.keys } : {}),
    ...(options.extraTags ? { extraTags: options.extraTags } : {}),
  });
}

// =====================================================
// COMPANY CRUD ACTIONS
// =====================================================

/**
 * Create new company
 * Calls manage_company RPC with 'create' action
 */
export const createCompany = authedAction
  .metadata({ actionName: 'createCompany', category: 'content' })
  .inputSchema(companyDataSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type ManageCompanyCreateResult = {
        success: boolean;
        company: {
          id: string;
          name: string;
          slug: string;
          [key: string]: unknown;
        };
      };

      const result = await runRpc<ManageCompanyCreateResult>(
        'manage_company',
        {
          p_action: 'create',
          p_user_id: ctx.userId,
          p_data: parsedInput,
        },
        {
          action: 'companies.createCompany.rpc',
          userId: ctx.userId,
          meta: { name: parsedInput.name },
        }
      );

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

      await invalidateCompanyCaches({
        keys: ['cache.invalidate.company_create'],
      });
      revalidateTag(`company-${result.company.slug}`, 'default');
      revalidateTag(`company-id-${result.company.id}`, 'default');

      return {
        success: true,
        companyId: result.company.id,
        company: result.company,
      };
    } catch (error) {
      throw logActionFailure('companies.createCompany', error, {
        userId: ctx.userId,
        name: parsedInput.name,
      });
    }
  });

/**
 * Update existing company
 * Calls manage_company RPC with 'update' action + ownership verification
 */
export const updateCompany = authedAction
  .metadata({ actionName: 'updateCompany', category: 'content' })
  .inputSchema(updateCompanySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { id, ...updates } = parsedInput;

      type ManageCompanyUpdateResult = {
        success: boolean;
        company: {
          id: string;
          name: string;
          slug: string;
          [key: string]: unknown;
        };
      };

      const result = await runRpc<ManageCompanyUpdateResult>(
        'manage_company',
        {
          p_action: 'update',
          p_user_id: ctx.userId,
          p_data: { id, ...updates },
        },
        {
          action: 'companies.updateCompany.rpc',
          userId: ctx.userId,
          meta: { companyId: id },
        }
      );

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

      await invalidateCompanyCaches({
        keys: ['cache.invalidate.company_update'],
      });
      revalidateTag(`company-${result.company.slug}`, 'default');
      revalidateTag(`company-id-${result.company.id}`, 'default');

      return {
        success: true,
        companyId: result.company.id,
        company: result.company,
      };
    } catch (error) {
      throw logActionFailure('companies.updateCompany', error, {
        userId: ctx.userId,
        companyId: parsedInput.id,
      });
    }
  });

/**
 * Delete company (soft delete)
 * Calls delete_company RPC with ownership verification + active jobs check
 */
export const deleteCompany = authedAction
  .metadata({ actionName: 'deleteCompany', category: 'content' })
  .inputSchema(deleteCompanySchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      type DeleteCompanyResult = {
        success: boolean;
        company_id: string;
      };

      const result = await runRpc<DeleteCompanyResult>(
        'delete_company',
        {
          p_company_id: parsedInput.company_id,
          p_user_id: ctx.userId,
        },
        {
          action: 'companies.deleteCompany.rpc',
          userId: ctx.userId,
          meta: { companyId: parsedInput.company_id },
        }
      );

      if (!result.success) {
        throw new Error('Company deletion failed');
      }

      logger.info('Company deleted successfully', {
        userId: ctx.userId,
        companyId: result.company_id,
      });

      revalidatePath('/account/companies');
      revalidatePath('/companies');

      await invalidateCompanyCaches({
        keys: ['cache.invalidate.company_delete'],
      });
      revalidateTag(`company-${parsedInput.company_id}`, 'default');
      revalidateTag(`company-id-${parsedInput.company_id}`, 'default');

      return {
        success: true,
        companyId: result.company_id,
      };
    } catch (error) {
      throw logActionFailure('companies.deleteCompany', error, {
        userId: ctx.userId,
        companyId: parsedInput.company_id,
      });
    }
  });

export const searchCompaniesAction = authedAction
  .metadata({ actionName: 'searchCompanies', category: 'content' })
  .inputSchema(companySearchSchema)
  .action(async ({ parsedInput }) => {
    try {
      const limit = parsedInput.limit ?? 10;
      const companies = await searchCompanies(parsedInput.query, limit);
      const debounceResult = await getTimeoutConfigValue({ key: 'timeout.ui.form_debounce_ms' });
      const debounceMs = debounceResult?.data ?? 300;

      return { companies, debounceMs };
    } catch (error) {
      throw logActionFailure('companies.searchCompanies', error, {
        query: parsedInput.query,
      });
    }
  });

/**
 * Get company by ID
 * Public action - no authentication required
 */
export const getCompanyByIdAction = rateLimitedAction
  .inputSchema(
    z.object({ companyId: z.string().refine(uuidRefine, { message: 'Invalid UUID format' }) })
  )
  .metadata({ actionName: 'companies.getCompanyById', category: 'content' })
  .action(async ({ parsedInput }) => {
    try {
      const profile = await getCompanyAdminProfile(parsedInput.companyId);
      if (!profile) {
        // Return null instead of throwing - safe-action middleware handles logging
        return null;
      }

      return {
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        logo: profile.logo,
        website: profile.website,
        description: profile.description,
      };
    } catch {
      // Fallback to null on error (safe-action middleware handles logging)
      return null;
    }
  });

export const uploadCompanyLogoAction = authedAction
  .metadata({ actionName: 'uploadCompanyLogo', category: 'content' })
  .inputSchema(uploadLogoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { companyId, oldLogoUrl, fileBase64, fileName, mimeType } = parsedInput;

    const buffer = Buffer.from(fileBase64, 'base64');
    const validation = validateImageBuffer(buffer, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file');
    }

    if (companyId) {
      const company = await getCompanyAdminProfile(companyId);
      if (!company) {
        throw new Error('Company not found.');
      }

      if (company.owner_id !== ctx.userId) {
        throw new Error('You do not have permission to manage this company.');
      }
    }

    try {
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
    } catch (error) {
      throw logActionFailure('companies.uploadCompanyLogo', error, {
        userId: ctx.userId,
        companyId: companyId ?? 'unassigned',
        fileName,
        mimeType,
      });
    }
  });
