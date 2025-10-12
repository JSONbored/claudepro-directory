'use server';

/**
 * Company Actions
 * Server actions for company profile management
 *
 * Refactored to use Repository pattern for cleaner separation of concerns.
 * All database operations delegated to CompanyRepository.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { type Company, companyRepository } from '@/src/lib/repositories/company.repository';
import { nonEmptyString, slugString, urlString } from '@/src/lib/schemas/primitives/base-strings';
import { createClient } from '@/src/lib/supabase/server';

// Company schema
const createCompanySchema = z.object({
  name: nonEmptyString.min(2).max(200),
  slug: slugString.optional(),
  logo: urlString.nullable().optional(),
  website: urlString.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional(),
  industry: nonEmptyString.max(100).nullable().optional(),
  using_cursor_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: nonEmptyString.min(2).max(200).optional(),
  logo: urlString.nullable().optional(),
  website: urlString.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional(),
  industry: nonEmptyString.max(100).nullable().optional(),
  using_cursor_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

/**
 * Create a new company profile
 */
export const createCompany = rateLimitedAction
  .metadata({
    actionName: 'createCompany',
    category: 'user',
  })
  .schema(createCompanySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to create a company profile');
    }

    // Generate slug from name if not provided
    const generatedSlug =
      parsedInput.slug ??
      parsedInput.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    // Create via repository (includes caching and automatic error handling)
    const result = await companyRepository.create({
      owner_id: user.id,
      name: parsedInput.name,
      slug: generatedSlug,
      logo: parsedInput.logo ?? null,
      website: parsedInput.website ?? null,
      description: parsedInput.description ?? null,
      size: parsedInput.size ?? null,
      industry: parsedInput.industry ?? null,
      using_cursor_since: parsedInput.using_cursor_since ?? null,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create company');
    }

    revalidatePath('/companies');
    revalidatePath('/account/companies');

    return {
      success: true,
      company: result.data,
    };
  });

/**
 * Update a company profile (owner only)
 */
export const updateCompany = rateLimitedAction
  .metadata({
    actionName: 'updateCompany',
    category: 'user',
  })
  .schema(updateCompanySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to update companies');
    }

    const { id, ...updates } = parsedInput;

    // Filter out undefined values to avoid exactOptionalPropertyTypes issues
    const updateData = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<Company>;

    // Update via repository with ownership verification (includes caching)
    const result = await companyRepository.updateByOwner(id, user.id, updateData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update company');
    }

    if (!result.data) {
      throw new Error('Company data not returned');
    }

    const data = result.data;

    revalidatePath('/companies');
    revalidatePath(`/companies/${data.slug}`);
    revalidatePath('/account/companies');

    return {
      success: true,
      company: data,
    };
  });

/**
 * Get user's companies
 */
export async function getUserCompanies() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch via repository (includes caching)
  const result = await companyRepository.findByOwner(user.id, {
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user companies');
  }

  return result.data || [];
}
