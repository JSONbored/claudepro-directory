/**
 * Onboarding Sequence Email Template
 * Sent as part of a 5-step onboarding sequence
 *
 * Features:
 * - Step-based content (1-5)
 * - Modern card-based layout
 * - Clear call-to-action buttons
 * - Dark mode compatible
 * - Responsive design
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';

import { BaseLayout } from '../base-template';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { buildSubscriptionFooter } from '../config/footer-presets';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface SequenceEmailProps {
  /**
   * Sequence step number (1-5)
   */
  step: number;

  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Sequence email template data for each step
 */
const SEQUENCE_STEPS = {
  1: {
    title: 'Welcome to Claude Pro Directory! 🎉',
    utm: EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME,
    content: [
      {
        type: 'paragraph' as const,
        text: "Thanks for joining! We're excited to have you.",
      },
      {
        type: 'paragraph' as const,
        text: 'Claude Pro Directory is the home for Claude builders - discover agents, MCP servers, and workflows created by the community.',
      },
    ],
    primaryCta: {
      label: 'Start exploring →',
      href: 'https://claudepro.directory',
    },
  },
  2: {
    title: 'Getting Started',
    utm: EMAIL_UTM_TEMPLATES.ONBOARDING_GETTING_STARTED,
    content: [
      {
        type: 'paragraph' as const,
        text: 'Ready to dive in? Here are a few ways to get started:',
      },
    ],
    links: [
      {
        title: 'Browse Claude Agents',
        description: 'Pre-configured AI assistants',
        href: 'https://claudepro.directory/agents',
      },
      {
        title: 'Explore MCP Servers',
        description: 'Extend Claude\'s capabilities',
        href: 'https://claudepro.directory/mcp',
      },
      {
        title: 'Read our Guides',
        description: 'Learn advanced techniques',
        href: 'https://claudepro.directory/guides',
      },
    ],
  },
  3: {
    title: 'Power User Tips',
    utm: EMAIL_UTM_TEMPLATES.ONBOARDING_POWER_TIPS,
    content: [
      {
        type: 'paragraph' as const,
        text: 'Want to get more out of Claude? Here are some power user tips:',
      },
    ],
    tips: [
      {
        title: 'Use Collections',
        description: 'Save and organize your favorite tools',
      },
      {
        title: 'Check the Trending page',
        description: 'See what\'s hot this week',
      },
      {
        title: 'Copy configurations',
        description: 'One-click copying to use in your own projects',
      },
    ],
  },
  4: {
    title: 'Join the Community',
    utm: EMAIL_UTM_TEMPLATES.ONBOARDING_COMMUNITY,
    content: [
      {
        type: 'paragraph' as const,
        text: 'Claude Pro Directory is built by the community, for the community.',
      },
      {
        type: 'paragraph' as const,
        text: 'Have something to share? Submit your own creation and help others!',
      },
    ],
    links: [
      {
        title: 'Submit Your Creation',
        description: 'Share your best prompts, rules, or MCP servers',
        href: 'https://claudepro.directory/submit',
      },
      {
        title: 'Join Discord',
        description: 'Connect with other Claude builders',
        href: 'https://discord.gg/claudepro',
      },
    ],
  },
  5: {
    title: 'Stay Engaged',
    utm: EMAIL_UTM_TEMPLATES.ONBOARDING_STAY_ENGAGED,
    content: [
      {
        type: 'paragraph' as const,
        text: "That's a wrap on our welcome series! Here's how to stay connected:",
      },
    ],
    features: [
      {
        emoji: '📬',
        title: 'Weekly digest emails',
        description: 'Get new content delivered every week',
      },
      {
        emoji: '🔔',
        title: 'Bookmark items',
        description: 'Save favorites for later',
      },
      {
        emoji: '💬',
        title: 'Rate and review',
        description: 'Share feedback on tools you\'ve tried',
      },
    ],
    closing: 'Happy building!',
  },
} as const;

/**
 * SequenceEmail Component
 *
 * Usage:
 * ```tsx
 * <SequenceEmail step={1} email="user@example.com" />
 * ```
 */
