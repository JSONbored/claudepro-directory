/**
 * Contact Submission User Confirmation Email Template
 * Sent to user after submitting contact form via terminal
 */

import { Hr, Section, Text } from "npm:@react-email/components@0.0.22";
// React import required for Deno JSX
import React from "npm:react@18.3.1";
// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;
import type { Database as DatabaseGenerated } from "@heyclaude/database-types";
import { BaseLayout } from "@heyclaude/edge-runtime/utils/email/base-template.tsx";

type ContactCategory = DatabaseGenerated['public']['Enums']['contact_category'];
import {
	contentSection,
	dividerStyle,
	headingStyle,
	listItemStyle,
	listStyle,
	paragraphStyle,
	subheadingStyle,
} from "@heyclaude/edge-runtime/utils/email/common-styles.ts";
import { buildEmailCtaUrl } from "@heyclaude/edge-runtime/utils/email/cta.ts";
import { emailTheme, spacing, typography } from "@heyclaude/edge-runtime/utils/email/theme.ts";
import { EMAIL_UTM_TEMPLATES } from "@heyclaude/edge-runtime/utils/email/utm-templates.ts";

export interface ContactSubmissionUserProps {
	name: string;
	category: ContactCategory;
}

export function ContactSubmissionUser({
	name,
	category,
}: ContactSubmissionUserProps) {
	const baseUrl = "https://claudepro.directory";
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;

	// Category-specific response messages
	const categoryMessages: Record<ContactCategory, string> = {
		bug: "We'll investigate the issue and follow up with you shortly.",
		feature: "We'll review your suggestion and consider it for our roadmap.",
		partnership: "We're excited to explore opportunities with you!",
		general: "We'll get back to you as soon as possible.",
		other: "We'll review your message and respond soon.",
	};

	const responseMessage = categoryMessages[category];

	return (
		<BaseLayout
			preview="We received your message and will respond soon!"
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>Thanks for reaching out, {name}! 🎉</Text>
				<Text style={subheadingStyle}>
					We've received your <strong>{category}</strong> message via our
					terminal.
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>{responseMessage}</Text>
			</Section>

			<Section style={whatsNextSectionStyle}>
				<Text style={whatsNextTitleStyle}>What happens next?</Text>
				<ul style={listStyle}>
					<li style={checklistItemStyle}>
						📬 We'll review your message within 24 hours
					</li>
					<li style={checklistItemStyle}>
						📧 You'll hear back from us via email
					</li>
					<li style={checklistItemStyle}>
						⏱️ Response time: Usually within 24-48 hours
					</li>
				</ul>
			</Section>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong>In the meantime, you might find help in:</strong>
				</Text>
				<div style={linkGridStyle}>
					<a
						href={buildEmailCtaUrl(`${baseUrl}/help`, utm, {
							content: "help_center",
						})}
						style={linkCardStyle}
					>
						📚 Help Center
					</a>
					<a
						href={buildEmailCtaUrl(
							"https://github.com/JSONbored/claudepro-directory/discussions",
							utm,
							{ content: "discussions" },
						)}
						style={linkCardStyle}
					>
						💬 Community Discussions
					</a>
					<a
						href={buildEmailCtaUrl("https://discord.gg/Ax3Py4YDrq", utm, {
							content: "discord",
						})}
						style={linkCardStyle}
					>
						👋 Join Discord
					</a>
				</div>
			</Section>

			<Section style={contentSection}>
				<Text style={footerNoteStyle}>
					If you need urgent assistance, our Discord community is the fastest
					way to get help!
				</Text>
			</Section>
		</BaseLayout>
	);
}

export async function renderContactSubmissionUserEmail(
	props: ContactSubmissionUserProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("@heyclaude/edge-runtime/utils/email/base-template.tsx");
	return renderEmailTemplate(ContactSubmissionUser, props);
}

// Custom styles for this template
const whatsNextSectionStyle: React.CSSProperties = {
	margin: `${spacing.lg} 0`,
	padding: spacing.lg,
	borderRadius: spacing.lg,
	backgroundColor: emailTheme.bgSecondary,
	border: `1px solid ${emailTheme.borderDefault}`,
};

const whatsNextTitleStyle: React.CSSProperties = {
	margin: 0,
	fontSize: typography.fontSize.lg,
	fontWeight: typography.fontWeight.semibold,
	marginBottom: spacing.md,
};

const checklistItemStyle: React.CSSProperties = {
	...listItemStyle,
	padding: `${spacing.xs} 0`,
};

const linkGridStyle: React.CSSProperties = {
	display: "grid",
	gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
	gap: spacing.sm,
	marginTop: spacing.md,
};

const linkCardStyle: React.CSSProperties = {
	display: "block",
	padding: spacing.md,
	borderRadius: spacing.md,
	border: `1px solid ${emailTheme.borderDefault}`,
	backgroundColor: emailTheme.bgSecondary,
	textDecoration: "none",
	color: emailTheme.textPrimary,
	textAlign: "center",
	fontSize: typography.fontSize.sm,
	fontWeight: typography.fontWeight.medium,
};

const footerNoteStyle: React.CSSProperties = {
	...paragraphStyle,
	marginTop: spacing.xl,
	fontSize: typography.fontSize.sm,
	color: emailTheme.textSecondary,
	fontStyle: "italic",
};
