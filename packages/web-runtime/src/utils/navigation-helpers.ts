import type { content_category } from '@heyclaude/data-layer/prisma';

/**
 * Get category from href for badge display
 * Shared utility for navigation components to avoid duplication
 */
export function getCategoryFromHref(href: string): content_category | null {
  if (href.includes('/agents')) return 'agents';
  if (href.includes('/mcp')) return 'mcp';
  if (href.includes('/commands')) return 'commands';
  if (href.includes('/rules') || href.includes('/claude.md')) return 'rules';
  if (href.includes('/hooks')) return 'hooks';
  if (href.includes('/statuslines')) return 'statuslines';
  if (href.includes('/collections')) return 'collections';
  if (href.includes('/skills')) return 'skills';
  if (href.includes('/guides')) return 'guides';
  return null;
}

/**
 * Get icon background gradient classes based on link href/category
 * Returns gradient background classes for icons instead of flat colors
 * Shared utility for navigation components to avoid duplication
 */
export function getIconBackgroundClass(href: string): string {
  // Category-based gradients
  if (href.includes('/agents')) return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 group-hover/item:from-purple-500/30 group-hover/item:to-purple-600/20';
  if (href.includes('/mcp')) return 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-cyan-400 group-hover/item:from-cyan-500/30 group-hover/item:to-cyan-600/20';
  if (href.includes('/commands')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/rules') || href.includes('/claude.md')) return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 group-hover/item:from-amber-500/30 group-hover/item:to-amber-600/20';
  if (href.includes('/hooks')) return 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-400 group-hover/item:from-green-500/30 group-hover/item:to-green-600/20';
  if (href.includes('/statuslines')) return 'bg-gradient-to-br from-teal-500/20 to-teal-600/10 text-teal-400 group-hover/item:from-teal-500/30 group-hover/item:to-teal-600/20';
  if (href.includes('/collections')) return 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 text-indigo-400 group-hover/item:from-indigo-500/30 group-hover/item:to-indigo-600/20';
  if (href.includes('/skills')) return 'bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-pink-400 group-hover/item:from-pink-500/30 group-hover/item:to-pink-600/20';
  if (href.includes('/guides')) return 'bg-gradient-to-br from-violet-500/20 to-violet-600/10 text-violet-400 group-hover/item:from-violet-500/30 group-hover/item:to-violet-600/20';
  if (href.includes('/jobs')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/changelog')) return 'bg-gradient-to-br from-slate-500/20 to-slate-600/10 text-slate-400 group-hover/item:from-slate-500/30 group-hover/item:to-slate-600/20';
  
  // Feature-based gradients
  if (href.includes('/search')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/trending')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/help')) return 'bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-400 group-hover/item:from-green-500/30 group-hover/item:to-green-600/20';
  if (href.includes('/tools')) return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 group-hover/item:from-purple-500/30 group-hover/item:to-purple-600/20';
  if (href.includes('/submit')) return 'bg-gradient-to-br from-accent/20 to-accent/10 text-accent group-hover/item:from-accent/30 group-hover/item:to-accent/20';
  if (href.includes('/community')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/companies')) return 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 text-indigo-400 group-hover/item:from-indigo-500/30 group-hover/item:to-indigo-600/20';
  if (href.includes('/partner')) return 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 group-hover/item:from-amber-500/30 group-hover/item:to-amber-600/20';
  if (href.includes('/consulting')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/contact')) return 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 group-hover/item:from-blue-500/30 group-hover/item:to-blue-600/20';
  if (href.includes('/rss') || href.includes('/feeds')) return 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 group-hover/item:from-orange-500/30 group-hover/item:to-orange-600/20';
  if (href.includes('/llms.txt')) return 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 group-hover/item:from-purple-500/30 group-hover/item:to-purple-600/20';
  
  // Default gradient
  return 'bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground group-hover/item:from-accent/20 group-hover/item:to-accent/10 group-hover/item:text-accent';
}
