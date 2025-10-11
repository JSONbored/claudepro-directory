'use server';

/**
 * Company Actions
 * Server actions for company profile management
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
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

    // Build insert object conditionally to handle exactOptionalPropertyTypes
    // Generate slug from name if not provided (database requires slug)
    const generatedSlug =
      parsedInput.slug ??
      parsedInput.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const insertData: {
      owner_id: string;
      name: string;
      slug: string;
      logo?: string | null;
      website?: string | null;
      description?: string | null;
      size?: string | null;
      industry?: string | null;
      using_cursor_since?: string | null;
    } = {
      owner_id: user.id,
      name: parsedInput.name,
      slug: generatedSlug,
    };

    if (parsedInput.logo !== undefined) insertData.logo = parsedInput.logo;
    if (parsedInput.website !== undefined) insertData.website = parsedInput.website;
    if (parsedInput.description !== undefined) insertData.description = parsedInput.description;
    if (parsedInput.size !== undefined) insertData.size = parsedInput.size;
    if (parsedInput.industry !== undefined) insertData.industry = parsedInput.industry;
    if (parsedInput.using_cursor_since !== undefined)
      insertData.using_cursor_since = parsedInput.using_cursor_since;

    const { data, error } = await supabase.from('companies').insert(insertData).select().single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A company with this name already exists');
      }
      throw new Error(error.message);
    }

    revalidatePath('/companies');
    revalidatePath('/account/companies');

    return {
      success: true,
      company: data,
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

    // Build update object conditionally to handle exactOptionalPropertyTypes
    const updateData: {
      name?: string;
      logo?: string | null;
      website?: string | null;
      description?: string | null;
      size?: string | null;
      industry?: string | null;
      using_cursor_since?: string | null;
    } = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.logo !== undefined) updateData.logo = updates.logo;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.size !== undefined) updateData.size = updates.size;
    if (updates.industry !== undefined) updateData.industry = updates.industry;
    if (updates.using_cursor_since !== undefined)
      updateData.using_cursor_since = updates.using_cursor_since;

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

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

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
