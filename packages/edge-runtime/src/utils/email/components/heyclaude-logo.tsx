// React import required for Deno JSX
import React from "npm:react@18.3.1";
// Mark React as used for TypeScript (required for Deno JSX runtime)
void React;

interface HeyClaudeEmailLogoProps {
	size?: "sm" | "md" | "lg";
}

const FONT_SIZES: Record<"sm" | "md" | "lg", string> = {
	sm: "18px",
	md: "26px",
	lg: "34px",
};

export function HeyClaudeEmailLogo({ size = "md" }: HeyClaudeEmailLogoProps) {
	const fontSize = FONT_SIZES[size];

	const baseStyle: React.CSSProperties = {
		fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
		fontWeight: 700,
		letterSpacing: "-0.02em",
		color: "#E9EBE6",
		fontSize,
		textTransform: "lowercase",
		display: "inline-flex",
		alignItems: "center",
		gap: "6px",
		margin: 0,
	};

	const chipStyle: React.CSSProperties = {
		backgroundColor: "#FF6F4A",
		color: "#1A1B17",
		borderRadius: "9999px",
		padding: "2px 12px",
		fontWeight: 800,
		lineHeight: 1.2,
	};

	return (
		<span style={baseStyle}>
			<span>hey</span>
			<span style={chipStyle}>claude</span>
		</span>
	);
}
