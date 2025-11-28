// React import required for Deno JSX (even though jsx: "react-jsx" doesn't require it for TypeScript)
import React from "npm:react@18.3.1";

// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;

import { Section, Text } from "npm:@react-email/components@0.0.22";
import {
	footerNoteSection,
	footerNoteStyle,
	strongStyle,
} from "@heyclaude/edge-runtime/utils/email/common-styles.ts";
import type { FooterLine } from "@heyclaude/edge-runtime/utils/email/config/footer-presets.ts";

interface EmailFooterNoteProps {
	lines: FooterLine[];
}

export function EmailFooterNote({ lines }: EmailFooterNoteProps) {
	if (!lines.length) return null;

	return (
		<Section style={footerNoteSection}>
			{lines.map((line, index) => {
				if (line.type === "email") {
					return (
						<Text key={`footer-email-${index}`} style={footerNoteStyle}>
							{line.icon ? `${line.icon} ` : null}
							{line.label ? `${line.label} ` : null}
							<strong style={strongStyle}>{line.email}</strong>
						</Text>
					);
				}

				return (
					<Text key={`footer-text-${index}`} style={footerNoteStyle}>
						{line.text}
					</Text>
				);
			})}
		</Section>
	);
}
