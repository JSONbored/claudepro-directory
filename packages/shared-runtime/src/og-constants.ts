/**
 * Shared Open Graph Image Constants
 * Centralized defaults, dimensions, brand strings, and color tokens
 * Used by both web (Next.js) and edge (Supabase Functions) OG image generators
 */

/** Default OG image values - 'agents' is used as fallback type for unrecognized routes */
export const OG_DEFAULTS = {
  title: 'Claude Pro Directory',
  description: 'Community-curated agents, MCPs, and rules',
  // eslint-disable-next-line architectural-rules/no-hardcoded-enum-values -- Static fallback for OG images, not a DB category
  type: 'agents',
} as const;

export const OG_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

export const OG_COLORS = {
  background: '#1a1410',
  backgroundPattern: '#2a2010',
  primary: '#f97316',
  primaryGradient: {
    start: '#f97316',
    end: '#fb923c',
  },
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },
  border: '#3a3020',
} as const;

export const OG_BRAND = {
  name: 'ClaudePro',
  suffix: 'Directory',
  domain: 'claudepro.directory',
} as const;

export const OG_LAYOUT = {
  padding: '60px',
  gap: {
    small: '12px',
    medium: '20px',
  },
  fontSize: {
    type: '24px',
    title: '72px',
    description: '32px',
    tag: '20px',
    brand: '32px',
    brandSuffix: '28px',
    domain: '24px',
  },
  borderRadius: {
    type: '8px',
    tag: '6px',
  },
} as const;

/**
 * Derive title from route slug
 * Converts slug format (e.g., "code-reviewer") to title format (e.g., "Code Reviewer")
 */
export function deriveTitleFromRoute(route: string): string {
  const slug = route.split('/').pop() ?? '';
  if (!slug) {
    return OG_DEFAULTS.title;
  }
  const title = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return title || OG_DEFAULTS.title;
}
