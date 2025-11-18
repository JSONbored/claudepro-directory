import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { ContactTerminal } from '@/src/components/features/contact/contact-terminal';
import { ContactTerminalErrorBoundary } from '@/src/components/features/contact/contact-terminal-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { APP_CONFIG } from '@/src/lib/data/config/constants';
import { getContactChannels } from '@/src/lib/data/marketing/contact';
import { DiscordIcon, Github, Mail, MessageSquare } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/contact');

/**
 * Static Generation: This page is statically generated at build time
 * revalidate: false = Static generation at build time (no revalidation)
 * Note: Calls checkContactTerminalEnabled() at build time to determine terminal feature flag state.
 * The page is static, but the terminal feature flag value is determined during build.
 */
export const revalidate = false;

export default async function ContactPage() {
  const channels = getContactChannels();
  if (!channels.email) {
    logger.warn('ContactPage: email channel is not configured');
  }
  if (!channels.github) {
    logger.warn('ContactPage: github channel is not configured');
  }
  if (!channels.discord) {
    logger.warn('ContactPage: discord channel is not configured');
  }

  // Feature flags are server/middleware only - use default for static generation
  // Terminal feature should be evaluated in middleware, not in page components
  const terminalEnabled = false; // Default for static generation

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-4 font-bold text-3xl sm:text-4xl">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          {terminalEnabled
            ? 'Use our interactive terminal to get in touch, or choose an option below.'
            : "We'd love to hear from you. Choose the best way to reach us below."}
        </p>
      </div>

      {/* Interactive Terminal (Feature Flagged) */}
      {terminalEnabled && (
        <div className="mb-12 flex justify-center">
          <div className="w-full max-w-4xl">
            <ContactTerminalErrorBoundary>
              <ContactTerminal />
            </ContactTerminalErrorBoundary>
          </div>
        </div>
      )}

      {/* Traditional Contact Options */}
      <div className={terminalEnabled ? 'mt-12' : ''}>
        <h2 className="mb-6 text-center font-semibold text-2xl">
          {terminalEnabled ? 'Or reach us directly:' : 'Get in Touch'}
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {!(channels.github || channels.discord || channels.email) && (
            <div className="col-span-2 py-8 text-center text-muted-foreground">
              <p>Contact channels are currently being configured. Please check back soon.</p>
            </div>
          )}
          {/* GitHub Discussions */}
          {channels.github && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Join the conversation, ask questions, and share ideas with the community.
                </p>
                <NavLink
                  href={`${channels.github}/discussions`}
                  external={true}
                  className="inline-flex items-center gap-2"
                >
                  Visit Discussions →
                </NavLink>
              </CardContent>
            </Card>
          )}

          {/* Discord Community */}
          {channels.discord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DiscordIcon className="h-5 w-5" />
                  Discord Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Chat with other users, get help, and stay updated on the latest developments.
                </p>
                <NavLink
                  href={channels.discord}
                  external={true}
                  className="inline-flex items-center gap-2"
                >
                  Join Discord →
                </NavLink>
              </CardContent>
            </Card>
          )}

          {/* GitHub Issues */}
          {channels.github && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Report an Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Found a bug or have a feature request? Open an issue on GitHub.
                </p>
                <NavLink
                  href={`${channels.github}/issues/new`}
                  external={true}
                  className="inline-flex items-center gap-2"
                >
                  Create Issue →
                </NavLink>
              </CardContent>
            </Card>
          )}

          {/* Email */}
          {channels.email && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  For private inquiries, partnerships, or other matters, reach us via email.
                </p>
                <NavLink
                  href={`mailto:${channels.email}`}
                  external={true}
                  className="inline-flex items-center gap-2"
                >
                  {channels.email} →
                </NavLink>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="prose prose-invert mx-auto mt-12 max-w-none">
        <h2 className="mb-4 font-semibold text-2xl">Frequently Asked Questions</h2>
        <p className="mb-4">
          Before reaching out, you might find answers in our{' '}
          <NavLink href="/help">Help Center</NavLink>.
        </p>

        <h2 className="mt-8 mb-4 font-semibold text-2xl">Response Time</h2>
        <p className="mb-4">
          We typically respond to inquiries within 24-48 hours during business days. For urgent
          matters, please use GitHub Issues or Discord for faster community support.
        </p>

        <h2 className="mt-8 mb-4 font-semibold text-2xl">Contributing</h2>
        <p className="mb-4">
          Interested in contributing to {APP_CONFIG.name}? Check out our{' '}
          <NavLink href="/submit">submission guidelines</NavLink> or{' '}
          <NavLink href="/partner">partner program</NavLink>.
        </p>
      </div>
    </div>
  );
}
