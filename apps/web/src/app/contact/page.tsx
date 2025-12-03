import { getContactChannels } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  cluster,
  iconSize,
  marginBottom,
  marginTop,
  muted,
  weight,
  size,
  padding,
  gap,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { DiscordIcon, Github, Mail, MessageSquare } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { NavLink, Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

import { ContactTerminal } from '@/src/components/features/contact/contact-terminal';
import { ContactTerminalErrorBoundary } from '@/src/components/features/contact/contact-terminal-error-boundary';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/contact');
}

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 86_400;

export default function ContactPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'ContactPage',
    route: '/contact',
    module: 'apps/web/src/app/contact',
  });

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
    <div
      className={`container mx-auto ${maxWidth['6xl']} ${padding.xDefault} ${padding.yRelaxed} sm:py-12`}
    >
      <div className={`${marginBottom.relaxed} text-center`}>
        <h1 className={`${marginBottom.default} ${weight.bold} ${size['3xl']} sm:${size['4xl']}`}>
          Contact Us
        </h1>
        <p className={muted.lg}>
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
          {terminalEnabled
            ? 'Use our interactive terminal to get in touch, or choose an option below.'
            : "We'd love to hear from you. Choose the best way to reach us below."}
        </p>
      </div>

      {/* Interactive Terminal (Feature Flagged) */}
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
      {terminalEnabled && (
        <div className={`${marginBottom.section} flex justify-center`}>
          <div className={`w-full ${maxWidth['4xl']}`}>
            <ContactTerminalErrorBoundary>
              <ContactTerminal />
            </ContactTerminalErrorBoundary>
          </div>
        </div>
      )}

      {/* Traditional Contact Options */}
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
      <div className={terminalEnabled ? 'mt-12' : ''}>
        <h2 className={`${marginBottom.comfortable} text-center ${weight.semibold} ${size['2xl']}`}>
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Feature flag placeholder */}
          {terminalEnabled ? 'Or reach us directly:' : 'Get in Touch'}
        </h2>

        <div className={`grid ${gap.relaxed} md:grid-cols-2`}>
          {!(channels.github || channels.discord || channels.email) && (
            <div className={`col-span-2 ${padding.yRelaxed} text-center ${muted.default}`}>
              <p>Contact channels are currently being configured. Please check back soon.</p>
            </div>
          )}
          {/* GitHub Discussions */}
          {channels.github ? (
            <Card>
              <CardHeader>
                <CardTitle className={cluster.compact}>
                  <Github className={iconSize.md} />
                  GitHub Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${marginBottom.default} ${muted.default}`}>
                  Join the conversation, ask questions, and share ideas with the community.
                </p>
                <NavLink
                  href={`${channels.github}/discussions`}
                  external
                  className={cluster.compact}
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
                <CardTitle className={cluster.compact}>
                  <DiscordIcon className={iconSize.md} />
                  Discord Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${marginBottom.default} ${muted.default}`}>
                  Chat with other users, get help, and stay updated on the latest developments.
                </p>
                <NavLink href={channels.discord} external className={cluster.compact}>
                  Join Discord →
                </NavLink>
              </CardContent>
            </Card>
          ) : null}

          {/* GitHub Issues */}
          {channels.github ? (
            <Card>
              <CardHeader>
                <CardTitle className={cluster.compact}>
                  <MessageSquare className={iconSize.md} />
                  Report an Issue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${marginBottom.default} ${muted.default}`}>
                  Found a bug or have a feature request? Open an issue on GitHub.
                </p>
                <NavLink
                  href={`${channels.github}/issues/new`}
                  external
                  className={cluster.compact}
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
                <CardTitle className={cluster.compact}>
                  <Mail className={iconSize.md} />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`${marginBottom.default} ${muted.default}`}>
                  For private inquiries, partnerships, or other matters, reach us via email.
                </p>
                <NavLink href={`mailto:${channels.email}`} external className={cluster.compact}>
                  {channels.email} →
                </NavLink>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Additional Information */}
      <div className={`prose prose-invert mx-auto mt-12 ${maxWidth.none}`}>
        <h2 className={`${marginBottom.default} ${weight.semibold} ${size['2xl']}`}>
          Frequently Asked Questions
        </h2>
        <p className={marginBottom.default}>
          Before reaching out, you might find answers in our{' '}
          <NavLink href="/help">Help Center</NavLink>.
        </p>

        <h2 className={`${marginTop.relaxed} mb-4 ${weight.semibold} ${size['2xl']}`}>
          Response Time
        </h2>
        <p className={marginBottom.default}>
          We typically respond to inquiries within 24-48 hours during business days. For urgent
          matters, please use GitHub Issues or Discord for faster community support.
        </p>

        <h2 className={`${marginTop.relaxed} mb-4 ${weight.semibold} ${size['2xl']}`}>
          Contributing
        </h2>
        <p className={marginBottom.default}>
          Interested in contributing to {APP_CONFIG.name}? Check out our{' '}
          <NavLink href="/submit">submission guidelines</NavLink> or{' '}
          <NavLink href="/partner">partner program</NavLink>.
        </p>
      </div>
    </div>
  );
}
