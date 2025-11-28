/**
 * Job Approved Email Template
 * Sent when admin approves a job listing and payment is required
 */

// React import required for Deno JSX (even though jsx: "react-jsx" doesn't require it for TypeScript)
import React from "npm:react@18.3.1";

// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;

import { Hr, Section, Text } from "npm:@react-email/components@0.0.22";
import { BaseLayout } from "@heyclaude/edge-runtime/utils/email/base-template.tsx";
import {
	contentSection,
	dividerStyle,
	headingStyle,
	listItemStyle,
	listStyle,
	paragraphStyle,
	strongStyle,
	subheadingStyle,
} from "@heyclaude/edge-runtime/utils/email/common-styles.ts";
import { EmailCtaSection } from "@heyclaude/edge-runtime/utils/email/components/cta.tsx";
import { JobDetailsSection } from "@heyclaude/edge-runtime/utils/email/components/job.tsx";
import { formatCurrency } from "@heyclaude/edge-runtime/utils/email/formatters.ts";
import { EMAIL_UTM_TEMPLATES } from "@heyclaude/edge-runtime/utils/email/utm-templates.ts";

export interface JobApprovedProps {
	jobTitle: string;
	company: string;
	userEmail: string;
	jobId: string;
	plan: string;
	paymentAmount: number;
	paymentUrl?: string;
}

export function JobApproved(props: JobApprovedProps) {
	const { jobTitle, company, plan, paymentAmount, paymentUrl } = props;
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
	const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
	const amountLabel = formatCurrency(paymentAmount);

	return (
		<BaseLayout
			preview={`Great news! Your job posting "${jobTitle}" has been approved`}
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>Job Approved! 🎉</Text>
				<Text style={subheadingStyle}>
					Congratulations! Your job listing has been approved and is ready to
					publish.
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<JobDetailsSection
				items={[
					{ label: "Position", value: jobTitle },
					{ label: "Company", value: company },
					{ label: "Plan", value: planLabel },
					{ label: "Amount", value: amountLabel },
				]}
			/>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Next Steps:</strong>
				</Text>
				<ul style={listStyle}>
					<li style={listItemStyle}>
						Complete payment to activate your listing
					</li>
					<li style={listItemStyle}>
						Your job goes live immediately after payment
					</li>
					<li style={listItemStyle}>Track performance from your dashboard</li>
				</ul>
			</Section>

			<EmailCtaSection
				utm={utm}
				buttons={
					paymentUrl
						? [
								{
									preset: "primaryDirectory" as const, // label overridden below, href uses paymentUrl
									variant: "primary" as const,
									overrides: {
										href: paymentUrl,
										label: `Complete Payment (${amountLabel})`,
										contentKey: "payment_cta",
									},
								},
							]
						: []
				}
			/>
		</BaseLayout>
	);
}

export async function renderJobApprovedEmail(
	props: JobApprovedProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("@heyclaude/edge-runtime/utils/email/base-template.tsx");
	return renderEmailTemplate(JobApproved, props);
}
