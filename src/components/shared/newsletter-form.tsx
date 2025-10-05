'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { subscribeToNewsletter } from '@/src/lib/actions/newsletter-signup';
import { Mail } from '@/src/lib/icons';

/**
 * Newsletter signup form component
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
  source?: 'footer' | 'homepage' | 'modal' | 'content_page' | 'inline';
  className?: string;
}) {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    startTransition(async () => {
      const result = await subscribeToNewsletter({
        email,
        source,
        referrer: typeof window !== 'undefined' ? window.location.href : undefined,
      });

      if (result?.data?.success) {
        toast.success('Welcome!', {
          description: "You're now subscribed to our newsletter.",
        });
        setEmail(''); // Reset form on success
      } else {
        // Show specific error message from server or fallback
        const errorMessage =
          result?.data?.message || result?.serverError || 'Please try again later.';
        toast.error('Subscription failed', {
          description: errorMessage,
        });
      }
    });
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
          disabled={isPending}
          className="flex-1"
          aria-label="Email address"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? (
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
