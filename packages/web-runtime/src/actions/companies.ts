'use server';

/**
 * Companies Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC functions (manage_company, delete_company)
 */

import { createSupabaseAdminClient } from '../supabase/admin.ts';
import { logActionFailure } from '../errors.ts';
import { authedAction, rateLimitedAction } from './safe-action.ts';
import {
  uploadImageToStorage,
  deleteImageFromStorage,
} from '../storage/image-storage.ts';
import {
  validateImageBuffer,
  extractPathFromUrl,
  IMAGE_CONFIG,
} from '../storage/image-utils.ts';
import { getCompanyAdminProfile, searchCompanies } from '../data/companies.ts';
import { z } from 'zod';

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

export const searchCompaniesAction = authedAction
  .metadata({ actionName: 'searchCompanies', category: 'content' })
  .inputSchema(companySearchSchema)
  .action(async ({ parsedInput }) => {
    try {
      const limit = parsedInput.limit ?? 10;
      const companies = await searchCompanies(parsedInput.query, limit);
      
      // Lazy import feature flags to avoid module-level server-only code execution
      const { getTimeoutConfigValue } = await import('./feature-flags.ts');
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

// Removed createCompany, updateCompany, deleteCompany - migrated to generated actions
