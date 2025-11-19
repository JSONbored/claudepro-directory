/**
 * Collection Shared Email Template
 * Sent when a user shares a collection with another user
 */

// React import required for Deno JSX (even though jsx: "react-jsx" doesn't require it for TypeScript)
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
import { buildEmailCtaUrl } from "../cta.ts";
import { EMAIL_UTM_TEMPLATES } from "../utm-templates.ts";

export interface CollectionSharedProps {
	collectionName: string;
	collectionDescription?: string;
	senderName: string;
	recipientEmail: string;
	collectionSlug: string;
	senderSlug: string;
	itemCount: number;
}

export function CollectionShared(props: CollectionSharedProps) {
	const {
		collectionName,
		collectionDescription,
		senderName,
		collectionSlug,
		senderSlug,
		itemCount,
	} = props;
	const baseUrl = "https://claudepro.directory";
	const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
	const collectionUrl = `${baseUrl}/u/${senderSlug}/collections/${collectionSlug}`;

	return (
		<BaseLayout
			preview={`${senderName} shared a collection with you: "${collectionName}"`}
			utm={utm}
		>
			<Section style={contentSection}>
				<Text style={headingStyle}>You've Received a Collection! 📚</Text>
				<Text style={subheadingStyle}>
					<strong style={strongStyle}>{senderName}</strong> shared a curated
					collection with you.
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Collection:</strong> {collectionName}
				</Text>
				{collectionDescription && (
					<Text style={paragraphStyle}>
						<strong style={strongStyle}>Description:</strong>{" "}
						{collectionDescription}
					</Text>
				)}
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Items:</strong> {itemCount}{" "}
					{itemCount === 1 ? "item" : "items"}
				</Text>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Shared by:</strong> {senderName}
				</Text>
			</Section>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>Why collections?</strong>
				</Text>
				<ul style={listStyle}>
					<li style={listItemStyle}>
						Discover curated content tailored to specific workflows
					</li>
					<li style={listItemStyle}>
						Save time by using pre-organized resources
					</li>
					<li style={listItemStyle}>
						Fork and customize collections to fit your needs
					</li>
					<li style={listItemStyle}>
						Share your own collections with the community
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
							href: collectionUrl,
							label: "View Collection",
							contentKey: "view_collection_cta",
						},
					},
				]}
			/>

			<Hr style={dividerStyle} />

			<Section style={contentSection}>
				<Text style={paragraphStyle}>
					Want to create your own collections?{" "}
					<a
						href={buildEmailCtaUrl(`${baseUrl}/account/collections`, utm)}
						style={{ color: "#ff6b35" }}
					>
						Get started here
					</a>
					.
				</Text>
			</Section>
		</BaseLayout>
	);
}

export async function renderCollectionSharedEmail(
	props: CollectionSharedProps,
): Promise<string> {
	const { renderEmailTemplate } = await import("../base-template.tsx");
	return renderEmailTemplate(CollectionShared, props);
}
