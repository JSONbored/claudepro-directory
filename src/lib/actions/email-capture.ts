'use server';

/**
 * Post-Copy Email Capture - Database-First Architecture
 * Database trigger handles: welcome email + sequence enrollment
 */

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { publicNewsletterSubscriptionsInsertSchema } from '@/src/lib/schemas/generated/db-schemas';
import { normalizeEmail } from '@/src/lib/schemas/primitives/sanitization-transforms';
import { createClient } from '@/src/lib/supabase/server';

export const postCopyEmailCaptureAction = rateLimitedAction
  .metadata({ actionName: 'postCopyEmailCapture', category: 'form' })
  .schema(
    publicNewsletterSubscriptionsInsertSchema.pick({
      email: true,
      source: true,
      referrer: true,
      copy_type: true,
      copy_category: true,
      copy_slug: true,
    })
  )
  .action(
    async ({ parsedInput: { email, source, referrer, copy_type, copy_category, copy_slug } }) => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email: normalizeEmail(email),
          source: source ?? null,
          referrer: referrer ?? null,
          copy_type: copy_type ?? null,
          copy_category: copy_category ?? null,
          copy_slug: copy_slug ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
      // Database trigger automatically handles: welcome email + sequence enrollment
    }
  );
