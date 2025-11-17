/**
 * OAuth Sign-Up Email Template
 * Sent when a user signs up via OAuth (Google, GitHub, Discord)
 *
 * Features:
 * - Welcome message for new platform accounts
 * - Platform-focused (not newsletter-focused)
 * - Clear CTAs to explore directory and manage account
 * - Responsive design
 * - Email client compatible
 */

import React from 'npm:react@18.3.1';
import { Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout } from '../base-template.tsx';
import { EmailFooterNote } from '../components/footer-note.tsx';
import { buildSubscriptionFooter } from '../config/footer-presets.ts';
import { buildEmailCtaUrl } from '../cta.ts';
import { HeyClaudeEmailLogo } from '../components/heyclaude-logo.tsx';
import { brandColors, emailTheme, spacing, typography } from '../theme.ts';

const GETTING_STARTED_STEPS = [
  {
    emoji: '🔍',
    title: 'Explore the Directory',
    description: 'Browse 300+ Claude agents, MCP servers, and workflows',
  },
  {
    emoji: '⭐',
    title: 'Save Favorites',
    description: 'Bookmark tools you want to use later',
  },
  {
    emoji: '📚',
    title: 'Build Collections',
    description: 'Organize tools into custom collections',
  },
  {
    emoji: '💼',
    title: 'Manage Your Account',
    description: 'Update your profile and preferences',
  },
] as const;

export interface SignupOAuthProps {
  /**
   * User's email address
   */
  email: string;

  /**
   * OAuth provider used for signup (optional, for personalization)
   * @default undefined
   */
  provider?: 'google' | 'github' | 'discord';
}

/**
 * SignupOAuth Email Component
 *
 * Usage:
 * ```tsx
 * <SignupOAuth
 *   email="user@example.com"
 *   provider="google"
 * />
 * ```
 */
export function SignupOAuth({ email }: SignupOAuthProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;

  return (
    <BaseLayout
      preview="Welcome to Claude Pro Directory! Your account is ready to explore 300+ Claude tools."
      utm={utm}
    >
      <Section style={heroShellStyle}>
        <div style={heroHeaderRow}>
          <HeyClaudeEmailLogo size="lg" />
          <span style={badgeStyle}>Account Created</span>
        </div>
        <Text style={heroTitleStyle}>
          Welcome to <span style={heroHighlightStyle}>Claude Pro Directory</span>
        </Text>
        <Text style={heroSubtitleStyle}>
          Your account is ready! Start exploring 300+ Claude agents, MCP servers, workflows, and
          tools—all curated and tested by the community.
        </Text>
        <div style={heroActionRow}>
          <a
            href={buildEmailCtaUrl(baseUrl, utm, { content: 'hero_primary_cta' })}
            style={primaryCtaStyle}
          >
            Explore Directory
          </a>
          <a
            href={buildEmailCtaUrl(`${baseUrl}/account/settings`, utm, { content: 'hero_secondary_cta' })}
            style={secondaryCtaStyle}
          >
            Manage Account →
          </a>
        </div>
      </Section>

      <Section style={featureHeaderStyle}>
        <Text style={eyebrowStyle}>Get Started</Text>
        <Text style={featureTitleStyle}>Everything you need to build with Claude</Text>
      </Section>

      <Section style={cardGridStyle}>
        {GETTING_STARTED_STEPS.map((item) => (
          <div key={item.title} style={featureCardStyle}>
            <div style={featureIconStyle}>{item.emoji}</div>
            <Text style={featureCardTitle}>{item.title}</Text>
            <Text style={featureCardDescription}>{item.description}</Text>
          </div>
        ))}
      </Section>

      <Section style={spotlightSectionStyle}>
        <Text style={spotlightLabelStyle}>What's Next?</Text>
        <Text style={spotlightTitleStyle}>
          Join thousands of Claude builders discovering new tools every week.
        </Text>
        <Text style={spotlightDescriptionStyle}>
          We'll send you weekly updates on new agents, MCP servers, and community highlights. You
          can manage your preferences anytime in your account settings.
        </Text>
      </Section>

      <Section style={ctaStripStyle}>
        <div>
          <Text style={ctaStripTitle}>Ready to dive in?</Text>
          <Text style={ctaStripSubtitle}>Start exploring the directory and save your favorites.</Text>
        </div>
        <a
          href={buildEmailCtaUrl(`${baseUrl}/trending`, utm, { content: 'cta_strip' })}
          style={ctaStripButton}
        >
          See What's Trending
        </a>
      </Section>

      <Hr style={hrStyle} />

      <EmailFooterNote lines={buildSubscriptionFooter('signupOAuth', { email })} />
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default SignupOAuth;

export async function renderSignupOAuthEmail(props: SignupOAuthProps): Promise<string> {
  const { renderEmailTemplate } = await import('../base-template.tsx');
  return renderEmailTemplate(SignupOAuth, props);
}

const heroShellStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  borderRadius: spacing.xl,
  padding: `${spacing.xl} ${spacing.xl}`,
  border: `1px solid ${emailTheme.borderLight}`,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
  color: emailTheme.textPrimary,
};

const heroHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
  gap: spacing.sm,
};

