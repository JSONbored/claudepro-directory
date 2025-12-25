import type { content_category } from '@prisma/client';

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
  // Category-based gradients using theme category colors
  if (href.includes('/agents'))
    return 'bg-category-agents-bg text-category-agents group-hover/item:bg-category-agents-hover';
  if (href.includes('/mcp'))
    return 'bg-category-mcp-bg text-category-mcp group-hover/item:bg-category-mcp-hover';
  if (href.includes('/commands'))
    return 'bg-category-commands-bg text-category-commands group-hover/item:bg-category-commands-hover';
  if (href.includes('/rules') || href.includes('/claude.md'))
    return 'bg-category-rules-bg text-category-rules group-hover/item:bg-category-rules-hover';
  if (href.includes('/hooks'))
    return 'bg-category-hooks-bg text-category-hooks group-hover/item:bg-category-hooks-hover';
  if (href.includes('/statuslines'))
    return 'bg-muted/50 text-muted-foreground group-hover/item:bg-muted';
  if (href.includes('/collections'))
    return 'bg-muted/50 text-muted-foreground group-hover/item:bg-muted';
  if (href.includes('/skills'))
    return 'bg-muted/50 text-muted-foreground group-hover/item:bg-muted';
  if (href.includes('/guides'))
    return 'bg-muted/50 text-muted-foreground group-hover/item:bg-muted';
  if (href.includes('/jobs')) return 'bg-primary/10 text-primary group-hover/item:bg-primary/20';
  if (href.includes('/changelog'))
    return 'bg-muted/50 text-muted-foreground group-hover/item:bg-muted';

  // Feature-based gradients using theme colors
  if (href.includes('/search')) return 'bg-info-bg text-info group-hover/item:bg-info-bg/60';
  if (href.includes('/trending'))
    return 'bg-primary/10 text-primary group-hover/item:bg-primary/20';
  if (href.includes('/help')) return 'bg-success-bg text-success group-hover/item:bg-success-bg/60';
  if (href.includes('/tools'))
    return 'bg-category-mcp-bg text-category-mcp group-hover/item:bg-category-mcp-hover';
  if (href.includes('/submit')) return 'bg-primary/10 text-primary group-hover/item:bg-primary/20';
  if (href.includes('/community')) return 'bg-info-bg text-info group-hover/item:bg-info-bg/60';
  if (href.includes('/companies'))
    return 'bg-muted/50 text-muted-foreground group-hover/item:bg-muted';
  if (href.includes('/partner'))
    return 'bg-warning-bg text-warning group-hover/item:bg-warning-bg/60';
  if (href.includes('/consulting'))
    return 'bg-primary/10 text-primary group-hover/item:bg-primary/20';
  if (href.includes('/contact')) return 'bg-info-bg text-info group-hover/item:bg-info-bg/60';
  if (href.includes('/rss') || href.includes('/feeds'))
    return 'bg-primary/10 text-primary group-hover/item:bg-primary/20';
  if (href.includes('/llms.txt'))
    return 'bg-category-mcp-bg text-category-mcp group-hover/item:bg-category-mcp-hover';

  // Default gradient
  return 'bg-gradient-to-br from-muted/50 to-muted/30 text-muted-foreground group-hover/item:from-accent/20 group-hover/item:to-accent/10 group-hover/item:text-accent';
}
