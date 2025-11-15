/**
 * Newsletter Welcome Email Template
 * Sent when a user subscribes to the newsletter
 *
 * Features:
 * - Personalized greeting
 * - Clear value proposition
 * - Call-to-action buttons
 * - Responsive design
 * - Email client compatible
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../utils/email/cta.ts';
import { EMAIL_UTM_TEMPLATES } from '../utils/email/utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../utils/email/base-template.tsx';
import {
  contentSection,
  ctaSection,
  ctaTitleStyle,
  dividerStyle,
  footerNoteSection,
  footerNoteStyle,
  headingStyle,
  heroSection,
  listItemStyle,
  listStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
} from '../utils/email/common-styles.ts';
import { BulletListSection, HeroBlock } from '../utils/email/components/sections.tsx';

const WHAT_TO_EXPECT = [
  {
    emoji: '🤖',
    title: 'New Claude Agents',
    description: 'Discover powerful AI configurations',
  },
  {
    emoji: '🔌',
    title: 'MCP Servers',
    description: 'Latest Model Context Protocol integrations',
  },
  {
    emoji: '📚',
    title: 'Guides & Tutorials',
    description: 'Learn advanced Claude techniques',
  },
  {
    emoji: '💡',
    title: 'Tips & Tricks',
    description: 'Productivity hacks from the community',
  },
] as const;

export interface NewsletterWelcomeProps {
  /**
   * Subscriber's email address
   */
  email: string;

  /**
   * Source of subscription (for analytics)
   * @default 'unknown'
   */
  source?: string;
}

/**
 * NewsletterWelcome Email Component
 *
 * Usage:
 * ```tsx
 * <NewsletterWelcome
 *   email="user@example.com"
 *   source="footer"
 * />
 * ```
 */
export function NewsletterWelcome({ email }: NewsletterWelcomeProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;

  return (
    <BaseLayout
      preview="Welcome to Claude Pro Directory! Get weekly updates on new tools & guides."
      utm={utm}
    >
      <HeroBlock
        title="Welcome to Claude Pro Directory! 🎉"
        subtitle="You're now subscribed to weekly updates on the best Claude agents, MCP servers, and productivity tools."
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>What to Expect</Text>
        <Text style={paragraphStyle}>
          Every week, you'll receive a carefully curated email featuring:
        </Text>
      </Section>

      <BulletListSection
        items={WHAT_TO_EXPECT.map((item) => ({
          emoji: item.emoji,
          title: item.title,
          description: item.description,
        }))}
      />

      <Hr style={dividerStyle} />

      {/* Call to action */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Get Started Now</Text>
        <Text style={paragraphStyle}>
          Explore our directory and discover tools that will supercharge your Claude experience.
        </Text>

          <Button
            href={buildEmailCtaUrl(baseUrl, utm, { content: 'primary_cta' })}
            style={primaryButtonStyle}
          >
          Browse the Directory
        </Button>

        <Button
            href={buildEmailCtaUrl(`${baseUrl}/trending`, utm, { content: 'trending_cta' })}
          style={secondaryButtonStyle}
        >
          View Trending Tools
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 Subscribed with: <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          You can update your email preferences or unsubscribe anytime using the links at the bottom
          of this email.
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default NewsletterWelcome;

export function renderNewsletterWelcomeEmail(props: NewsletterWelcomeProps) {
  return renderEmailTemplate(NewsletterWelcome, props);
}
