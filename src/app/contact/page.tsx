import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { DiscordIcon, Github, Mail, MessageSquare } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/contact');

/**
 * ISR Configuration: Marketing pages update infrequently
 * revalidate: 86400 = Revalidate every 24 hours
 */
export const revalidate = false;

export default function ContactPage() {
  if (!SOCIAL_LINKS.email) {
    logger.warn('ContactPage: SOCIAL_LINKS.email is not configured');
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-4 font-bold text-3xl sm:text-4xl">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          We'd love to hear from you. Choose the best way to reach us below.
        </p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        {/* GitHub Discussions */}
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
              href={`${SOCIAL_LINKS.github}/discussions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Visit Discussions →
            </NavLink>
          </CardContent>
        </Card>

        {/* Discord Community */}
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
              href={SOCIAL_LINKS.discord || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Join Discord →
            </NavLink>
          </CardContent>
        </Card>

        {/* GitHub Issues */}
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
              href={`${SOCIAL_LINKS.github}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Create Issue →
            </NavLink>
          </CardContent>
        </Card>

        {/* Email */}
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
              href={`mailto:${SOCIAL_LINKS.email}`}
              className="inline-flex items-center gap-2"
            >
              {SOCIAL_LINKS.email} →
            </NavLink>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="prose prose-invert max-w-none">
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
