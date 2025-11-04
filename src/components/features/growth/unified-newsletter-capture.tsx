'use client';

/**
 * Unified Newsletter Capture Component
 *
 * Consolidated newsletter capture component that replaces:
 * - newsletter-form.tsx (basic form)
 * - inline-email-cta.tsx (hero, inline, minimal, card variants)
 * - footer-newsletter-bar.tsx (sticky footer with dismissal)
 * - post-copy-email-modal.tsx (modal with copy tracking)
 *
 * Production Standards:
 * - Type-safe discriminated union for all variants
 * - Centralized useNewsletter hook integration
 * - Consistent analytics tracking across all contexts
 * - Accessibility with ARIA labels and error handling
 * - Responsive layouts for all variants
 * - Toast notifications and loading states
 *
 * Consolidation Benefits:
 * - Single source of truth for all newsletter capture UX
 * - 75% reduction in component files (4 → 1)
 * - Unified prop API across all contexts
 * - Easier maintenance and consistency
 *
 * @module components/features/growth/unified-newsletter-capture
 */

import { usePathname } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { Input } from '@/src/components/primitives/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/primitives/sheet';
import type { NewsletterSource } from '@/src/hooks/use-newsletter';
import { useNewsletter } from '@/src/hooks/use-newsletter';
import { postCopyEmailCaptureAction } from '@/src/lib/actions/email-capture';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/config/category-config';
import { Mail, X } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Copy type for modal tracking context
 */
export type CopyType = 'llmstxt' | 'markdown' | 'code' | 'link';

/**
 * Base props shared across all variants
 */
interface UnifiedNewsletterCaptureBaseProps {
  /** Newsletter source for analytics tracking */
  source: NewsletterSource;
  /** Additional CSS classes */
  className?: string;
  /** Optional content category for contextual messaging */
  category?: string;
}

/**
 * Form variant props - Simple email form (replaces newsletter-form.tsx)
 */
export interface FormVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'form';
}

/**
 * CTA variant props - Contextual CTAs (replaces inline-email-cta.tsx)
 */
export interface CTAVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'hero' | 'inline' | 'minimal' | 'card';
  /** Context for analytics tracking */
  context: string;
  /** Custom headline (overrides default) */
  headline?: string;
  /** Custom description (overrides default) */
  description?: string;
}

/**
 * Footer bar variant props - Sticky footer (replaces footer-newsletter-bar.tsx)
 */
export interface FooterBarVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'footer-bar';
  /** Whether bar is dismissible */
  dismissible?: boolean;
  /** Delay in ms before showing bar */
  showAfterDelay?: number;
  /** Don't show on pages with inline CTA */
  respectInlineCTA?: boolean;
}

/**
 * Modal variant props - Sheet modal (replaces post-copy-email-modal.tsx)
 */
export interface ModalVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'modal';
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Type of content that was copied */
  copyType: CopyType;
  /** Content slug identifier */
  slug?: string;
  /** Optional referrer URL */
  referrer?: string;
}

/**
 * Discriminated union of all UnifiedNewsletterCapture variants
 */
export type UnifiedNewsletterCaptureProps =
  | FormVariantProps
  | CTAVariantProps
  | FooterBarVariantProps
  | ModalVariantProps;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get contextual messaging based on category
 */
function getContextualMessage(category?: string): {
  headline: string;
  description: string;
} {
  const messages = {
    agents: {
      headline: 'Get New AI Agents Weekly',
      description: 'Discover powerful Claude agents delivered to your inbox every week.',
    },
    mcp: {
      headline: 'New MCP Servers Weekly',
      description: 'Never miss a Model Context Protocol integration. Get weekly updates.',
    },
    commands: {
      headline: 'Supercharge Your Workflow',
      description: 'Get new Claude commands and productivity tips in your inbox.',
    },
    rules: {
      headline: 'Master Claude Customization',
      description: 'Weekly updates on rules, configurations, and best practices.',
    },
    hooks: {
      headline: 'Automate with Claude Hooks',
      description: 'Get the latest automation hooks delivered weekly.',
    },
    guides: {
      headline: 'More Guides Like This',
      description: 'Get tutorials, tips, and guides delivered to your inbox weekly.',
    },
    default: {
      headline: NEWSLETTER_CTA_CONFIG.headline,
      description: NEWSLETTER_CTA_CONFIG.description,
    },
  } as const satisfies Record<string, { headline: string; description: string }>;

  if (!(category && category in messages)) {
    return messages.default;
  }

  return messages[category as keyof typeof messages] as {
    headline: string;
    description: string;
  };
}

