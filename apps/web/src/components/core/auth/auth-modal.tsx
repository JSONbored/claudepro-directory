'use client';

/**
 * Auth Modal Component
 *
 * Modern authentication modal with 3D perspective animations, backdrop blur,
 * and contextual value propositions. Integrates with existing OAuth flow.
 *
 * Features:
 * - 3D perspective entry/exit animations (premium feel)
 * - Backdrop blur with fade transitions
 * - Spring physics for natural motion
 * - Contextual value propositions
 * - Newsletter opt-in support
 * - Smart redirect handling
 * - Accessibility (focus trap, keyboard navigation)
 * - Reduced motion support
 *
 * @module apps/web/src/components/core/auth/auth-modal
 */

import { VALID_PROVIDERS } from '@heyclaude/web-runtime';
import { ensureString } from '@heyclaude/web-runtime/core';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { NewsletterOptInTile } from '@/src/components/core/auth/newsletter-opt-in-tile';
import { OAuthProviderButton } from '@/src/components/core/auth/oauth-provider-button';
import {
  formatSubscriberCount,
  loadNewsletterConfig,
} from '@/src/components/features/growth/newsletter/newsletter-utils';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';

export interface AuthModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Contextual value proposition (e.g., "Sign in to save this for later") */
  valueProposition?: string;
  /** Optional redirect path after authentication */
  redirectTo?: string | undefined;
}

/**
 * Spring configuration for 3D modal animations
 * Optimized for premium feel with natural motion
 */
const modalSpring = SPRING.modal;

/**
 * Auth Modal Component
 *
 * Renders a beautiful, animated authentication modal with OAuth provider buttons,
 * newsletter opt-in, and contextual messaging. Uses 3D perspective animations
 * for a premium feel.
 */
export function AuthModal({
  open,
  onOpenChange,
  valueProposition = 'Sign in to continue',
  redirectTo,
}: AuthModalProps) {
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [newsletterConfig, setNewsletterConfig] = useState<Record<string, unknown>>({});
  const { count, isLoading } = useNewsletterCount();
  const subscriberCountLabel = useMemo(() => formatSubscriberCount(count), [count]);

  // Determine redirect path - use provided redirectTo, or current pathname with search params
  // Lazy-load pathname/searchParams to avoid blocking render
  const finalRedirectTo = useMemo(() => {
    if (redirectTo) return redirectTo;
    // Access route data lazily only when modal is open and redirectTo is not provided
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const search = window.location.search;
      return search ? `${pathname}${search}` : pathname;
    }
    return undefined;
  }, [redirectTo]);

  // Load newsletter config
  useEffect(() => {
    if (!open) return; // Only load when modal is open

    let cancelled = false;
    loadNewsletterConfig()
      .then((config) => {
        if (!cancelled) {
          setNewsletterConfig(config);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const normalized = normalizeError(error, 'Failed to load newsletter config');
          logClientWarn(
            '[Config] Failed to load newsletter config',
            normalized,
            'AuthModal.loadNewsletterConfig',
            {
              component: 'AuthModal',
              action: 'load-newsletter-config',
              category: 'config',
            }
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Memoize newsletter tile properties
  const tileProperties = useMemo(() => {
    const tileHeadline = ensureString(
      newsletterConfig['newsletter.login_tile.headline'],
      'Your weekly Claude upgrade drop'
    );
    const tileDescription = ensureString(
      newsletterConfig['newsletter.login_tile.description'],
      'New MCP servers, pro prompts, and community playbooks — no fluff, just signal.'
    );
    const tileBenefits = [
      ensureString(newsletterConfig['newsletter.login_tile.benefit_primary']),
      ensureString(newsletterConfig['newsletter.login_tile.benefit_secondary']),
    ].filter(Boolean);
    const tileSafety = ensureString(
      newsletterConfig['newsletter.login_tile.safety'],
      'No spam. Unsubscribe anytime.'
    );
    const badgePrefix = ensureString(
      newsletterConfig['newsletter.login_tile.badge_prefix'],
      '✨ Trusted by'
    );
    return { tileHeadline, tileDescription, tileBenefits, tileSafety, badgePrefix };
  }, [newsletterConfig]);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animation config - disable animations if user prefers reduced motion
  const animationConfig = prefersReducedMotion
    ? { duration: 0 }
    : {
        initial: {
          opacity: 0,
          scale: 0.5,
          rotateX: 40,
          y: 40,
        },
        animate: {
          opacity: 1,
          scale: 1,
          rotateX: 0,
          y: 0,
        },
        exit: {
          opacity: 0,
          scale: 0.8,
          rotateX: 10,
        },
        transition: modalSpring,
      };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent
            className="sm:max-w-md"
            onPointerDownOutside={(e) => {
              // Allow closing on outside click
              e.preventDefault();
            }}
            onEscapeKeyDown={() => {
              onOpenChange(false);
            }}
            asChild
          >
            <motion.div
              {...animationConfig}
              style={{
                perspective: prefersReducedMotion ? 'none' : 800,
                transformStyle: 'preserve-3d',
              }}
              className="relative"
            >
              <DialogHeader>
                <DialogTitle>Sign in</DialogTitle>
                <DialogDescription>{valueProposition}</DialogDescription>
              </DialogHeader>

              {/* OAuth Provider Buttons */}
              <div className="flex items-center justify-center gap-4 py-6">
                {VALID_PROVIDERS.map((provider) => (
                  <OAuthProviderButton
                    key={provider}
                    provider={provider}
                    redirectTo={finalRedirectTo}
                    newsletterOptIn={newsletterOptIn}
                  />
                ))}
              </div>

              {/* Newsletter Opt-In Tile */}
              <div className="mt-4">
                <NewsletterOptInTile
                  checked={newsletterOptIn}
                  onChange={setNewsletterOptIn}
                  subscriberCountLabel={subscriberCountLabel}
                  isLoadingCount={isLoading}
                  headline={tileProperties.tileHeadline}
                  safetyCopy={tileProperties.tileSafety}
                  badgePrefix={tileProperties.badgePrefix}
                />
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
