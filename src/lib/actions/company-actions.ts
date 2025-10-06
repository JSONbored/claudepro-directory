'use server';

/**
 * Company Actions
 * Server actions for company profile management
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { createClient } from '@/src/lib/supabase/server';
import { nonEmptyString, slugString, urlString } from '@/src/lib/schemas/primitives/base-strings';
import { revalidatePath } from 'next/cache';

// Company schema
const createCompanySchema = z.object({
  name: nonEmptyString.min(2).max(200),
  slug: slugString.optional(),
  logo: urlString.nullable().optional(),
  website: urlString.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional(),
  industry: nonEmptyString.max(100).nullable().optional(),
  using_cursor_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: nonEmptyString.min(2).max(200).optional(),
  logo: urlString.nullable().optional(),
  website: urlString.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).nullable().optional(),
  industry: nonEmptyString.max(100).nullable().optional(),
  using_cursor_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
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
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be signed in to create a company profile');
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        owner_id: user.id,
        ...parsedInput,
      })
      .select()
      .single();

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
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be signed in to update companies');
    }

    const { id, ...updates } = parsedInput;

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
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
  
  const { data: { user } } = await supabase.auth.getUser();
  
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
