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
import { Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../base-template.tsx';
import {
  contentSection,
  dividerStyle,
  headingStyle,
  heroSection,
  listItemStyle,
  listStyle,
  paragraphStyle,
  sectionTitleStyle,
  subheadingStyle,
} from '../common-styles.ts';
import { BulletListSection, HeroBlock } from '../components/sections.tsx';
import { EmailCtaSection } from '../components/cta.tsx';
import { EmailFooterNote } from '../components/footer-note.tsx';
import { buildSubscriptionFooter } from '../config/footer-presets.ts';
import { buildEmailCtaUrl } from '../cta.ts';

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
        <EmailCtaSection
          utm={utm}
          title="Get Started Now"
          description="Explore our directory and discover tools that will supercharge your Claude experience."
          buttons={[
            { preset: 'primaryDirectory', variant: 'primary' },
            { preset: 'viewTrending', variant: 'secondary' },
          ]}
        />

      <Hr style={dividerStyle} />

      {/* Footer note */}
        <EmailFooterNote lines={buildSubscriptionFooter('newsletterWelcome', { email })} />
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
