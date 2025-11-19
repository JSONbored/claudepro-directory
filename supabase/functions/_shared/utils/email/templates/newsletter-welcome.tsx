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

import { Hr, Section, Text } from "npm:@react-email/components@0.0.22";
// React import required for Deno JSX
import React from "npm:react@18.3.1";
// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;
import { BaseLayout } from "../base-template.tsx";
import { EmailFooterNote } from "../components/footer-note.tsx";
import { HeyClaudeEmailLogo } from "../components/heyclaude-logo.tsx";
import { buildSubscriptionFooter } from "../config/footer-presets.ts";
import { buildEmailCtaUrl } from "../cta.ts";
import { brandColors, emailTheme, spacing, typography } from "../theme.ts";
import { EMAIL_UTM_TEMPLATES } from "../utm-templates.ts";

const WHAT_TO_EXPECT = [
	{
		emoji: "🤖",
		title: "New Claude Agents",
		description: "Discover powerful AI configurations",
	},
	{
		emoji: "🔌",
		title: "MCP Servers",
		description: "Latest Model Context Protocol integrations",
	},
	{
		emoji: "📚",
		title: "Guides & Tutorials",
		description: "Learn advanced Claude techniques",
	},
	{
		emoji: "💡",
		title: "Tips & Tricks",
		description: "Productivity hacks from the community",
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
	const baseUrl = "https://claudepro.directory";
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;

	return (
		<BaseLayout
			preview="Welcome to Claude Pro Directory! Get weekly updates on new tools & guides."
			utm={utm}
		>
			<Section style={heroShellStyle}>
				<div style={heroHeaderRow}>
					<HeyClaudeEmailLogo size="lg" />
					<span style={badgeStyle}>Weekly Claude drops</span>
				</div>
				<Text style={heroTitleStyle}>
					The home for <span style={heroHighlightStyle}>Claude builders</span>
				</Text>
				<Text style={heroSubtitleStyle}>
					Every Monday we’ll deliver the most-loved agents, MCP servers, and
					actionable playbooks from the claudepro.community—curated, tested, and
					ready to ship.
				</Text>
				<div style={heroActionRow}>
					<a
						href={buildEmailCtaUrl(baseUrl, utm, {
							content: "hero_primary_cta",
						})}
						style={primaryCtaStyle}
					>
						Browse the Directory
					</a>
					<a
						href={buildEmailCtaUrl(`${baseUrl}/trending`, utm, {
							content: "hero_secondary_cta",
						})}
						style={secondaryCtaStyle}
					>
						See What’s Trending →
					</a>
				</div>
				<div style={heroMetricsRow}>
					{HERO_STATS.map((stat) => (
						<div key={stat.label} style={heroMetricCard}>
							<Text style={heroMetricValue}>{stat.value}</Text>
							<Text style={heroMetricLabel}>{stat.label}</Text>
						</div>
					))}
				</div>
			</Section>

			<Section style={featureHeaderStyle}>
				<Text style={eyebrowStyle}>Inside each edition</Text>
				<Text style={featureTitleStyle}>
					Handpicked intel from the Claude power community
				</Text>
			</Section>

			<Section style={cardGridStyle}>
				{WHAT_TO_EXPECT.map((item) => (
					<div key={item.title} style={featureCardStyle}>
						<div style={featureIconStyle}>{item.emoji}</div>
						<Text style={featureCardTitle}>{item.title}</Text>
						<Text style={featureCardDescription}>{item.description}</Text>
					</div>
				))}
			</Section>

			<Section style={spotlightSectionStyle}>
				<Text style={spotlightLabelStyle}>This week’s spotlight</Text>
				<Text style={spotlightTitleStyle}>
					Claude builders sharing the workflows they actually ship with.
				</Text>
				<Text style={spotlightDescriptionStyle}>
					Expect teardown videos, MCP recipes, and scripts you can clone
					instantly. You’re joining a creator community that openly shares the
					good stuff.
				</Text>
			</Section>

			<Section style={ctaStripStyle}>
				<div>
					<Text style={ctaStripTitle}>Ready when you are</Text>
					<Text style={ctaStripSubtitle}>
						Start bookmarking favorites so we can personalize drops.
					</Text>
				</div>
				<a
					href={buildEmailCtaUrl(`${baseUrl}/u/library`, utm, {
						content: "cta_strip",
					})}
					style={ctaStripButton}
				>
					Build my library
				</a>
			</Section>

			<Hr style={hrStyle} />

			<EmailFooterNote
				lines={buildSubscriptionFooter("newsletterWelcome", { email })}
			/>
		</BaseLayout>
	);
}

/**
 * Export default for easier imports
 */
export default NewsletterWelcome;

export async function renderNewsletterWelcomeEmail(
	props: NewsletterWelcomeProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("../base-template.tsx");
	return renderEmailTemplate(NewsletterWelcome, props);
}

const heroShellStyle: React.CSSProperties = {
	backgroundColor: emailTheme.bgSecondary,
	borderRadius: spacing.xl,
	padding: `${spacing.xl} ${spacing.xl}`,
	border: `1px solid ${emailTheme.borderLight}`,
	boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
	color: emailTheme.textPrimary,
};

const heroHeaderRow: React.CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: spacing.md,
	gap: spacing.sm,
};