// =============================================================================
// UNIFIED NEWSLETTER CAPTURE COMPONENT
// =============================================================================

/**
 * UnifiedNewsletterCapture Component
 *
 * All-in-one newsletter capture component with 7 variants:
 * - form: Simple email form
 * - hero: Large prominent CTA for landing pages
 * - inline: Mid-content card for detail pages
 * - minimal: Compact single-line for category pages
 * - card: Grid item for browse pages
 * - footer-bar: Sticky footer with dismissal
 * - modal: Sheet modal for post-copy capture
 *
 * @param props - Variant-specific props
 * @returns Newsletter capture UI for specified variant
 *
 * @example
 * ```tsx
 * // Form variant
 * <UnifiedNewsletterCapture variant="form" source="footer" />
 *
 * // Hero CTA variant
 * <UnifiedNewsletterCapture
 *   variant="hero"
 *   source="homepage"
 *   context="homepage"
 *   category="agents"
 * />
 *
 * // Footer bar variant
 * <UnifiedNewsletterCapture
 *   variant="footer-bar"
 *   source="footer"
 *   dismissible={true}
 *   showAfterDelay={3000}
 * />
 *
 * // Modal variant
 * <UnifiedNewsletterCapture
 *   variant="modal"
 *   source="modal"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   copyType="markdown"
 *   category="agents"
 * />
 * ```
 */
