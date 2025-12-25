/**
 * MCP Server Launch Email Template
 * Sent to announce the launch of the HeyClaude MCP Server
 *
 * Features:
 * - Product launch announcement
 * - Key features and capabilities
 * - Installation instructions (hosted and self-hosted)
 * - Multiple call-to-action buttons
 * - Dark mode compatible
 * - Clean, modern design
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { EmailFooterNote } from '../components/footer-note';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

export interface McpServerLaunchEmailProps {
  /**
   * Launch date (e.g., "December 15, 2025")
   */
  launchDate?: string;
}

const KEY_FEATURES = [
  {
    emoji: '🔧',
    title: '20 MCP Tools',
    description: 'Search, browse, filter, and interact with directory content',
  },
  {
    emoji: '📦',
    title: '3 Resource Templates',
    description: 'Access content in llms.txt, markdown, JSON, RSS, and Atom formats',
  },
  {
    emoji: '🔐',
    title: 'OAuth 2.1 Authentication',
    description: 'Secure authentication via Supabase Auth',
  },
  {
    emoji: '☁️',
    title: 'Dual Deployment',
    description: 'Hosted Cloudflare Worker or self-hosted NPM package',
  },
] as const;

const QUICK_START_STEPS = [
  {
    step: 1,
    title: 'Use Hosted Endpoint',
    description: 'Add the hosted Cloudflare Worker to your MCP configuration',
    code: `{
  "mcpServers": {
    "heyclaude": {
      "url": "https://mcp.claudepro.directory/mcp"
    }
  }
}`,
  },
  {
    step: 2,
    title: 'Or Install Locally',
    description: 'Run the MCP server locally using NPM',
    code: 'npx @heyclaude/mcp-server@latest start',
  },
] as const;

export function McpServerLaunchEmail({ launchDate }: McpServerLaunchEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const mcpDocsUrl = `${baseUrl}/mcp`;
  const utm = EMAIL_UTM_TEMPLATES.MCP_SERVER_LAUNCH;

  const formattedDate =
    launchDate ||
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <BaseLayout
      preview="🚀 Announcing HeyClaude MCP Server - Programmatic access to Claude Pro Directory"
      utm={utm}
    >
      <Section style={heroSection}>
        <EmailBadge variant="primary" style={badgeStyle}>
          🚀 New Launch
        </EmailBadge>
        <Text style={heroTitleStyle}>Introducing HeyClaude MCP Server</Text>
        <Text style={heroSubtitleStyle}>
          Programmatic access to Claude Pro Directory through the Model Context Protocol
        </Text>
        {launchDate && <Text style={launchDateStyle}>Launched on {formattedDate}</Text>}
        <div style={heroActionRow}>
          <Link
            href={buildEmailCtaUrl(mcpDocsUrl, utm, { content: 'hero_primary_cta' })}
            style={primaryCtaStyle}
          >
            View Documentation
          </Link>
          <Link
            href={buildEmailCtaUrl(`${baseUrl}/mcp`, utm, { content: 'hero_secondary_cta' })}
            style={secondaryCtaStyle}
          >
            Explore MCP Servers →
          </Link>
        </div>
      </Section>

      <Section style={featuresSection}>
        <Text style={sectionTitleStyle}>What You Get</Text>
        <div style={featuresGrid}>
          {KEY_FEATURES.map((feature, index) => (
            <EmailCard key={index} style={featureCardStyle}>
              <Text style={featureEmojiStyle}>{feature.emoji}</Text>
              <Text style={featureTitleStyle}>{feature.title}</Text>
              <Text style={featureDescriptionStyle}>{feature.description}</Text>
            </EmailCard>
          ))}
        </div>
      </Section>

      <Section style={quickStartSection}>
        <Text style={sectionTitleStyle}>Quick Start</Text>
        <Text style={sectionDescriptionStyle}>
          Get started in minutes with either hosted or self-hosted deployment
        </Text>

        {QUICK_START_STEPS.map((step, index) => (
          <EmailCard key={index} style={stepCardStyle}>
            <div style={stepHeaderStyle}>
              <EmailBadge variant="primary" size="sm" style={stepNumberStyle}>
                Step {step.step}
              </EmailBadge>
              <Text style={stepTitleStyle}>{step.title}</Text>
            </div>
            <Text style={stepDescriptionStyle}>{step.description}</Text>
            <div style={codeBlockStyle}>
              <Text style={codeTextStyle}>{step.code}</Text>
            </div>
          </EmailCard>
        ))}
      </Section>

      <Section style={useCasesSection}>
        <Text style={sectionTitleStyle}>Use Cases</Text>
        <Text style={sectionDescriptionStyle}>The HeyClaude MCP Server enables AI agents to:</Text>
        <ul style={useCasesListStyle}>
          <li style={useCaseItemStyle}>
            <Text style={useCaseTextStyle}>
              🔍 Search and discover Claude content programmatically
            </Text>
          </li>
          <li style={useCaseItemStyle}>
            <Text style={useCaseTextStyle}>📥 Download content formatted for your platform</Text>
          </li>
          <li style={useCaseItemStyle}>
            <Text style={useCaseTextStyle}>🎯 Access trending, featured, and popular content</Text>
          </li>
          <li style={useCaseItemStyle}>
            <Text style={useCaseTextStyle}>📊 Get category configurations and metadata</Text>
          </li>
          <li style={useCaseItemStyle}>
            <Text style={useCaseTextStyle}>
              🤝 Submit new content and interact with the directory
            </Text>
          </li>
        </ul>
      </Section>

      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Ready to integrate?</Text>
        <Text style={ctaDescriptionStyle}>
          Start using the HeyClaude MCP Server today and give your AI agents access to thousands of
          Claude resources.
        </Text>
        <div style={ctaButtonRow}>
          <Link
            href={buildEmailCtaUrl(mcpDocsUrl, utm, { content: 'cta_primary' })}
            style={primaryCtaStyle}
          >
            Get Started
          </Link>
          <Link
            href={buildEmailCtaUrl(`${baseUrl}/trending`, utm, { content: 'cta_secondary' })}
            style={secondaryCtaStyle}
          >
            Browse Directory
          </Link>
        </div>
      </Section>

      <EmailFooterNote
        lines={[
          {
            type: 'text',
            text: 'You are receiving this email because you are subscribed to Claude Pro Directory updates.',
          },
          {
            type: 'text',
            text: 'To manage your email preferences, please visit your account settings.',
          },
        ]}
      />
    </BaseLayout>
  );
}