const badgeStyle: React.CSSProperties = {
	borderRadius: "9999px",
	padding: "6px 14px",
	fontSize: typography.fontSize.sm,
	color: "#1A1B17",
	backgroundColor: brandColors.primary,
	fontWeight: typography.fontWeight.semibold,
};

const heroTitleStyle: React.CSSProperties = {
	fontSize: typography.fontSize["3xl"],
	lineHeight: typography.lineHeight.relaxed,
	fontWeight: typography.fontWeight.bold,
	margin: 0,
};

const heroHighlightStyle: React.CSSProperties = {
	backgroundColor: brandColors.primary,
	padding: "2px 12px",
	borderRadius: "9999px",
	color: "#1A1B17",
	fontWeight: typography.fontWeight.bold,
};

const heroSubtitleStyle: React.CSSProperties = {
	margin: `${spacing.md} 0 ${spacing.lg}`,
	fontSize: typography.fontSize.lg,
	color: emailTheme.textSecondary,
	lineHeight: typography.lineHeight.relaxed,
};

const heroActionRow: React.CSSProperties = {
	display: "flex",
	gap: spacing.md,
	flexWrap: "wrap",
	marginBottom: spacing.lg,
};

const primaryCtaStyle: React.CSSProperties = {
	backgroundColor: brandColors.primary,
	color: "#05060a",
	padding: "12px 24px",
	borderRadius: "9999px",
	fontWeight: typography.fontWeight.semibold,
	textDecoration: "none",
	fontSize: typography.fontSize.base,
};

const secondaryCtaStyle: React.CSSProperties = {
	border: `1px solid ${emailTheme.borderDefault}`,
	padding: "12px 24px",
	borderRadius: "9999px",
	fontWeight: typography.fontWeight.semibold,
	color: emailTheme.textPrimary,
	textDecoration: "none",
	fontSize: typography.fontSize.base,
	backgroundColor: emailTheme.bgTertiary,
};

const heroMetricsRow: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
	gap: spacing.sm,
};

const heroMetricCard: React.CSSProperties = {
	padding: spacing.md,
	borderRadius: spacing.md,
	border: `1px solid ${emailTheme.borderDefault}`,
	backgroundColor: "rgba(255,255,255,0.02)",
};

const heroMetricValue: React.CSSProperties = {
	fontSize: typography.fontSize["2xl"],
	fontWeight: typography.fontWeight.bold,
	margin: 0,
};

const heroMetricLabel: React.CSSProperties = {
	margin: "4px 0 0",
	fontSize: typography.fontSize.sm,
	color: emailTheme.textSecondary,
};

const featureHeaderStyle: React.CSSProperties = {
	margin: `${spacing.xl} 0 ${spacing.md}`,
};

const eyebrowStyle: React.CSSProperties = {
	textTransform: "uppercase",
	letterSpacing: "0.2em",
	fontSize: typography.fontSize.xs,
	color: emailTheme.textSecondary,
	margin: 0,
};

const featureTitleStyle: React.CSSProperties = {
	fontSize: typography.fontSize["2xl"],
	fontWeight: typography.fontWeight.bold,
	margin: `${spacing.sm} 0 0`,
};

const cardGridStyle: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
	gap: spacing.md,
};

const featureCardStyle: React.CSSProperties = {
	borderRadius: spacing.lg,
	padding: spacing.lg,
	border: `1px solid ${emailTheme.borderDefault}`,
	backgroundColor: emailTheme.bgSecondary,
};

const featureIconStyle: React.CSSProperties = {
	fontSize: typography.fontSize["2xl"],
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
	letterSpacing: "0.2em",
	textTransform: "uppercase",
};

const spotlightTitleStyle: React.CSSProperties = {
	fontSize: typography.fontSize["2xl"],
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
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
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
	padding: "12px 24px",
	borderRadius: "9999px",
	border: `1px solid ${brandColors.primary}`,
	textDecoration: "none",
	fontWeight: typography.fontWeight.semibold,
	color: brandColors.primary,
	backgroundColor: "transparent",
};

const hrStyle: React.CSSProperties = {
	borderColor: emailTheme.borderDefault,
	margin: `${spacing.xl} 0`,
};

const HERO_STATS = [
	{ label: "Claude builders", value: "12,800+" },
	{ label: "MCP recipes", value: "420" },
	{ label: "Weekly opens", value: "78%" },
] as const;
