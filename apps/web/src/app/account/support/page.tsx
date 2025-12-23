/**
 * Support Page
 * Provides help center links, contact support, FAQ, feature requests, bug reports, and community links
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { ROUTES, SOCIAL_LINKS } from '@heyclaude/web-runtime/data/config/constants';
import {
  Bug,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Mail,
  MessageSquare,
} from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  description:
    'Get help, contact support, report bugs, request features, and access community resources',
  title: 'Support | Account Settings',
};

/**
 * Render the Support page that provides help and support resources.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Support page.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function SupportPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/support',
    operation: 'SupportPage',
    route: '/account/support',
  });

  const { user } = await getAuthenticatedUser({
    context: 'SupportPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'SupportPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'SupportPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Support & Help</h1>
        <p className="text-muted-foreground text-base">
          Get help, contact support, report issues, and access community resources.
        </p>
      </div>

      {/* Help Center */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5" />
            Help Center
          </CardTitle>
          <CardDescription className="text-sm">
            Browse documentation, guides, and frequently asked questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            className="border-border bg-card hover:bg-accent/10 flex items-center justify-between rounded-lg border p-4 transition-colors"
            href="/docs"
          >
            <div>
              <p className="text-sm font-medium">Documentation</p>
              <p className="text-muted-foreground text-xs">Complete guides and API reference</p>
            </div>
            <ExternalLink className="text-muted-foreground h-4 w-4" />
          </Link>
          <Link
            className="border-border bg-card hover:bg-accent/10 flex items-center justify-between rounded-lg border p-4 transition-colors"
            href="/faq"
          >
            <div>
              <p className="text-sm font-medium">FAQ</p>
              <p className="text-muted-foreground text-xs">Frequently asked questions</p>
            </div>
            <ExternalLink className="text-muted-foreground h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5" />
            Contact Support
          </CardTitle>
          <CardDescription className="text-sm">
            Get in touch with our support team for assistance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Email Support</p>
            <p className="text-muted-foreground mb-3 text-sm">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <Button asChild variant="outline">
              <a href={`mailto:${SOCIAL_LINKS.supportEmail}`}>{SOCIAL_LINKS.supportEmail}</a>
            </Button>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Response Time</p>
            <p className="text-muted-foreground text-sm">
              We typically respond within 24-48 hours during business days.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Requests */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lightbulb className="h-5 w-5" />
            Feature Requests
          </CardTitle>
          <CardDescription className="text-sm">
            Suggest new features or improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Have an idea for a new feature? We'd love to hear from you!
          </p>
          <Button asChild variant="outline">
            <a
              href={`${SOCIAL_LINKS.github}/issues/new?template=feature_request.md`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Submit Feature Request
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Bug Reports */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bug className="h-5 w-5" />
            Report a Bug
          </CardTitle>
          <CardDescription className="text-sm">
            Found a bug? Help us fix it by reporting it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Report bugs and issues to help us improve the platform.
          </p>
          <Button asChild variant="outline">
            <a
              href={`${SOCIAL_LINKS.github}/issues/new?template=bug_report.md`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Report Bug
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Community */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="h-5 w-5" />
            Community
          </CardTitle>
          <CardDescription className="text-sm">
            Join our community and connect with other users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              className="border-border bg-card hover:bg-accent/10 flex items-center justify-between rounded-lg border p-4 transition-colors"
              href={SOCIAL_LINKS.discord}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div>
                <p className="text-sm font-medium">Discord</p>
                <p className="text-muted-foreground text-xs">Join our Discord community</p>
              </div>
              <ExternalLink className="text-muted-foreground h-4 w-4" />
            </Link>
            <Link
              className="border-border bg-card hover:bg-accent/10 flex items-center justify-between rounded-lg border p-4 transition-colors"
              href={SOCIAL_LINKS.github}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-muted-foreground text-xs">Contribute on GitHub</p>
              </div>
              <ExternalLink className="text-muted-foreground h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
