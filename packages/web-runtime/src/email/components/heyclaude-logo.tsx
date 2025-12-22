import type React from 'react';

export interface HeyClaudeEmailLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const FONT_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: '18px',
  md: '26px',
  lg: '34px',
};

/**
 * HeyClaude Email Logo Component
 *
 * EXACT match to the main HeyClaudeLogo component used in footer/navigation.
 * Displays "heyclaude" as a single word with orange background highlight and white text.
 *
 * Matches HighlightText component styling:
 * - Background: #F0704A (orange)
 * - Text: #FFFFFF (white)
 * - Padding: 2px 6px (0.125rem 0.375rem)
 * - Border radius: 6px (0.375rem)
 * - Font: bold (700), tracking-tight (letter-spacing: -0.02em)
 */
export function HeyClaudeEmailLogo({ size = 'md' }: HeyClaudeEmailLogoProps) {
  const fontSize = FONT_SIZES[size];

  const logoStyle: React.CSSProperties = {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontSize,
    textTransform: 'lowercase',
    display: 'inline-block',
    margin: 0,
    // EXACT match to HighlightText component styling
    backgroundColor: '#F0704A', // Exact orange from HighlightText
    color: '#FFFFFF', // White text
    padding: '2px 6px', // 0.125rem 0.375rem
    borderRadius: '6px', // 0.375rem
    lineHeight: 1.2,
  };

  return <span style={logoStyle}>heyclaude</span>;
}
