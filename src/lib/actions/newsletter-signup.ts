'use server';

/**
 * Newsletter Signup - Database-First Architecture
 * Database trigger handles: welcome email + sequence enrollment
 */

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { publicNewsletterSubscriptionsInsertSchema } from '@/src/lib/schemas/generated/db-schemas';
import { normalizeEmail } from '@/src/lib/schemas/primitives/sanitization-transforms';
import { createClient } from '@/src/lib/supabase/server';

export const subscribeToNewsletter = rateLimitedAction
  .metadata({ actionName: 'subscribeToNewsletter', category: 'form' })
  .schema(
    publicNewsletterSubscriptionsInsertSchema.pick({
      email: true,
      source: true,
      referrer: true,
    })
  )
  .action(async ({ parsedInput: { email, source, referrer } }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: normalizeEmail(email),
        source: source ?? null,
        referrer: referrer ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
    // Database trigger automatically handles: welcome email + sequence enrollment
  });