const badgeStyle: React.CSSProperties = {
  borderRadius: '9999px',
  padding: '6px 14px',
  fontSize: typography.fontSize.sm,
  color: '#1A1B17',
  backgroundColor: brandColors.primary,
  fontWeight: typography.fontWeight.semibold,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  lineHeight: typography.lineHeight.relaxed,
  fontWeight: typography.fontWeight.bold,
  margin: 0,
};

const heroHighlightStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  padding: '2px 12px',
  borderRadius: '9999px',
  color: '#1A1B17',
  fontWeight: typography.fontWeight.bold,
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: `${spacing.md} 0 ${spacing.lg}`,
  fontSize: typography.fontSize.lg,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
};

const heroActionRow: React.CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  flexWrap: 'wrap',
};

const primaryCtaStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#05060a',
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
};

const secondaryCtaStyle: React.CSSProperties = {
  border: `1px solid ${emailTheme.borderDefault}`,
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
  backgroundColor: emailTheme.bgTertiary,
};

const featureHeaderStyle: React.CSSProperties = {
  margin: `${spacing.xl} 0 ${spacing.md}`,
};

const eyebrowStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  fontSize: typography.fontSize.xs,
  color: emailTheme.textSecondary,
  margin: 0,
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  margin: `${spacing.sm} 0 0`,
};

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: spacing.md,
};

const featureCardStyle: React.CSSProperties = {
  borderRadius: spacing.lg,
  padding: spacing.lg,
  border: `1px solid ${emailTheme.borderDefault}`,
  backgroundColor: emailTheme.bgSecondary,
};

const featureIconStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  marginBottom: spacing.sm,
};

const featureCardTitle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  margin: 0,
};

const featureCardDescription: React.CSSProperties = {
  margin: `${spacing.xs} 0 0`,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.normal,
};

const spotlightSectionStyle: React.CSSProperties = {
  marginTop: spacing.xl,
  padding: spacing.lg,
  borderRadius: spacing.xl,
  border: `1px solid ${emailTheme.borderDefault}`,
  backgroundColor: emailTheme.bgSecondary,
};

const spotlightLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: brandColors.primaryLight,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};

const spotlightTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  margin: `${spacing.sm} 0`,
  fontWeight: typography.fontWeight.bold,
};

const spotlightDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
};

const ctaStripStyle: React.CSSProperties = {
  marginTop: spacing.xl,
  padding: `${spacing.lg} ${spacing.xl}`,
  borderRadius: spacing.xl,
  backgroundColor: emailTheme.bgQuaternary,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: spacing.md,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const ctaStripTitle: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
};

const ctaStripSubtitle: React.CSSProperties = {
  margin: `${spacing.xs} 0 0`,
  color: emailTheme.textSecondary,
};

const ctaStripButton: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '9999px',
  border: `1px solid ${brandColors.primary}`,
  textDecoration: 'none',
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  backgroundColor: 'transparent',
};

const hrStyle: React.CSSProperties = {
  borderColor: emailTheme.borderDefault,
  margin: `${spacing.xl} 0`,
};
