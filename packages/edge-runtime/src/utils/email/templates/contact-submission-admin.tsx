/**
 * Contact Submission Admin Email Template
 * Sent to admins when a user submits the contact form via terminal
 */

import { Hr, Section, Text } from "npm:@react-email/components@0.0.22";
// React import required for Deno JSX
import React from "npm:react@18.3.1";
// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;
import type { Database as DatabaseGenerated } from "@heyclaude/database-types";
import { BaseLayout } from "../base-template.tsx";

type ContactCategory = DatabaseGenerated['public']['Enums']['contact_category'];
import {
	contentSection,
	dividerStyle,
	headingStyle,
	listItemStyle,
	listStyle,
	paragraphStyle,
	strongStyle,
	subheadingStyle,
} from "../common-styles.ts";
import { EmailCtaSection } from "../components/cta.tsx";
import { EMAIL_UTM_TEMPLATES } from "../utm-templates.ts";

export interface ContactSubmissionAdminProps {
	submissionId: string;
	name: string;
	email: string;
	category: ContactCategory;
	message: string;
	submittedAt: string;
}

export function ContactSubmissionAdmin({
	submissionId,
	name,
	email,
	category,
	message,
	submittedAt,
}: ContactSubmissionAdminProps) {
	const baseUrl = "https://claudepro.directory";
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
	const submittedDate = new Date(submittedAt).toLocaleString("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	});

	// Category emoji mapping
	const categoryEmoji: Record<ContactCategory, string> = {
		bug: "🐛",
		feature: "💡",
		partnership: "🤝",
		general: "💬",
		other: "📧",
	};

	return (
		<BaseLayout
			preview={`New ${category} message from ${name} via terminal`}
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>
					{categoryEmoji[category] || "📧"} New Contact Submission
				</Text>
				<Text style={subheadingStyle}>
					Submitted via interactive terminal on {submittedDate}
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Category:</strong>{" "}
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</Text>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>From:</strong> {name} ({email})
				</Text>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Submission ID:</strong> {submissionId}
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Message:</strong>
				</Text>
				<div style={messageBoxStyle}>
					{message.split("\n").map((line, i) => (
						<Text key={i} style={messageLineStyle}>
							{line || "\u00A0"}
						</Text>
					))}
				</div>
			</Section>

			<EmailCtaSection
				utm={utm}
				buttons={[
					{
						preset: "primaryDirectory" as const,
						variant: "primary" as const,
						overrides: {
							href: `${baseUrl}/admin/contact/${submissionId}`,
							label: "View in Admin Dashboard",
							contentKey: "view_submission_cta",
						},
					},
				]}
			/>

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Quick Actions:</strong>
				</Text>
				<ul style={listStyle}>
					<li style={listItemStyle}>
						Reply directly to: <a href={`mailto:${email}`}>{email}</a>
					</li>
					<li style={listItemStyle}>
						View all contact submissions in admin dashboard
					</li>
					<li style={listItemStyle}>Mark as responded once handled</li>
				</ul>
			</Section>
		</BaseLayout>
	);
}

export async function renderContactSubmissionAdminEmail(
	props: ContactSubmissionAdminProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("../base-template.tsx");
	return renderEmailTemplate(ContactSubmissionAdmin, props);
}

const messageBoxStyle: React.CSSProperties = {
	backgroundColor: "#f5f5f5",
	padding: "16px",
	borderRadius: "8px",
	marginTop: "8px",
	border: "1px solid #e0e0e0",
	fontFamily: "monospace",
	whiteSpace: "pre-wrap",
	wordBreak: "break-word",
};

const messageLineStyle: React.CSSProperties = {
	margin: "4px 0",
	fontSize: "14px",
	lineHeight: "1.6",
	color: "#1a1a1a",
};
