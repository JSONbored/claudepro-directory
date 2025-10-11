'use client';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import type { NewsletterSource } from '@/src/hooks/use-newsletter';
import { useNewsletter } from '@/src/hooks/use-newsletter';
import { Mail } from '@/src/lib/icons';

/**
 * Newsletter signup form component
 *
 * Refactored to use centralized useNewsletter hook for consistent behavior.
 *
 * Features:
 * - Server Action integration with useTransition for pending states
 * - Client-side form reset on success
 * - Toast notifications via Sonner
 * - Accessible form with proper labels
 * - Loading states during submission
 * - Error handling with user-friendly messages
 *
 * Usage:
 * ```tsx
 * <NewsletterForm source="footer" />
 * <NewsletterForm source="homepage" className="max-w-md" />
 * ```
 */
export function NewsletterForm({
  source = 'inline',
  className,
}: {
  source?: NewsletterSource;
  className?: string;
}) {
  const { email, setEmail, isSubmitting, subscribe } = useNewsletter({
    source,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await subscribe();
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
          className="flex-1"
          aria-label="Email address"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>Subscribing...</>
          ) : (
            <>
              Subscribe
              <Mail className="ml-2 h-4 w-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
