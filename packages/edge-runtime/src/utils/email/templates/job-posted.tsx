/**
 * Job Posted Email Template
 * Sent when a job listing is approved and goes live
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
import { buildEmailCtaUrl } from "../cta.ts";
import { EMAIL_UTM_TEMPLATES } from "../utm-templates.ts";

export interface JobPostedProps {
	jobTitle: string;
	company: string;
	userEmail: string;
	jobSlug: string;
}

export function JobPosted(props: JobPostedProps) {
	const { jobTitle, company, jobSlug } = props;
	const baseUrl = "https://claudepro.directory";
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
	const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

	return (
		<BaseLayout
			preview={`Your job posting "${jobTitle}" at ${company} is now live!`}
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>Your Job Posting is Live! 🎉</Text>
				<Text style={subheadingStyle}>
					Your job listing has been approved and is now visible to the ClaudePro
					community.
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<JobDetailsSection
				items={[
					{ label: "Position", value: jobTitle },
					{ label: "Company", value: company },
				]}
			/>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>What's Next?</strong>
				</Text>
				<ul style={listStyle}>
					<li style={listItemStyle}>
						Your listing is now visible in our jobs directory
					</li>
					<li style={listItemStyle}>
						Qualified candidates can start applying immediately
					</li>
					<li style={listItemStyle}>
						Track views and applications in your dashboard
					</li>
					<li style={listItemStyle}>
						You'll receive notifications when candidates apply
					</li>
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
							label: "View Job Listing",
							contentKey: "view_listing_live",
						},
					},
				]}
			/>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					Need to make changes? Visit your{" "}
					<a
						href={buildEmailCtaUrl(`${baseUrl}/account/jobs`, utm)}
						style={{ color: "#ff6b35" }}
					>
						Jobs Dashboard
					</a>{" "}
					to edit or pause your listing anytime.
				</Text>
			</Section>
		</BaseLayout>
	);
}

export async function renderJobPostedEmail(
	props: JobPostedProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("../base-template.tsx");
	return renderEmailTemplate(JobPosted, props);
}
