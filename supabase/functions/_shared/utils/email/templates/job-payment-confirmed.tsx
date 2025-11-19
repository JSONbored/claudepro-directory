/**
 * Job Payment Confirmed Email Template
 * Sent when payment is received and job goes live
 */

// React import required for Deno JSX
import React from "npm:react@18.3.1";

// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;

import { Hr, Section, Text } from "npm:@react-email/components@0.0.22";
import { BaseLayout } from "../base-template.tsx";
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
import { JobDetailsSection } from "../components/job.tsx";
import { formatCurrency, formatEmailDate } from "../formatters.ts";
import { EMAIL_UTM_TEMPLATES } from "../utm-templates.ts";

export interface JobPaymentConfirmedProps {
	jobTitle: string;
	company: string;
	userEmail: string;
	jobId: string;
	jobSlug: string;
	plan: string;
	paymentAmount: number;
	paymentDate: string;
	expiresAt: string;
}

export function JobPaymentConfirmed({
	jobTitle,
	company,
	jobSlug,
	plan,
	paymentAmount,
	paymentDate,
	expiresAt,
}: JobPaymentConfirmedProps) {
	const baseUrl = "https://claudepro.directory";
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
	const jobUrl = `${baseUrl}/jobs/${jobSlug}`;
	const analyticsUrl = `${baseUrl}/account/jobs`;
	const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
	const paymentLabel = `${formatCurrency(paymentAmount)} on ${formatEmailDate(paymentDate)}`;
	const expiresLabel = formatEmailDate(expiresAt);

	return (
		<BaseLayout
			preview={`Payment confirmed! Your job "${jobTitle}" is now live`}
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>🚀 Your Job is Live!</Text>
				<Text style={subheadingStyle}>
					Payment confirmed! Your job listing is now published and visible to
					thousands of candidates.
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<JobDetailsSection
				items={[
					{ label: "Position", value: jobTitle },
					{ label: "Company", value: company },
					{ label: "Plan", value: planLabel },
					{ label: "Payment", value: paymentLabel },
					{ label: "Active Until", value: expiresLabel },
				]}
			/>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>What's Next?</strong>
				</Text>
				<ul style={listStyle}>
					<li style={listItemStyle}>
						Your listing is live and searchable immediately
					</li>
					<li style={listItemStyle}>
						Track views and clicks in your dashboard
					</li>
					<li style={listItemStyle}>Get notified when candidates apply</li>
				</ul>
			</Section>

			<EmailCtaSection
				utm={utm}
				buttons={[
					{
						preset: "primaryDirectory" as const,
						variant: "primary" as const,
						overrides: {
							href: jobUrl,
							label: "View Live Listing",
							contentKey: "view_listing_live",
						},
					},
					{
						preset: "primaryDirectory" as const,
						variant: "secondary" as const,
						overrides: {
							href: analyticsUrl,
							label: "View Analytics",
							contentKey: "analytics_cta",
						},
					},
				]}
			/>
		</BaseLayout>
	);
}

export async function renderJobPaymentConfirmedEmail(
	props: JobPaymentConfirmedProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("../base-template.tsx");
	return renderEmailTemplate(JobPaymentConfirmed, props);
}
