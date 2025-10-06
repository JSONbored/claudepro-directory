/**
 * Onboarding Email 2: Getting Started
 * Sent 2 days after signup
 *
 * Goal: Drive first interaction with the directory
 * Content: How to use configurations, top agents, quick start guide
 */

import { Button, Hr, Section, Text } from "@react-email/components";
import type * as React from "react";
import { BaseLayout } from "../layouts/base-layout";
import {
  borderRadius,
  brandColors,
  emailTheme,
  spacing,
  typography,
} from "../utils/theme";

export interface OnboardingGettingStartedProps {
  /**
   * Subscriber's email address
   */
  email: string;
}

/**
 * Getting Started Email Component (Step 2 of 5)
 */
export function OnboardingGettingStarted({
  email,
}: OnboardingGettingStartedProps) {
  return (
    <BaseLayout preview="Getting Started with ClaudePro Directory - Your Quick Start Guide">
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

        <Section style={stepCard}>
          <Text style={stepNumberStyle}>1</Text>
          <Text style={stepTitleStyle}>Browse Top Agents</Text>
          <Text style={stepDescStyle}>
            Start with our most popular AI agents. These pre-configured prompts
            help Claude handle specific tasks like code review, API building,
            and technical documentation.
          </Text>
          <Button
            href="https://claudepro.directory/agents"
            style={stepButtonStyle}
          >
            View Top Agents
          </Button>
        </Section>

        <Section style={stepCard}>
          <Text style={stepNumberStyle}>2</Text>
          <Text style={stepTitleStyle}>Try MCP Servers</Text>
          <Text style={stepDescStyle}>
            Model Context Protocol (MCP) servers extend Claude's capabilities
            with real-time data, tool integrations, and custom workflows.
          </Text>
          <Button
            href="https://claudepro.directory/mcp"
            style={stepButtonStyle}
          >
            Explore MCP Servers
          </Button>
        </Section>

        <Section style={stepCard}>
          <Text style={stepNumberStyle}>3</Text>
          <Text style={stepTitleStyle}>Add Custom Rules</Text>
          <Text style={stepDescStyle}>
            Customize Claude's behavior with rules that define coding standards,
            response formats, and project-specific guidelines.
          </Text>
          <Button
            href="https://claudepro.directory/rules"
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
        <Text style={paragraphStyle}>
          Our community's most loved configurations for beginners:
        </Text>

        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong style={strongStyle}>API Builder Agent</strong> - Generate
            REST APIs with best practices
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Code Reviewer</strong> - Automated code
            review with security checks
          </li>
          <li style={listItemStyle}>
            <strong style={strongStyle}>Database Specialist</strong> - SQL
            optimization and schema design
          </li>
        </ul>

        <Button
          href="https://claudepro.directory/trending"
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
          Check out our tutorials and guides for step-by-step instructions on
          using Claude configurations effectively.
        </Text>
        <Button
          href="https://claudepro.directory/guides/tutorials"
          style={secondaryButtonStyle}
        >
          View Tutorials
        </Button>
      </Section>

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          This is part 2 of your 5-email onboarding series. Next up: Power User
          Tips!
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Email-safe inline styles
 */

const heroSection: React.CSSProperties = {
  textAlign: "center",
  marginBottom: spacing.lg,
};

const headingStyle: React.CSSProperties = {
  fontSize: typography.fontSize["3xl"],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
  lineHeight: typography.lineHeight.tight,
};

const subheadingStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  color: emailTheme.textSecondary,
  margin: 0,
  lineHeight: typography.lineHeight.normal,
};

const contentSection: React.CSSProperties = {
  marginTop: spacing.lg,
  marginBottom: spacing.lg,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize["2xl"],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.md} 0`,
};

const stepCard: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.md,
};

const stepNumberStyle: React.CSSProperties = {
  fontSize: typography.fontSize["2xl"],
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
  color: "#ffffff",
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.sm,
  textDecoration: "none",
  display: "inline-block",
  border: "none",
};

const listStyle: React.CSSProperties = {
  margin: `${spacing.md} 0`,
  paddingLeft: spacing.lg,
};

const listItemStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.relaxed,
  marginBottom: spacing.sm,
};

const strongStyle: React.CSSProperties = {
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: "#ffffff",
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: "none",
  display: "inline-block",
  marginTop: spacing.sm,
  border: "none",
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  color: emailTheme.textPrimary,
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.base,
  padding: `${spacing.md} ${spacing.xl}`,
  borderRadius: borderRadius.md,
  textDecoration: "none",
  display: "inline-block",
  marginTop: spacing.sm,
  border: `1px solid ${emailTheme.borderDefault}`,
};

const helpSection: React.CSSProperties = {
  textAlign: "center",
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

const dividerStyle: React.CSSProperties = {
  borderColor: emailTheme.borderDefault,
  margin: `${spacing.xl} 0`,
};

const footerNoteSection: React.CSSProperties = {
  marginTop: spacing.lg,
  textAlign: "center",
};

const footerNoteStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.xs} 0`,
};

/**
 * Export default for easier imports
 */
export default OnboardingGettingStarted;
