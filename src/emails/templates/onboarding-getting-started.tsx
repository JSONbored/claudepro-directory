/**
 * Onboarding Email 2: Getting Started
 * Sent 2 days after signup
 *
 * Goal: Drive first interaction with the directory
 * Content: How to use configurations, top agents, quick start guide
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { addUTMToURL } from '@/src/lib/utils/email-utm';
import { EMAIL_UTM_TEMPLATES } from '@/src/lib/utils/utm-templates';
import { BaseLayout } from '../layouts/base-layout';
import {
  cardStyle,
  contentSection,
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
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

export interface OnboardingGettingStartedProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Getting Started Email Component (Step 2 of 5)
 */
export function OnboardingGettingStarted({ email }: OnboardingGettingStartedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_GETTING_STARTED;

  return (
    <BaseLayout
      preview="Getting Started with Claude Pro Directory - Your Quick Start Guide"
      utm={utm}
    >
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>Ready to Supercharge Claude? 🚀</Text>
        <Text style={subheadingStyle}>
          Let's get you started with the best configurations and tools
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Quick Start Guide */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>Quick Start in 3 Steps</Text>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>1</Text>
          <Text style={stepTitleStyle}>Browse Top Agents</Text>
          <Text style={stepDescStyle}>
            Start with our most popular AI agents. These pre-configured prompts help Claude handle
            specific tasks like code review, API building, and technical documentation.
          </Text>
          <Button
            href={addUTMToURL(`${baseUrl}/agents`, { ...utm, content: 'step_1_agents' })}
            style={stepButtonStyle}
          >
            View Top Agents
          </Button>
        </Section>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>2</Text>
          <Text style={stepTitleStyle}>Try MCP Servers</Text>
          <Text style={stepDescStyle}>
            Model Context Protocol (MCP) servers extend Claude's capabilities with real-time data,
            tool integrations, and custom workflows.
          </Text>
          <Button
            href={addUTMToURL(`${baseUrl}/mcp`, { ...utm, content: 'step_2_mcp' })}
            style={stepButtonStyle}
          >
            Explore MCP Servers
          </Button>
        </Section>

        <Section style={cardStyle}>
          <Text style={stepNumberStyle}>3</Text>
          <Text style={stepTitleStyle}>Add Custom Rules</Text>
          <Text style={stepDescStyle}>
            Customize Claude's behavior with rules that define coding standards, response formats,
            and project-specific guidelines.
          </Text>
          <Button
            href={addUTMToURL(`${baseUrl}/rules`, { ...utm, content: 'step_3_rules' })}
            style={stepButtonStyle}
          >
            Browse Rules
          </Button>
        </Section>
      </Section>

      <Hr style={dividerStyle} />

      {/* Featured Content */}
      <Section style={contentSection}>
        <Text style={sectionTitleStyle}>🌟 Start With These</Text>
        <Text style={paragraphStyle}>Our community's most loved configurations for beginners:</Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>API Builder Agent</strong> - Generate REST APIs with best
            practices
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Code Reviewer</strong> - Automated code review with security
            checks
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Database Specialist</strong> - SQL optimization and schema
            design
          </li>
        </ul>

        <Button
          href={addUTMToURL(`${baseUrl}/trending`, { ...utm, content: 'trending_cta' })}
          style={primaryButtonStyle}
        >
          See All Trending
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Help Section */}
      <Section style={helpSection}>
        <Text style={helpTitleStyle}>Need Help Getting Started?</Text>
        <Text style={paragraphStyle}>
          Check out our tutorials and guides for step-by-step instructions on using Claude
          configurations effectively.
        </Text>
        <Button
          href={addUTMToURL(`${baseUrl}/guides`, { ...utm, content: 'guides_cta' })}
          style={secondaryButtonStyle}
        >
          View Guides
        </Button>
      </Section>

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          This is part 2 of your 5-email onboarding series. Next up: Power User Tips!
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Template-specific custom styles
 * (Styles specific to numbered step workflow patterns)
 */

const stepNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: brandColors.primary,
  margin: `0 0 ${spacing.xs} 0`,
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

const stepDescStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.md} 0`,
};

const stepButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#ffffff',
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.sm,
  textDecoration: 'none',
  display: 'inline-block',
  border: 'none',
};

const helpSection: React.CSSProperties = {
  textAlign: 'center',
  backgroundColor: emailTheme.bgTertiary,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const helpTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
};

/**
 * Export default for easier imports
 */
export default OnboardingGettingStarted;
