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

import { Button, Hr, Section, Text } from '@react-email/components';
import { BaseLayout } from '../layouts/base-layout';
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
} from '../utils/common-styles';

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
  return (
    <BaseLayout preview="Welcome to ClaudePro Directory! Get weekly updates on new tools & guides.">
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>Welcome to ClaudePro Directory! 🎉</Text>
        <Text style={subheadingStyle}>
          You're now subscribed to weekly updates on the best Claude agents, MCP servers, and
          productivity tools.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What to expect section */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>What to Expect</Text>
        <Text style={paragraphStyle}>
          Every week, you'll receive a carefully curated email featuring:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>🤖 New Claude Agents</strong> - Discover powerful AI
            configurations
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>🔌 MCP Servers</strong> - Latest Model Context Protocol
            integrations
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>📚 Guides & Tutorials</strong> - Learn advanced Claude
            techniques
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>💡 Tips & Tricks</strong> - Productivity hacks from the
            community
          </li>
        </ul>
      </Section>

      <Hr style={dividerStyle} />

      {/* Call to action */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Get Started Now</Text>
        <Text style={paragraphStyle}>
          Explore our directory and discover tools that will supercharge your Claude experience.
        </Text>

        <Button href="https://claudepro.directory" style={primaryButtonStyle}>
          Browse the Directory
        </Button>

        <Button href="https://claudepro.directory/trending" style={secondaryButtonStyle}>
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
