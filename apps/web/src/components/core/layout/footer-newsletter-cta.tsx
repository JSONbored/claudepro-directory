'use client';

/**
 * Footer Newsletter CTA - Beautiful two-column design
 * Left: MCP command code highlight
 * Right: Newsletter subscription form
 * Inspired by modern developer-focused footers
 */

import { type Database } from '@heyclaude/database-types';
import { highlightCode } from '@heyclaude/shared-runtime/code-highlight';
import { useNewsletter } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { ArrowRight, Loader2, Mail } from '@heyclaude/web-runtime/icons';
import { cn, SimpleCopyButton, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useState } from 'react';

/**
 * Email validation regex - simple but effective
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

interface FooterNewsletterCTAProps {
  source: Database['public']['Enums']['newsletter_source'];
}

// MCP command to display
const MCP_COMMAND = 'claude mcp add heyclaude-mcp';

export function FooterNewsletterCTA({ source }: FooterNewsletterCTAProps) {
  const { email, setEmail, isSubmitting, subscribe, error, reset } = useNewsletter({
    source,
    successMessage: 'You have been subscribed to our newsletter.',
    onSuccess: async () => {
      reset();
    },
    logContext: {
      component: 'FooterNewsletterCTA',
    },
  });

  const errorId = useId();
  const isValid = useMemo(() => isValidEmail(email), [email]);
  const showSubmitButton = isValid && !isSubmitting && email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid && !isSubmitting) {
      await subscribe();
    }
  };

  // Highlight the MCP command and sanitize with DOMPurify for defense-in-depth
  const rawHighlightedCode = highlightCode(MCP_COMMAND, 'bash', { showLineNumbers: false });
  const [sanitizedCode, setSanitizedCode] = useState<string>('');

  useEffect(() => {
    // Sanitize highlighted code with DOMPurify for XSS protection
    // Even though input is hardcoded, sanitization provides defense-in-depth
    if (typeof window !== 'undefined' && rawHighlightedCode) {
      import('dompurify')
        .then((DOMPurify) => {
          // Sanitize with restrictive allowlist for code highlighting HTML
          // sugar-high typically uses: <div>, <pre>, <code>, <span> with class attributes
          const sanitized = DOMPurify.default.sanitize(rawHighlightedCode, {
            ALLOWED_TAGS: ['div', 'pre', 'code', 'span', 'button'],
            ALLOWED_ATTR: ['class', 'data-line'],
            // Allow data-* attributes (sugar-high may use data-line for line numbers)
            ALLOW_DATA_ATTR: true,
            // Remove any dangerous protocols or scripts
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'href', 'src'],
          });
          setSanitizedCode(sanitized);
        })
        .catch((error) => {
          const normalized = normalizeError(error, 'Failed to load DOMPurify');
          logClientWarn(
            '[FooterNewsletterCTA] Failed to sanitize highlighted code',
            normalized,
            'FooterNewsletterCTA.sanitize',
            {
              component: 'FooterNewsletterCTA',
              action: 'sanitize-code',
            }
          );
          // Fallback to original HTML if DOMPurify fails (input is hardcoded, so safe)
          setSanitizedCode(rawHighlightedCode);
        });
    } else {
      // During SSR, use empty string (will be sanitized on client)
      setSanitizedCode('');
    }
  }, [rawHighlightedCode]);

  return (
    <div className="border-border/50 bg-background border-b">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left Column - MCP Command */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-2">
                <h2 className="text-foreground text-2xl font-bold leading-tight md:text-3xl">
                  Create what's exciting. Maintain what's essential.
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
                  Use Claude Code where you work
                </p>
              </div>

              {/* Code Block with Copy Button */}
              <div className="relative">
                <div className="border-border/50 bg-card/50 rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm font-medium">Get Claude Code</span>
                    <SimpleCopyButton
                      content={MCP_COMMAND}
                      label=""
                      ariaLabel="Copy MCP command"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      iconClassName="h-4 w-4"
                    />
                  </div>
                  <div
                    className="code-block-wrapper overflow-x-auto rounded-md"
                    // eslint-disable-next-line jsx-a11y/no-danger -- HTML is sanitized with DOMPurify with strict allowlist (client-side)
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is sanitized client-side with DOMPurify
                    dangerouslySetInnerHTML={{ __html: sanitizedCode }}
                  />
                </div>
                <p className="text-muted-foreground mt-3 text-sm">
                  Or{' '}
                  <a
                    href="/docs"
                    className="text-foreground hover:underline font-medium underline-offset-4"
                  >
                    read the documentation
                  </a>
                </p>
              </div>
            </motion.div>

            {/* Right Column - Newsletter */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Envelope Icon */}
              <motion.div
                className="inline-flex"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="border-border/50 bg-card/50 rounded-xl border p-4">
                  <Mail className="text-foreground h-8 w-8 md:h-10 md:w-10" aria-hidden="true" />
                </div>
              </motion.div>

              {/* Headline */}
              <h2 className="text-foreground text-2xl font-bold leading-tight md:text-3xl">
                Get the developer newsletter
              </h2>

              {/* Description */}
              <p className="text-muted-foreground text-base leading-relaxed md:text-lg">
                Product updates, how-tos, community spotlights, and more. Delivered monthly to your
                inbox.
              </p>

              {/* Integrated Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative flex w-full items-center gap-2">
                  {/* Email Input */}
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={cn(
                      'h-14 w-full rounded-lg border px-4 pr-14 text-base',
                      'border-border bg-background',
                      'transition-all duration-200 ease-out',
                      'focus:border-[#F6F8F4]/50 focus:ring-2 focus:ring-[#F6F8F4]/20 focus:outline-none',
                      error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                      isSubmitting && 'cursor-not-allowed opacity-60'
                    )}
                    aria-label="Email address"
                    aria-invalid={!!error}
                    aria-describedby={error ? errorId : undefined}
                  />

                  {/* Integrated Submit Button */}
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.button
                        key="loading"
                        type="button"
                        disabled
                        className={cn(
                          'absolute right-2 flex h-10 w-10 items-center justify-center rounded-lg',
                          'bg-[#F6F8F4] text-background',
                          'cursor-not-allowed'
                        )}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        aria-label="Subscribing..."
                      >
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      </motion.button>
                    ) : showSubmitButton ? (
                      <motion.button
                        key="submit"
                        type="submit"
                        className={cn(
                          'absolute right-2 flex h-10 w-10 items-center justify-center rounded-lg',
                          'bg-[#F6F8F4] text-background',
                          'shadow-sm transition-all duration-200',
                          'hover:bg-[#F6F8F4]/90 hover:shadow-md',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F8F4] focus-visible:ring-offset-2',
                          'active:scale-95'
                        )}
                        initial={{ opacity: 0, x: -8, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.8 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Subscribe to newsletter"
                      >
                        <motion.div
                          initial={{ rotate: 0 }}
                          whileHover={{ rotate: 15 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <ArrowRight className="h-5 w-5" aria-hidden="true" />
                        </motion.div>
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error ? (
                    <motion.p
                      id={errorId}
                      className="text-destructive text-sm"
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error}
                    </motion.p>
                  ) : null}
                </AnimatePresence>

                {/* Privacy text */}
                <p className={cn(UI_CLASSES.TEXT_XS_MUTED, 'leading-snug')}>
                  Please provide your email address if you'd like to receive our monthly developer
                  newsletter. You can unsubscribe at any time.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
