import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';

const BASE_URL = edgeEnv.site.siteUrl;

export type EmailCtaPresetId =
  | 'primaryDirectory'
  | 'browseDirectory'
  | 'viewTrending'
  | 'viewTutorials'
  | 'shareFeedback'
  | 'submitConfiguration'
  | 'viewTopAgents'
  | 'exploreMcpServers'
  | 'browseRules'
  | 'hooksShowcase'
  | 'mcpHighlights'
  | 'communityShowcase'
  | 'githubCommunity'
  | 'twitterCommunity';

export interface EmailCtaPreset {
  label: string;
  href: string;
  contentKey: string;
}

export const EMAIL_CTA_PRESETS: Record<EmailCtaPresetId, EmailCtaPreset> = {
  primaryDirectory: {
    label: 'Browse the Directory',
    href: BASE_URL,
    contentKey: 'primary_cta',
  },
  browseDirectory: {
    label: 'Browse Directory',
    href: BASE_URL,
    contentKey: 'browse_cta',
  },
  viewTrending: {
    label: 'View Trending',
    href: `${BASE_URL}/trending`,
    contentKey: 'trending_cta',
  },
  viewTutorials: {
    label: 'View Tutorials',
    href: `${BASE_URL}/guides/tutorials`,
    contentKey: 'tutorials_cta',
  },
  shareFeedback: {
    label: 'Share Your Feedback',
    href: `${BASE_URL}/feedback`,
    contentKey: 'feedback_cta',
  },
  submitConfiguration: {
    label: 'Submit Your Configuration',
    href: `${BASE_URL}/submit`,
    contentKey: 'submit_cta',
  },
  viewTopAgents: {
    label: 'View Top Agents',
    href: `${BASE_URL}/agents`,
    contentKey: 'step_1_agents',
  },
  exploreMcpServers: {
    label: 'Explore MCP Servers',
    href: `${BASE_URL}/mcp`,
    contentKey: 'step_2_mcp',
  },
  browseRules: {
    label: 'Browse Rules',
    href: `${BASE_URL}/rules`,
    contentKey: 'step_3_rules',
  },
  hooksShowcase: {
    label: 'Explore Hooks',
    href: `${BASE_URL}/hooks`,
    contentKey: 'hooks_cta',
  },
  mcpHighlights: {
    label: 'Discover MCP Integrations',
    href: `${BASE_URL}/mcp`,
    contentKey: 'mcp_cta',
  },
  communityShowcase: {
    label: 'See All Community Contributions',
    href: `${BASE_URL}/community`,
    contentKey: 'community_cta',
  },
  githubCommunity: {
    label: 'GitHub',
    href: 'https://github.com/yourusername/claudepro-directory',
    contentKey: 'github_link',
  },
  twitterCommunity: {
    label: 'Twitter',
    href: 'https://twitter.com/claudeprodirectory',
    contentKey: 'twitter_link',
  },
};

export function getCtaPreset(id: EmailCtaPresetId): EmailCtaPreset {
  const preset = EMAIL_CTA_PRESETS[id];
  if (!preset) {
    throw new Error(`Unknown email CTA preset: ${id}`);
  }
  return preset;
}
