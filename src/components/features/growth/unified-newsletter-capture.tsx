'use client';

/**
 * Unified Newsletter Capture - All-in-one component for 7 newsletter capture variants
 * Database-first with centralized useNewsletter hook integration
 */

import { usePathname } from 'next/navigation';
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
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/config/category-config';
import { trackInteraction } from '@/src/lib/edge/client';
import { Mail, X } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { DIMENSIONS, POSITION_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

export type CopyType = 'llmstxt' | 'markdown' | 'code' | 'link';

interface UnifiedNewsletterCaptureBaseProps {
  source: NewsletterSource;
  className?: string;
  category?: string;
}

export interface FormVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'form';
}

export interface CTAVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'hero' | 'inline' | 'minimal' | 'card';
  context: string;
  headline?: string;
  description?: string;
}

export interface FooterBarVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'footer-bar';
  dismissible?: boolean;
  showAfterDelay?: number;
  respectInlineCTA?: boolean;
}

export interface ModalVariantProps extends UnifiedNewsletterCaptureBaseProps {
  variant: 'modal';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyType: CopyType;
  slug?: string;
}

export type UnifiedNewsletterCaptureProps =
  | FormVariantProps
  | CTAVariantProps
  | FooterBarVariantProps
  | ModalVariantProps;

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

export function UnifiedNewsletterCapture(props: UnifiedNewsletterCaptureProps) {
  const { variant, source, className, category } = props;

  if (variant === 'form') {
    return <FormVariant source={source} {...(className && { className })} />;
  }

  if (variant === 'hero' || variant === 'inline' || variant === 'minimal' || variant === 'card') {
    const { headline, description } = props;
    const { headline: defaultHeadline, description: defaultDescription } =
      getContextualMessage(category);
    const finalHeadline = headline || defaultHeadline;
    const finalDescription = description || defaultDescription;

    if (variant === 'hero') {
      return (
        <div
          className={cn(
            'w-full bg-gradient-to-br from-card/80 via-card/60 to-card/40',
            'backdrop-blur-sm',
            'rounded-2xl border border-border/30',
            'shadow-black/5 shadow-lg',
            'p-10 md:p-16',
            'text-center',
            className
          )}
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4 shadow-accent/10 shadow-md backdrop-blur-sm">
              <Mail className={`${UI_CLASSES.ICON_XL} text-accent`} aria-hidden="true" />
            </div>
          </div>

          <h2 className="mb-4 font-bold text-3xl text-foreground leading-tight tracking-tight md:text-4xl">
            {finalHeadline}
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground leading-relaxed md:text-lg">
            {finalDescription}
          </p>

          <div className="mx-auto max-w-xl">
            <FormVariant source={source} className="w-full" />
          </div>

          <p className="mt-6 text-muted-foreground/80 text-sm">
            {NEWSLETTER_CTA_CONFIG.footerText}
          </p>
        </div>
      );
    }

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
                <Mail className={`${UI_CLASSES.ICON_MD} text-primary`} aria-hidden="true" />
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
            <Mail
              className={`${UI_CLASSES.ICON_MD} flex-shrink-0 text-primary`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{finalHeadline}</p>
              <p className="truncate text-muted-foreground text-xs">{finalDescription}</p>
            </div>
          </div>
          <FormVariant
            source={source}
            className={`w-full sm:w-auto sm:${DIMENSIONS.MIN_W_NEWSLETTER_FORM} sm:${DIMENSIONS.NEWSLETTER_FORM_MAX}`}
          />
        </div>
      );
    }

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
                <Mail className={`${UI_CLASSES.ICON_LG} text-primary`} aria-hidden="true" />
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

  if (variant === 'modal') {
    const { open, onOpenChange, copyType, slug } = props;
    return (
      <ModalVariant
        open={open}
        onOpenChange={onOpenChange}
        copyType={copyType}
        {...(category && { category })}
        {...(slug && { slug })}
      />
    );
  }

  return null;
}

