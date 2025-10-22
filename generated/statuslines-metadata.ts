/**
 * Auto-generated metadata file
 * Category: Statuslines
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';

export type StatuslineMetadata = Pick<StatuslineContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const statuslinesMetadata: StatuslineMetadata[] = [
  {
    "slug": "docker-health-statusline",
    "title": "Docker Health Statusline",
    "seoTitle": "Claude Code Docker Statusline - Container Health Monitoring",
    "description": "Docker statusline configuration for Claude Code CLI. Features real-time health monitoring, color-coded indicators, and container tracking. Production-ready.",
    "author": "Claude Pro Directory",
    "tags": [
      "docker",
      "statusline",
      "monitoring",
      "health-check",
      "containers",
      "CLI",
      "claude-code",
      "devops"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-19"
  },
  {
    "slug": "git-status-statusline",
    "title": "Git Status Statusline",
    "description": "Git-focused statusline showing branch, dirty status, ahead/behind indicators, and stash count alongside Claude session info",
    "author": "JSONbored",
    "tags": [
      "git",
      "version-control",
      "developer",
      "bash",
      "powerline",
      "status-indicators"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-01",
    "source": "community"
  },
  {
    "slug": "mcp-server-status-monitor",
    "title": "MCP Server Status Monitor",
    "description": "Real-time MCP server monitoring statusline showing connected servers, active tools, and performance metrics for Claude Code MCP integration",
    "author": "JSONbored",
    "tags": [
      "mcp",
      "monitoring",
      "servers",
      "tools",
      "performance"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "minimal-powerline",
    "title": "Minimal Powerline",
    "description": "Clean, performance-optimized statusline with Powerline glyphs showing model, directory, and token count",
    "author": "JSONbored",
    "tags": [
      "powerline",
      "minimal",
      "performance",
      "bash",
      "lightweight"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-01",
    "source": "community"
  },
  {
    "slug": "multi-line-statusline",
    "title": "Multi Line Statusline",
    "description": "Comprehensive multi-line statusline displaying detailed session information across two lines with organized sections and visual separators",
    "author": "JSONbored",
    "tags": [
      "multi-line",
      "comprehensive",
      "detailed",
      "bash",
      "powerline",
      "dashboard"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-01",
    "source": "community"
  },
  {
    "slug": "multi-provider-token-counter",
    "title": "Multi Provider Token Counter",
    "description": "Multi-provider AI token counter displaying real-time context usage for Claude (1M), GPT-4.1 (1M), Gemini 2.x (1M), and Grok 3 (1M) with 2025 verified limits",
    "author": "JSONbored",
    "tags": [
      "tokens",
      "multi-provider",
      "context-limits",
      "ai-models",
      "monitoring"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "python-rich-statusline",
    "title": "Python Rich Statusline",
    "description": "Feature-rich statusline using Python's Rich library for beautiful formatting, progress bars, and real-time token cost tracking",
    "author": "JSONbored",
    "tags": [
      "python",
      "rich",
      "advanced",
      "cost-tracking",
      "progress",
      "colorful"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-01",
    "source": "community"
  },
  {
    "slug": "real-time-cost-tracker",
    "title": "Real Time Cost Tracker",
    "description": "Real-time AI cost tracking statusline with per-session spend analytics, model pricing, and budget alerts",
    "author": "JSONbored",
    "tags": [
      "cost",
      "pricing",
      "budget",
      "analytics",
      "monitoring"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "session-timer-statusline",
    "title": "Session Timer Statusline",
    "seoTitle": "Session Timer",
    "description": "Time-tracking statusline showing elapsed session duration, tokens per minute rate, and estimated cost with productivity metrics",
    "author": "JSONbored",
    "tags": [
      "timer",
      "productivity",
      "metrics",
      "bash",
      "time-tracking",
      "analytics"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-01",
    "source": "community"
  },
  {
    "slug": "simple-text-statusline",
    "title": "Simple Text Statusline",
    "description": "Ultra-lightweight plain text statusline with no colors or special characters for maximum compatibility and minimal overhead",
    "author": "JSONbored",
    "tags": [
      "simple",
      "plain-text",
      "minimal",
      "bash",
      "lightweight",
      "no-dependencies"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-01",
    "source": "community"
  },
  {
    "slug": "starship-powerline-theme",
    "title": "Starship Powerline Theme",
    "description": "Starship-inspired powerline statusline with Nerd Font glyphs, modular segments, and Git integration for Claude Code",
    "author": "JSONbored",
    "tags": [
      "starship",
      "powerline",
      "nerd-fonts",
      "git",
      "theme"
    ],
    "category": "statuslines",
    "dateAdded": "2025-10-16",
    "source": "community"
  }
];

export const statuslinesMetadataBySlug = new Map(statuslinesMetadata.map(item => [item.slug, item]));

export function getStatuslineMetadataBySlug(slug: string): StatuslineMetadata | null {
  return statuslinesMetadataBySlug.get(slug) || null;
}