export function SequenceEmail({ step, email }: SequenceEmailProps) {
  const stepData = SEQUENCE_STEPS[step as keyof typeof SEQUENCE_STEPS];

  if (!stepData) {
    // Fallback for invalid step numbers
    return (
      <BaseLayout
        preview="Claude Pro Directory Update"
        utm={EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME}
      >
        <Section style={contentSectionStyle}>
          <Text style={titleStyle}>Claude Pro Directory Update</Text>
          <Text style={paragraphStyle}>
            Thanks for being part of the Claude Pro Directory community!
          </Text>
        </Section>
        <EmailFooterNote lines={buildSubscriptionFooter('newsletterWelcome', { email })} />
      </BaseLayout>
    );
  }

  const utm = stepData.utm;

  return (
    <BaseLayout preview={stepData.title} utm={utm}>
      <Section style={contentSectionStyle}>
        <Text style={titleStyle}>{stepData.title}</Text>

        {/* Content paragraphs */}
        {stepData.content?.map((item, index) => (
          <Text key={index} style={paragraphStyle}>
            {item.text}
          </Text>
        ))}

        {/* Links section (step 2, 4) */}
        {'links' in stepData && stepData.links && (
          <div style={linksContainerStyle}>
            {stepData.links.map((link, index) => (
              <EmailCard key={index} variant="default" style={linkCardStyle}>
                <Link
                  href={buildEmailCtaUrl(link.href, utm, {
                    content: `link_${index + 1}`,
                  })}
                  style={linkTitleStyle}
                >
                  {link.title}
                </Link>
                <Text style={linkDescriptionStyle}>{link.description}</Text>
              </EmailCard>
            ))}
          </div>
        )}

        {/* Tips section (step 3) */}
        {'tips' in stepData && stepData.tips && (
          <div style={tipsContainerStyle}>
            {stepData.tips.map((tip, index) => (
              <EmailCard key={index} variant="default" style={tipCardStyle}>
                <Text style={tipTitleStyle}>
                  <strong>{tip.title}</strong>
                </Text>
                <Text style={tipDescriptionStyle}>{tip.description}</Text>
              </EmailCard>
            ))}
          </div>
        )}

        {/* Features section (step 5) */}
        {'features' in stepData && stepData.features && (
          <div style={featuresContainerStyle}>
            {stepData.features.map((feature, index) => (
              <EmailCard key={index} variant="default" style={featureCardStyle}>
                <div style={featureHeaderStyle}>
                  <span style={featureEmojiStyle}>{feature.emoji}</span>
                  <Text style={featureTitleStyle}>{feature.title}</Text>
                </div>
                <Text style={featureDescriptionStyle}>{feature.description}</Text>
              </EmailCard>
            ))}
          </div>
        )}

        {/* Primary CTA (step 1) */}
        {'primaryCta' in stepData && stepData.primaryCta && (
          <div style={ctaContainerStyle}>
            <Link
              href={buildEmailCtaUrl(stepData.primaryCta.href, utm, {
                content: 'primary_cta',
              })}
              style={primaryCtaStyle}
            >
              {stepData.primaryCta.label}
            </Link>
          </div>
        )}

        {/* Closing text (step 5) */}
        {'closing' in stepData && stepData.closing && (
          <Text style={closingStyle}>{stepData.closing}</Text>
        )}
      </Section>

      <EmailFooterNote lines={buildSubscriptionFooter('newsletterWelcome', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default SequenceEmail;

// ============================================================================
// Styles
// ============================================================================

const contentSectionStyle: React.CSSProperties = {
  padding: spacing.lg,
};

const titleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md}`,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  lineHeight: typography.lineHeight.relaxed,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.md}`,
};

const linksContainerStyle: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
};

const linkCardStyle: React.CSSProperties = {
  marginBottom: spacing.md,
  padding: spacing.md,
};

const linkTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  textDecoration: 'none',
  display: 'block',
  marginBottom: spacing.xs,
};

const linkDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
};

const tipsContainerStyle: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
};

const tipCardStyle: React.CSSProperties = {
  marginBottom: spacing.md,
  padding: spacing.md,
};

const tipTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs}`,
};

const tipDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
};

const featuresContainerStyle: React.CSSProperties = {
  margin: `${spacing.lg} 0`,
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: spacing.md,
};

const featureCardStyle: React.CSSProperties = {
  padding: spacing.md,
};

const featureHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  marginBottom: spacing.xs,
};

const featureEmojiStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: 0,
};

const featureDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
};

const ctaContainerStyle: React.CSSProperties = {
  margin: `${spacing.xl} 0`,
};

const primaryCtaStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: brandColors.primary,
  color: '#1A1B17',
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
};

const closingStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `${spacing.lg} 0 0`,
};

