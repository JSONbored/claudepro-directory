/**
 * Job Expired Email Template
 * Sent when job listing expires with repost option
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
import { formatEmailDate, formatNumber } from "@heyclaude/edge-runtime/utils/email/formatters.ts";
import { EMAIL_UTM_TEMPLATES } from "@heyclaude/edge-runtime/utils/email/utm-templates.ts";

export interface JobExpiredProps {
	jobTitle: string;
	company: string;
	userEmail: string;
	jobId: string;
	expiredAt: string;
	viewCount?: number;
	clickCount?: number;
	repostUrl?: string;
}

export function JobExpired(props: JobExpiredProps) {
	const {
		jobTitle,
		company,
		expiredAt,
		viewCount = 0,
		clickCount = 0,
		repostUrl,
	} = props;
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
	const expiredLabel = formatEmailDate(expiredAt);
	const viewsLabel = formatNumber(viewCount);
	const clicksLabel = formatNumber(clickCount);

	return (
		<BaseLayout
			preview={`Your job posting "${jobTitle}" has expired`}
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>Job Listing Expired</Text>
				<Text style={subheadingStyle}>
					Your job posting for {jobTitle} at {company} has reached its
					expiration date.
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<JobDetailsSection
				title="Performance Summary:"
				items={[
					{ label: "Position", value: jobTitle },
					{ label: "Company", value: company },
					{ label: "Views", value: viewsLabel, icon: "📊" },
					{ label: "Clicks", value: clicksLabel, icon: "🖱" },
					{ label: "Expired", value: expiredLabel, icon: "📅" },
				]}
			/>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Still hiring?</strong>
				</Text>
				<ul style={listStyle}>
					<li style={listItemStyle}>Repost your listing with one click</li>
					<li style={listItemStyle}>
						All details are preserved - just review and publish
					</li>
					<li style={listItemStyle}>Get another 30 days of visibility</li>
				</ul>
			</Section>

			<EmailCtaSection
				utm={utm}
				buttons={
					repostUrl
						? [
								{
									preset: "primaryDirectory" as const,
									variant: "primary" as const,
									overrides: {
										href: repostUrl,
										label: "Repost Listing ($299)",
										contentKey: "repost_cta",
									},
								},
							]
						: []
				}
			/>
		</BaseLayout>
	);
}

export async function renderJobExpiredEmail(
	props: JobExpiredProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("@heyclaude/edge-runtime/utils/email/base-template.tsx");
	return renderEmailTemplate(JobExpired, props);
}
