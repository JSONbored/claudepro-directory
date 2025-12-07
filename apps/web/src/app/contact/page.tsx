import { getContactChannels } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { DiscordIcon, Github, Mail, MessageSquare } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { NavLink, Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ContactTerminal } from '@/src/components/features/contact/contact-terminal';
import { ContactTerminalErrorBoundary } from '@/src/components/features/contact/contact-terminal-error-boundary';

/**
 * Generate metadata for the Contact page while ensuring evaluation happens at request time.
 *
 * Awaits a server connection to defer non-deterministic operations (e.g., current date/time)
 * to request time before delegating to the page metadata generator for the '/contact' route.
 *
 * @returns The Next.js Metadata object for the contact page.
 *
 * @see generatePageMetadata
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/contact');
}

/**
 * Renders the Contact page with available contact channels and supplemental information.
 *
 * Renders a page showing an interactive terminal (feature-flagged), traditional contact options
 * (GitHub Discussions, GitHub Issues, Discord, and Email when configured), and additional FAQ,
 * response time, and contributing sections.
 *
 * This server-rendered component generates a request-scoped ID and logger and emits warnings
 * when expected contact channels (email, github, discord) are not configured.
 *
 * @returns The React element for the Contact page.
 *
 * @see getContactChannels
 * @see ContactTerminal
 * @see ContactTerminalErrorBoundary
 */
export default async function ContactPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'ContactPage',
    route: '/contact',
    module: 'apps/web/src/app/contact',
  });

  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-8">Loading contact information...</div>}
    >
      <ContactPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Render the contact page content: available contact channels, an optional interactive terminal, and supplemental information (FAQ, response time, contributing).
 *
 * Logs warnings via the provided request-scoped logger when expected contact channels (email, GitHub, Discord) are not configured.
 *
 * @param reqLogger - A request-scoped logger used to emit warnings and contextual log entries for this render.
 * @returns A React element containing the contact options UI and additional informational sections.
 *
 * @see ContactTerminal
 * @see ContactTerminalErrorBoundary
 * @see getContactChannels
 * @see APP_CONFIG
 */
function ContactPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  const channels = getContactChannels();
  if (!channels.email) {
    reqLogger.warn('ContactPage: email channel is not configured', {
      channel: 'email',
      configKey: 'CONTACT_EMAIL',
    });
  }
  if (!channels.github) {
    reqLogger.warn('ContactPage: github channel is not configured', {
      channel: 'github',
      configKey: 'GITHUB_URL',
    });
  }
  if (!channels.discord) {
    reqLogger.warn('ContactPage: discord channel is not configured', {
      channel: 'discord',
      configKey: 'DISCORD_INVITE_URL',
    });
  }

  // Feature flags are now static defaults - no server/middleware dependency
  // Terminal feature should be evaluated in middleware, not in page components

  const terminalEnabled = false; // Default for static generation

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Contact Us</h1>
        <p className="text-muted-foreground text-lg">
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
          {terminalEnabled
            ? 'Use our interactive terminal to get in touch, or choose an option below.'
            : "We'd love to hear from you. Choose the best way to reach us below."}
        </p>
      </div>

      {/* Interactive Terminal (Feature Flagged) */}
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
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
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
      <div className={terminalEnabled ? 'mt-12' : ''}>
        <h2 className="mb-6 text-center text-2xl font-semibold">
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
          {terminalEnabled ? 'Or reach us directly:' : 'Get in Touch'}
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {!(channels.github || channels.discord || channels.email) && (
            <div className="text-muted-foreground col-span-2 py-8 text-center">
              <p>Contact channels are currently being configured. Please check back soon.</p>
            </div>
          )}
          {/* GitHub Discussions */}
          {channels.github ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Join the conversation, ask questions, and share ideas with the community.
                </p>
                <NavLink
                  href={`${channels.github}/discussions`}
                  external
                  className="inline-flex items-center gap-2"
                >
                  Visit Discussions →
                </NavLink>
              </CardContent>
            </Card>
          ) : null}

          {/* Discord Community */}
          {channels.discord ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DiscordIcon className="h-5 w-5" />
                  Discord Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Chat with other users, get help, and stay updated on the latest developments.
                </p>
                <NavLink
                  href={channels.discord}
                  external
                  className="inline-flex items-center gap-2"
                >
                  Join Discord →
                </NavLink>
              </CardContent>
            </Card>
          ) : null}

          {/* GitHub Issues */}
          {channels.github ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Report an Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Found a bug or have a feature request? Open an issue on GitHub.
                </p>
                <NavLink
                  href={`${channels.github}/issues/new`}
                  external
                  className="inline-flex items-center gap-2"
                >
                  Create Issue →
                </NavLink>
              </CardContent>
            </Card>
          ) : null}

          {/* Email */}
          {channels.email ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For private inquiries, partnerships, or other matters, reach us via email.
                </p>
                <NavLink
                  href={`mailto:${channels.email}`}
                  external
                  className="inline-flex items-center gap-2"
                >
                  {channels.email} →
                </NavLink>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Additional Information */}
      <div className="prose prose-invert mx-auto mt-12 max-w-none">
        <h2 className="mb-4 text-2xl font-semibold">Frequently Asked Questions</h2>
        <p className="mb-4">
          Before reaching out, you might find answers in our{' '}
          <NavLink href="/help">Help Center</NavLink>.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">Response Time</h2>
        <p className="mb-4">
          We typically respond to inquiries within 24-48 hours during business days. For urgent
          matters, please use GitHub Issues or Discord for faster community support.
        </p>

        <h2 className="mt-8 mb-4 text-2xl font-semibold">Contributing</h2>
        <p className="mb-4">
          Interested in contributing to {APP_CONFIG.name}? Check out our{' '}
          <NavLink href="/submit">submission guidelines</NavLink> or{' '}
          <NavLink href="/partner">partner program</NavLink>.
        </p>
      </div>
    </div>
  );
}