export default McpServerLaunchEmail;

const heroSection: React.CSSProperties = {
  backgroundColor: emailTheme.bgSecondary,
  borderRadius: spacing.xl,
  padding: `${spacing.xl} ${spacing.xl}`,
  border: `1px solid ${emailTheme.borderLight}`,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
  color: emailTheme.textPrimary,
  textAlign: 'center',
};

const badgeStyle: React.CSSProperties = {
  marginBottom: spacing.md,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  lineHeight: typography.lineHeight.relaxed,
  fontWeight: typography.fontWeight.bold,
  margin: 0,
};

const heroSubtitleStyle: React.CSSProperties = {
  margin: `${spacing.md} 0 ${spacing.md}`,
  fontSize: typography.fontSize.lg,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
};

const launchDateStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.lg}`,
};

const heroActionRow: React.CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: spacing.lg,
};

const primaryCtaStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#05060a',
  padding: '12px 24px',
  borderRadius: '9999px',
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
  display: 'inline-block',
};

const secondaryCtaStyle: React.CSSProperties = {
  color: brandColors.primary,
  padding: '12px 24px',
  borderRadius: '9999px',
  border: `1px solid ${brandColors.primary}`,
  fontWeight: typography.fontWeight.semibold,
  textDecoration: 'none',
  fontSize: typography.fontSize.base,
  display: 'inline-block',
  backgroundColor: 'transparent',
};

const featuresSection: React.CSSProperties = {
  marginTop: spacing.xl,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  marginBottom: spacing.md,
  textAlign: 'center',
};

const sectionDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  marginBottom: spacing.lg,
  textAlign: 'center',
  lineHeight: typography.lineHeight.relaxed,
};

const featuresGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: spacing.md,
  marginTop: spacing.lg,
};

const featureCardStyle: React.CSSProperties = {
  padding: spacing.lg,
  textAlign: 'center',
};

const featureEmojiStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  margin: `0 0 ${spacing.sm}`,
  lineHeight: 1,
};

const featureTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  margin: `0 0 ${spacing.xs}`,
  color: emailTheme.textPrimary,
};

const featureDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  margin: 0,
  lineHeight: typography.lineHeight.normal,
};

const quickStartSection: React.CSSProperties = {
  marginTop: spacing.xl,
};

const stepCardStyle: React.CSSProperties = {
  marginBottom: spacing.lg,
  padding: spacing.lg,
};

const stepHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  marginBottom: spacing.sm,
};

const stepNumberStyle: React.CSSProperties = {
  flexShrink: 0,
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  margin: 0,
  color: emailTheme.textPrimary,
};

const stepDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.md}`,
  lineHeight: typography.lineHeight.normal,
};

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: spacing.md,
  padding: spacing.md,
  marginTop: spacing.sm,
  fontFamily: 'monospace',
  overflow: 'auto',
};

const codeTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textPrimary,
  margin: 0,
  whiteSpace: 'pre',
  fontFamily: 'monospace',
  lineHeight: typography.lineHeight.relaxed,
};

const useCasesSection: React.CSSProperties = {
  marginTop: spacing.xl,
};

const useCasesListStyle: React.CSSProperties = {
  listStyleType: 'none',
  padding: 0,
  margin: `${spacing.lg} 0 0`,
};

const useCaseItemStyle: React.CSSProperties = {
  marginBottom: spacing.md,
  paddingLeft: 0,
};

const useCaseTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: 0,
  lineHeight: typography.lineHeight.relaxed,
};

const ctaSection: React.CSSProperties = {
  marginTop: spacing.xl,
  padding: spacing.xl,
  borderRadius: spacing.xl,
  backgroundColor: emailTheme.bgSecondary,
  border: `1px solid ${emailTheme.borderDefault}`,
  textAlign: 'center',
};

const ctaTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  margin: 0,
  color: emailTheme.textPrimary,
};

const ctaDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: `${spacing.md} 0 ${spacing.lg}`,
  lineHeight: typography.lineHeight.relaxed,
};

const ctaButtonRow: React.CSSProperties = {
  display: 'flex',
  gap: spacing.md,
  justifyContent: 'center',
  flexWrap: 'wrap',
};