function FormVariant({ source, className }: { source: NewsletterSource; className?: string }) {
  const { email, setEmail, isSubmitting, subscribe, error } = useNewsletter({
    source,
  });
  const errorId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await subscribe();
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className={UI_CLASSES.FLEX_COL_GAP_3}>
        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <div className="relative flex-1">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required
              disabled={isSubmitting}
              className={cn(
                `${DIMENSIONS.BUTTON_LG} min-w-0 px-5 text-base`,
                'border-border/40 bg-background/95 backdrop-blur-sm',
                'transition-all duration-200 ease-out',
                'focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
                error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
                isSubmitting && 'cursor-not-allowed opacity-60'
              )}
              aria-label="Email address"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            <div
              className={cn(
                'absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent to-primary transition-all duration-300 ease-out',
                isFocused && !error ? 'w-full opacity-100' : 'w-0 opacity-0'
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            size="lg"
            className={cn(
              `${DIMENSIONS.BUTTON_LG} flex-shrink-0 whitespace-nowrap px-8`,
              'bg-gradient-to-r from-accent via-accent to-primary font-semibold text-accent-foreground',
              'shadow-md transition-all duration-200 ease-out',
              'hover:scale-[1.02] hover:from-accent/90 hover:via-accent/90 hover:to-primary/90 hover:shadow-lg',
              'active:scale-[0.98]',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
              `w-full sm:w-auto sm:${DIMENSIONS.MIN_W_NEWSLETTER_BUTTON}`
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span
                  className={`${UI_CLASSES.ICON_SM} animate-spin rounded-full border-2 border-current border-t-transparent`}
                />
                Subscribing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {NEWSLETTER_CTA_CONFIG.buttonText}
                <Mail className={UI_CLASSES.ICON_SM} aria-hidden="true" />
              </span>
            )}
          </Button>
        </div>
        {error && (
          <p
            id={errorId}
            className="slide-in-from-top-1 fade-in animate-in text-destructive text-sm"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

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
  const [pagesWithInlineCTA, setPagesWithInlineCTA] = useState<string[]>([
    '/',
    '/trending',
    '/guides',
    '/changelog',
    '/community',
    '/companies',
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
        // Silent fail
      }
    };

    loadExcludedPages().catch(() => {
      // Intentionally ignore errors
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
      className={`slide-in-from-bottom ${POSITION_PATTERNS.FIXED_BOTTOM_FULL_RESPONSIVE} z-50 animate-in border-[var(--color-border-medium)] border-t-2 bg-[var(--color-bg-overlay)] shadow-xl backdrop-blur-xl duration-300`}
      aria-label="Newsletter signup"
    >
      <div
        className={`${POSITION_PATTERNS.ABSOLUTE_TOP_FULL} h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent`}
      />
      <div className="container mx-auto px-4 py-6 md:py-4">
        {/* Desktop layout */}
        <div className="mx-auto hidden max-w-5xl items-center justify-between gap-6 md:flex">
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="rounded-lg border border-accent/20 bg-accent/10 p-2.5">
              <Mail className={`${UI_CLASSES.ICON_MD} text-accent`} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-base text-foreground">
                {NEWSLETTER_CTA_CONFIG.headline}
              </p>
              <p className="text-muted-foreground text-sm">{NEWSLETTER_CTA_CONFIG.description}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <FormVariant source={source} className={DIMENSIONS.MIN_W_NEWSLETTER_FORM_LG} />
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                aria-label="Dismiss newsletter signup"
                className="flex-shrink-0"
              >
                <X className={UI_CLASSES.ICON_SM} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className={`${UI_CLASSES.FLEX_COL_GAP_3} md:hidden`}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div className="flex items-center gap-2">
              <Mail
                className={`${UI_CLASSES.ICON_SM} flex-shrink-0 text-accent`}
                aria-hidden="true"
              />
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
                <X className={UI_CLASSES.ICON_SM} aria-hidden="true" />
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
}: {
  category?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyType: CopyType;
  slug?: string;
}) {
  const [showTime, setShowTime] = useState<number | null>(null);

  const { email, setEmail, isSubmitting, subscribe } = useNewsletter({
    source: 'post_copy',
    metadata: {
      copy_type: copyType,
      ...(category && { copy_category: category }),
      ...(slug && { copy_slug: slug }),
    },
    successMessage: 'Check your inbox for a welcome email',
    showToasts: true,
    logContext: {
      variant: 'modal',
      copyType,
      ...(category && { category }),
      ...(slug && { slug }),
    },
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      const now = Date.now();
      setShowTime(now);

      trackInteraction({
        content_type: null,
        content_slug: null,
        interaction_type: 'click',
        metadata: {
          action: 'email_modal_shown',
          trigger_source: 'post_copy',
          copy_type: copyType,
          session_copy_count: 1,
        },
      }).catch(() => {
        // Analytics failure should not affect UX
      });
    }
  }, [open, copyType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toasts.raw.error('Email required', {
        description: 'Please enter your email address',
        duration: 3000,
      });
      return;
    }

    // Hook handles all toast notifications internally via showToasts: true
    // subscribe() uses startTransition(), so we don't await or try/catch here
    subscribe();
  };

  const handleMaybeLater = () => {
    if (showTime) {
      const timeShown = Date.now() - showTime;

      trackInteraction({
        content_type: null,
        content_slug: null,
        interaction_type: 'click',
        metadata: {
          action: 'email_modal_dismissed',
          trigger_source: 'post_copy',
          dismissal_method: 'maybe_later',
          time_shown_ms: timeShown,
        },
      }).catch(() => {
        // Analytics failure should not affect UX
      });
    }

    onOpenChange(false);
    setEmail('');
  };

  const handleDismiss = (open: boolean) => {
    if (!open && showTime) {
      const timeShown = Date.now() - showTime;

      trackInteraction({
        content_type: null,
        content_slug: null,
        interaction_type: 'click',
        metadata: {
          action: 'email_modal_dismissed',
          trigger_source: 'post_copy',
          dismissal_method: 'close_button',
          time_shown_ms: timeShown,
        },
      }).catch(() => {
        // Analytics failure should not affect UX
      });
    }

    onOpenChange(open);
    if (!open) {
      setEmail('');
    }
  };

  const isLoading = isSubmitting;

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

          <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
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
