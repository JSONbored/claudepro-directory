'use server';

/**
 * Contact Form Server Actions - Database-First Architecture
 * Thin orchestration layer calling PostgreSQL RPC function (insert_contact_submission)
 */

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime';
import { logActionFailure, logger, nextInvalidateByKeys, runRpc } from '@heyclaude/web-runtime';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

// Use enum values directly from @heyclaude/database-types Constants
const CONTACT_CATEGORY_VALUES = Constants.public.Enums.contact_category;

// Email validation helper
const emailRefine = (val: string) => {
  try {
    const parts = val.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local) return false;
    if (!domain) return false;
    if (!domain.includes('.')) return false;
    if (val.includes(' ')) return false;
    return true;
  } catch {
    return false;
  }
};

// Minimal Zod schema - database CHECK constraints do real validation
const contactFormSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().refine(emailRefine, { message: 'Invalid email address' }),
  category: z.enum([...CONTACT_CATEGORY_VALUES] as [
    Database['public']['Enums']['contact_category'],
    ...Database['public']['Enums']['contact_category'][],
  ]),
  message: z.string().min(10).max(5000),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Export inferred type
export type SubmitContactFormInput = z.infer<typeof contactFormSchema>;

interface SubmitContactFormResult {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Submit contact form (PUBLIC - no authentication required)
 * Calls insert_contact_submission RPC + triggers email via edge function
 */
export async function submitContactForm(
  params: SubmitContactFormInput
): Promise<SubmitContactFormResult> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    logger.error(
      'submitContactForm missing NEXT_PUBLIC_SUPABASE_URL env',
      new Error('Missing NEXT_PUBLIC_SUPABASE_URL'),
      {
        action: 'submitContactForm',
        envVar: 'NEXT_PUBLIC_SUPABASE_URL',
        phase: 'validation',
      }
    );
    return { success: false, error: 'Configuration error' };
  }

  // Validate with Zod schema
  const validation = contactFormSchema.safeParse(params);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return {
      success: false,
      error: firstError?.message || 'Invalid input',
    };
  }

  const validatedData = validation.data;

  try {
    // Insert submission via RPC function (consistent with companies/jobs pattern)
    type InsertContactResult = {
      success: boolean;
      submission_id: string;
    };

    const result = await runRpc<InsertContactResult>(
      'insert_contact_submission',
      {
        p_name: validatedData.name,
        p_email: validatedData.email,
        p_category: validatedData.category,
        p_message: validatedData.message,
        p_metadata: validatedData.metadata ?? {},
      },
      {
        action: 'contact.submitContactForm.rpc',
        meta: { category: validatedData.category },
      }
    );

    if (!result.success) {
      throw new Error('Contact submission failed');
    }

    logger.info('Contact submission saved successfully', {
      submissionId: result.submission_id,
      category: validatedData.category,
    });

    // Then, trigger emails via edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/email-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email-Action': 'contact-submission',
      },
      body: JSON.stringify({
        submissionId: result.submission_id,
        name: validatedData.name,
        email: validatedData.email,
        category: validatedData.category,
        message: validatedData.message,
      }),
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    const emailResult = (await response.json()) as { success?: boolean; error?: string };

    if (!(response.ok && emailResult?.success)) {
      const errorMessage = emailResult?.error || response.statusText || 'Email sending failed';
      logger.warn('submitContactForm email failed (submission saved)', {
        status: response.status,
        error: errorMessage,
        submissionId: result.submission_id,
      });
      // Return success anyway since DB insert worked
    }

    // Invalidate Next.js paths (if admin dashboard exists in future)
    revalidatePath('/admin/contact-submissions');

    // Statsig-powered cache invalidation
    await nextInvalidateByKeys({
      invalidateKeys: ['cache.invalidate.contact_submission'],
    });

    // Specific submission tag
    revalidateTag(`contact-submission-${result.submission_id}`, 'default');

    return {
      success: true,
      submissionId: result.submission_id,
    };
  } catch (error) {
    return {
      success: false,
      error: logActionFailure('contact.submitContactForm', error, {
        category: validatedData.category,
      }).message,
    };
  }
}
