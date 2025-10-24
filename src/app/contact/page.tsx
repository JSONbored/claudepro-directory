import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';
import { DiscordIcon, Github, Mail, MessageSquare } from '@/src/lib/icons';

export const metadata: Metadata = {
  title: `Contact Us - ${APP_CONFIG.name}`,
  description: `Get in touch with the ${APP_CONFIG.name} team. Find support, report issues, or connect with us through GitHub, Discord, or email.`,
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground text-lg">
          We'd love to hear from you. Choose the best way to reach us below.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* GitHub Discussions */}
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
            <Link
              href={`${SOCIAL_LINKS.github}/discussions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:underline"
            >
              Visit Discussions →
            </Link>
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
            <p className="text-muted-foreground mb-4">
              Chat with other users, get help, and stay updated on the latest developments.
            </p>
            <Link
              href={SOCIAL_LINKS.discord || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:underline"
            >
              Join Discord →
            </Link>
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
            <p className="text-muted-foreground mb-4">
              Found a bug or have a feature request? Open an issue on GitHub.
            </p>
            <Link
              href={`${SOCIAL_LINKS.github}/issues/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:underline"
            >
              Create Issue →
            </Link>
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
            <p className="text-muted-foreground mb-4">
              For private inquiries, partnerships, or other matters, reach us via email.
            </p>
            <a
              href={`mailto:${SOCIAL_LINKS.email}`}
              className="inline-flex items-center gap-2 text-accent hover:underline"
            >
              {SOCIAL_LINKS.email} →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="prose prose-invert max-w-none">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <p className="mb-4">
          Before reaching out, you might find answers in our{' '}
          <Link href="/help" className="text-accent hover:underline">
            Help Center
          </Link>
          .
        </p>

        <h2 className="text-2xl font-semibold mb-4 mt-8">Response Time</h2>
        <p className="mb-4">
          We typically respond to inquiries within 24-48 hours during business days. For urgent
          matters, please use GitHub Issues or Discord for faster community support.
        </p>

        <h2 className="text-2xl font-semibold mb-4 mt-8">Contributing</h2>
        <p className="mb-4">
          Interested in contributing to {APP_CONFIG.name}? Check out our{' '}
          <Link href="/submit" className="text-accent hover:underline">
            submission guidelines
          </Link>{' '}
          or{' '}
          <Link href="/partner" className="text-accent hover:underline">
            partner program
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