export function UnifiedNewsletterCapture(props: UnifiedNewsletterCaptureProps) {
  const { variant, source, className, category } = props;

  // =============================================================================
  // FORM VARIANT
  // =============================================================================

  if (variant === 'form') {
    return <FormVariant source={source} {...(className && { className })} />;
  }

  // =============================================================================
  // CTA VARIANTS (hero, inline, minimal, card)
  // =============================================================================

  if (variant === 'hero' || variant === 'inline' || variant === 'minimal' || variant === 'card') {
    const { headline, description } = props;
    const { headline: defaultHeadline, description: defaultDescription } =
      getContextualMessage(category);
    const finalHeadline = headline || defaultHeadline;
    const finalDescription = description || defaultDescription;

    // Hero Variant
    if (variant === 'hero') {
      return (
        <div
          className={cn(
            'w-full bg-gradient-to-br from-primary/10 via-accent/5 to-background',
            'rounded-lg border border-primary/20 p-8 md:p-12',
            'text-center',
            className
          )}
        >
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
          </div>
          <h2 className="mb-4 font-bold text-3xl md:text-4xl">{finalHeadline}</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">{finalDescription}</p>
          <div className="mx-auto max-w-md">
            <FormVariant source={source} className="w-full" />
          </div>
          <p className="mt-4 text-muted-foreground text-xs">{NEWSLETTER_CTA_CONFIG.footerText}</p>
        </div>
      );
    }

    // Inline Variant
    if (variant === 'inline') {
      return (
        <Card
          className={cn(
            'border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background/95',
            'shadow-lg backdrop-blur-sm',
            className
          )}
        >
          <CardHeader className="pb-5">
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} mb-3`}>
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="font-bold text-xl">{finalHeadline}</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed">
              {finalDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormVariant source={source} />
            <div className="text-center text-muted-foreground text-xs">
              <span>{NEWSLETTER_CTA_CONFIG.footerText}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Minimal Variant
    if (variant === 'minimal') {
      return (
        <div
          className={cn(
            'flex flex-col items-stretch justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5',
            'rounded-lg border border-border/50 bg-accent/5',
            className
          )}
        >
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} min-w-0 flex-1`}>
            <Mail className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{finalHeadline}</p>
              <p className="truncate text-muted-foreground text-xs">{finalDescription}</p>
            </div>
          </div>
          <FormVariant
            source={source}
            className="w-full sm:w-auto sm:min-w-[320px] sm:max-w-[400px]"
          />
        </div>
      );
    }

    // Card Variant
    if (variant === 'card') {
      return (
        <Card
          className={cn(
            'flex h-full flex-col border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background/95',
            'shadow-lg backdrop-blur-sm',
            className
          )}
        >
          <CardHeader className="flex-1">
            <div className="mb-4">
              <div className="inline-flex rounded-lg border border-primary/20 bg-primary/10 p-3">
                <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="mb-3 font-bold text-xl">{finalHeadline}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {finalDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormVariant source={source} />
            <div className="text-center">
              <p className="text-muted-foreground text-xs">{NEWSLETTER_CTA_CONFIG.footerText}</p>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // =============================================================================
  // FOOTER BAR VARIANT
  // =============================================================================

  if (variant === 'footer-bar') {
    const { dismissible = true, showAfterDelay = 3000, respectInlineCTA = true } = props;
    return (
      <FooterBarVariant
        source={source}
        dismissible={dismissible}
        showAfterDelay={showAfterDelay}
        respectInlineCTA={respectInlineCTA}
      />
    );
  }

  // =============================================================================
  // MODAL VARIANT
  // =============================================================================

  if (variant === 'modal') {
    const { open, onOpenChange, copyType, slug, referrer } = props;
    return (
      <ModalVariant
        open={open}
        onOpenChange={onOpenChange}
        copyType={copyType}
        {...(category && { category })}
        {...(slug && { slug })}
        {...(referrer && { referrer })}
      />
    );
  }

  return null;
}

// =============================================================================
// INTERNAL VARIANT COMPONENTS
// =============================================================================

/**
 * Form Variant - Simple email form
 */
function FormVariant({ source, className }: { source: NewsletterSource; className?: string }) {
  const { email, setEmail, isSubmitting, subscribe, error } = useNewsletter({
    source,
  });
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await subscribe();
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="min-w-0 flex-1"
            aria-label="Email address"
            error={!!error}
            {...(error ? { errorId } : {})}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-shrink-0 whitespace-nowrap bg-gradient-to-r from-accent to-primary font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-accent/90 hover:to-primary/90 hover:shadow-lg"
          >
            {isSubmitting ? (
              <>Joining...</>
            ) : (
              <>
                {NEWSLETTER_CTA_CONFIG.buttonText}
                <Mail className="ml-2 h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
        {error && (
          <p id={errorId} className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

/**
 * Footer Bar Variant - Sticky footer with dismissal
 */
function FooterBarVariant({
  source,
  dismissible,
  showAfterDelay,
  respectInlineCTA,
}: {
  source: NewsletterSource;
  dismissible: boolean;
  showAfterDelay: number;
  respectInlineCTA: boolean;
}) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Pages that have their own InlineEmailCTA (loaded from app_settings)
  const [pagesWithInlineCTA, setPagesWithInlineCTA] = useState<string[]>([
    '/',
    '/trending',
    '/guides',
    '/board',
    '/changelog',
    '/community',
    '/companies',
    '/for-you',
    '/jobs',
    '/partner',
    '/submit',
    '/tools/config-recommender',
    '/agents/',
    '/mcp/',
    '/rules/',
    '/commands/',
    '/hooks/',
    '/statuslines/',
    '/collections/',
  ]);

  // Load excluded pages from app_settings on mount
  useEffect(() => {
    const loadExcludedPages = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc('get_app_settings', {
          p_category: 'newsletter',
        });

        if (data) {
          const settings = data as Record<string, { value: unknown }>;
          const excludedPages = settings['newsletter.excluded_pages']?.value;

          if (Array.isArray(excludedPages) && excludedPages.length > 0) {
            setPagesWithInlineCTA(excludedPages as string[]);
          }
        }
      } catch {
        // Silent fail - uses hardcoded fallback
      }
    };

    loadExcludedPages().catch(() => {
      // Silent fail - uses hardcoded fallback
    });
  }, []);

  const hasInlineCTA =
    respectInlineCTA && pagesWithInlineCTA.some((page) => pathname?.startsWith(page));

  useEffect(() => {
    setIsClient(true);

    const isDismissed = localStorage.getItem('newsletter-bar-dismissed');

    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showAfterDelay);

      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, [showAfterDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter-bar-dismissed', 'true');
  };

  if (!(isClient && isVisible) || hasInlineCTA) {
    return null;
  }

  return (
    <aside
      className="slide-in-from-bottom fixed right-0 bottom-0 left-0 z-50 animate-in border-[var(--color-border-medium)] border-t-2 bg-[var(--color-bg-overlay)] shadow-xl backdrop-blur-xl duration-300"
      aria-label="Newsletter signup"
    >
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
      <div className="container mx-auto px-4 py-6 md:py-4">
        {/* Desktop layout */}
        <div className="mx-auto hidden max-w-5xl items-center justify-between gap-6 md:flex">
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="rounded-lg border border-accent/20 bg-accent/10 p-2.5">
              <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-base text-foreground">
                {NEWSLETTER_CTA_CONFIG.headline}
              </p>
              <p className="text-muted-foreground text-sm">{NEWSLETTER_CTA_CONFIG.description}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <FormVariant source={source} className="min-w-[360px]" />
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
              <p className="font-medium text-foreground text-sm">
                {NEWSLETTER_CTA_CONFIG.headline}
              </p>
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
          <FormVariant source={source} />
        </div>
      </div>
    </aside>
  );
}

/**
 * Modal Variant - Sheet modal for post-copy capture
 */
function ModalVariant({
  category,
  open,
  onOpenChange,
  copyType,
  slug,
  referrer,
}: {
  category?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyType: CopyType;
  slug?: string;
  referrer?: string;
}) {
  const [email, setEmail] = useState('');
  const [showTime, setShowTime] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      const now = Date.now();
      setShowTime(now);

      trackEvent('email_modal_shown', {
        trigger_source: 'post_copy',
        copy_type: copyType,
        session_copy_count: 1,
      });
    }
  }, [open, copyType]);

  const { execute, status } = useAction(postCopyEmailCaptureAction, {
    onSuccess: (result) => {
      if (result.data) {
        toasts.raw.success('Welcome to the newsletter! 🎉', {
          description: 'Check your inbox for a welcome email',
          duration: 5000,
        });

        trackEvent('newsletter_subscription_post_copy', {
          contact_id: result.data.id,
          copy_type: result.data.copy_type,
          copy_category: result.data.copy_category,
          copy_slug: result.data.copy_slug,
        });

        onOpenChange(false);
        setEmail('');
      } else {
        throw new Error('Subscription failed');
      }
    },
    onError: (error) => {
      const serverError = error.error?.serverError;
      const errorMessage =
        serverError &&
        typeof serverError === 'object' &&
        'message' in serverError &&
        typeof (serverError as { message?: unknown }).message === 'string'
          ? (serverError as { message: string }).message
          : typeof serverError === 'string'
            ? serverError
            : 'Failed to subscribe';

      logger.error('Post-copy email capture failed', new Error(errorMessage), {
        component: 'UnifiedNewsletterCapture',
        variant: 'modal',
        copyType,
        ...(category && { category }),
        ...(slug && { slug }),
      });

      toasts.raw.error('Failed to subscribe', {
        description: errorMessage,
        duration: 4000,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toasts.raw.error('Email required', {
        description: 'Please enter your email address',
        duration: 3000,
      });
      return;
    }

    await execute({
      email: email.trim(),
      source: 'post_copy',
      ...(referrer && { referrer }),
      copy_type: copyType,
      ...(category && { copy_category: category }),
      ...(slug && { copy_slug: slug }),
    });
  };

  const handleMaybeLater = () => {
    if (showTime) {
      const timeShown = Date.now() - showTime;

      trackEvent('email_modal_dismissed', {
        trigger_source: 'post_copy',
        dismissal_method: 'maybe_later',
        time_shown_ms: timeShown,
      });
    }

    onOpenChange(false);
    setEmail('');
  };

  const handleDismiss = (open: boolean) => {
    if (!open && showTime) {
      const timeShown = Date.now() - showTime;

      trackEvent('email_modal_dismissed', {
        trigger_source: 'post_copy',
        dismissal_method: 'close_button',
        time_shown_ms: timeShown,
      });
    }

    onOpenChange(open);
    if (!open) {
      setEmail('');
    }
  };

  const isLoading = status === 'executing';

  return (
    <Sheet open={open} onOpenChange={handleDismiss}>
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{NEWSLETTER_CTA_CONFIG.headline}</SheetTitle>
          <SheetDescription>{NEWSLETTER_CTA_CONFIG.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-12 text-base"
              autoComplete="email"
              aria-label="Email address"
              required
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={cn(
                'flex-1 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90',
                isLoading && 'opacity-50'
              )}
            >
              {isLoading ? 'Joining...' : NEWSLETTER_CTA_CONFIG.buttonText}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleMaybeLater}
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              Maybe later
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-muted-foreground text-xs">
          By subscribing, you agree to receive updates about Claude tools and resources.
        </p>
      </SheetContent>
    </Sheet>
  );
}
