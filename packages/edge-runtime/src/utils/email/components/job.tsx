// React import required for Deno JSX
import React from "npm:react@18.3.1";
// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;
import { Section, Text } from "npm:@react-email/components@0.0.22";
import {
	contentSection,
	paragraphStyle,
	strongStyle,
} from "../common-styles.ts";

export interface JobDetailItem {
	label: string;
	value: React.ReactNode;
	icon?: string;
}

interface JobDetailsSectionProps {
	title?: string;
	items: JobDetailItem[];
}

export function JobDetailsSection({ title, items }: JobDetailsSectionProps) {
	if (!items.length) {
		return null;
	}

	return (
		<Section style={contentSection}>
			{title ? (
				<Text style={paragraphStyle}>
					<strong style={strongStyle}>{title}</strong>
				</Text>
			) : null}
			{items.map((item) => (
				<Text key={item.label} style={paragraphStyle}>
					{item.icon ? `${item.icon} ` : null}
					<strong style={strongStyle}>{item.label}:</strong> {item.value}
				</Text>
			))}
		</Section>
	);
}
