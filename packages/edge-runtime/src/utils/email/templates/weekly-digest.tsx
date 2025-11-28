/**
 * Weekly Digest Email Template
 * Sent every Monday with new content and trending tools from the past week
 */

// React import required for Deno JSX
import React from "npm:react@18.3.1";

// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;

import { Hr, Section, Text } from "npm:@react-email/components@0.0.22";
import { BaseLayout } from "@heyclaude/edge-runtime/utils/email/base-template.tsx";
import {
	contentSection,
	dividerStyle,
	paragraphStyle,
	sectionTitleStyle,
} from "@heyclaude/edge-runtime/utils/email/common-styles.ts";
import { EmailCtaSection } from "@heyclaude/edge-runtime/utils/email/components/cta.tsx";
import { EmailFooterNote } from "@heyclaude/edge-runtime/utils/email/components/footer-note.tsx";
import { CardListSection, HeroBlock } from "@heyclaude/edge-runtime/utils/email/components/sections.tsx";
import { buildSubscriptionFooter } from "@heyclaude/edge-runtime/utils/email/config/footer-presets.ts";
import { buildEmailCtaUrl } from "@heyclaude/edge-runtime/utils/email/cta.ts";
import { EMAIL_UTM_TEMPLATES } from "@heyclaude/edge-runtime/utils/email/utm-templates.ts";

// Use generated types directly from @heyclaude/database-types - snake_case matches database
export interface DigestContentItem {
	title: string;
	description: string;
	category: string;
	slug: string;
	url: string;
	date_added?: string; // For new content
}

export interface DigestTrendingItem extends DigestContentItem {
	view_count: number;
}

export interface WeeklyDigestProps {
	email: string;
	week_of: string; // snake_case to match database
	new_content: DigestContentItem[]; // snake_case to match database
	trending_content: DigestTrendingItem[]; // snake_case to match database
	personalized_content?: DigestContentItem[]; // snake_case for consistency
}

export function WeeklyDigest({
	email,
	week_of,
	new_content,
	trending_content,
	personalized_content,
}: WeeklyDigestProps) {
	const utm = EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST;

	const mapContentCards = (items: DigestContentItem[], label: string) =>
		items.map((item) => ({
			title: item.title,
			description: item.description,
			meta: item.category.toUpperCase(),
			cta: {
				label: `View ${label}`,
				href: buildEmailCtaUrl(item.url, utm, {
					content: `${label.toLowerCase()}_${item.slug}`,
				}),
			},
		}));

	const personalizedCards = personalized_content
		? mapContentCards(personalized_content, "Recommendation")
		: [];
	const newContentCards = mapContentCards(new_content, "Content");
	const trendingCards = trending_content.map((item) => ({
		title: item.title,
		description: item.description,
		meta: `${item.category.toUpperCase()} • ${formatViewCount(item.view_count)} views`,
		cta: {
			label: `View ${item.category}`,
			href: buildEmailCtaUrl(item.url, utm, {
				content: `trending_${item.slug}`,
			}),
		},
	}));

	return (
		<BaseLayout preview={`This Week in Claude - ${week_of}`} utm={utm}>
			<HeroBlock title="This Week in Claude 🚀" subtitle={week_of}>
				<Text style={paragraphStyle}>
					Your weekly roundup of the best Claude tools, configurations, and
					resources from the community.
				</Text>
			</HeroBlock>

			<Hr style={dividerStyle} />

			{personalizedCards.length ? (
				<>
					<Section style={contentSection}>
						<Text style={sectionTitleStyle}>✨ Recommended for You</Text>
						<Text style={paragraphStyle}>
							Based on your interests and preferences:
						</Text>
					</Section>
					<CardListSection cards={personalizedCards} />
					<Hr style={dividerStyle} />
				</>
			) : null}

			{newContentCards.length ? (
				<>
					<Section style={contentSection}>
						<Text style={sectionTitleStyle}>✨ New This Week</Text>
						<Text style={paragraphStyle}>
							Fresh tools and configurations added to the directory:
						</Text>
					</Section>
					<CardListSection cards={newContentCards} />
					<Hr style={dividerStyle} />
				</>
			) : null}

			{trendingCards.length ? (
				<>
					<Section style={contentSection}>
						<Text style={sectionTitleStyle}>🔥 Trending This Week</Text>
						<Text style={paragraphStyle}>
							Most popular tools from the community:
						</Text>
					</Section>
					<CardListSection cards={trendingCards} />
					<Hr style={dividerStyle} />
				</>
			) : null}

			<EmailCtaSection
				utm={utm}
				title="Explore More"
				description="Browse the complete directory to discover even more tools and configurations."
				buttons={[
					{ preset: "browseDirectory", variant: "primary" },
					{ preset: "viewTrending", variant: "secondary" },
				]}
			/>

			<Hr style={dividerStyle} />

			<EmailFooterNote
				lines={buildSubscriptionFooter("weeklyDigest", { email })}
			/>
		</BaseLayout>
	);
}

export async function renderWeeklyDigestEmail(
	props: WeeklyDigestProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("@heyclaude/edge-runtime/utils/email/base-template.tsx");
	return renderEmailTemplate(WeeklyDigest, props);
}

function formatViewCount(count: number): string {
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
	if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
	return count.toString();
}

export default WeeklyDigest;
