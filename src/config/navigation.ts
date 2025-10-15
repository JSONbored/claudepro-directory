/**
 * Navigation Configuration
 *
 * Centralized, type-safe configuration for all navigation links across the application.
 * Supports multi-level navigation, icons, descriptions, and categorization.
 *
 * Architecture:
 * - Type-safe: Full TypeScript interfaces with validation
 * - Maintainable: Single source of truth for all nav links
 * - Scalable: Easy to add new links without modifying components
 * - SEO-friendly: Structured data for navigation
 *
 * @see Research Report: "shadcn Navbar Components" - Section 5
 */

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  FileText,
  Handshake,
  Layers,
  MessageSquare,
  Plug,
  PlusCircle,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from '@/src/lib/icons';

/**
 * Navigation Link Interface
 *
 * Defines the structure for all navigation links in the application.
 */
export interface NavigationLink {
  /** Display label */
  label: string;

  /** Route path */
  href: string;

  /** Optional icon component */
  icon?: LucideIcon;

  /** Optional description for dropdown menus */
  description?: string;

  /** Whether this is a new feature/category */
  isNew?: boolean;

  /** Optional external link indicator */
  external?: boolean;

  /** Optional sub-links for dropdown menus */
  children?: NavigationLink[];
}

/**
 * Navigation Group Interface
 *
 * Groups related navigation links with a heading.
 */
export interface NavigationGroup {
  /** Group heading */
  heading: string;

  /** Links in this group */
  links: NavigationLink[];
}

/**
 * Primary Navigation Links
 *
 * Main navigation items displayed prominently in the nav bar.
 * Order matters - these appear left-to-right on desktop.
 */
export const PRIMARY_NAVIGATION: NavigationLink[] = [
  {
    label: 'Agents',
    href: '/agents',
    icon: Terminal,
    description: 'AI-powered task automation agents',
  },
  {
    label: 'Skills',
    href: '/skills',
    icon: BookOpen,
    description: 'Task-focused capability guides (PDF/DOCX/PPTX/XLSX)',
    isNew: true,
  },
  {
    label: 'Commands',
    href: '/commands',
    icon: Zap,
    description: 'Slash commands for Claude Code',
  },
  {
    label: 'Hooks',
    href: '/hooks',
    icon: Layers,
    description: 'Event-driven automation workflows',
  },
  {
    label: 'MCP',
    href: '/mcp',
    icon: Plug,
    description: 'Model Context Protocol servers',
  },
  {
    label: 'Rules',
    href: '/rules',
    icon: FileText,
    description: 'Project rules and guidelines',
  },
  {
    label: 'Statuslines',
    href: '/statuslines',
    icon: Terminal,
    description: 'Customizable editor status bars',
    isNew: true,
  },
  {
    label: 'Collections',
    href: '/collections',
    icon: Layers,
    description: 'Curated content bundles',
    isNew: true,
  },
  {
    label: 'Guides',
    href: '/guides',
    icon: BookOpen,
    description: 'Tutorials and how-to guides',
  },
];

/**
 * Secondary Navigation Links
 *
 * Additional links displayed in "More" dropdown or secondary menu.
 * Grouped by category for better organization.
 */
export const SECONDARY_NAVIGATION: NavigationGroup[] = [
  {
    heading: 'Discover',
    links: [
      {
        label: 'For You',
        href: '/for-you',
        icon: Sparkles,
        description: 'Personalized recommendations',
      },
      {
        label: 'Trending',
        href: '/trending',
        icon: TrendingUp,
        description: 'Popular configurations',
      },
      {
        label: 'Board',
        href: '/board',
        icon: MessageSquare,
        description: 'Community discussions',
      },
      {
        label: 'Companies',
        href: '/companies',
        icon: Building,
        description: 'Browse company profiles',
      },
    ],
  },
  {
    heading: 'Resources',
    links: [
      {
        label: 'Changelog',
        href: '/changelog',
        icon: Calendar,
        description: 'Latest updates and releases',
      },
      {
        label: 'Jobs',
        href: '/jobs',
        icon: Briefcase,
        description: 'Find career opportunities',
      },
    ],
  },
  {
    heading: 'Community',
    links: [
      {
        label: 'Community',
        href: '/community',
        icon: Users,
        description: 'Join our community',
      },
      {
        label: 'Partner Program',
        href: '/partner',
        icon: Handshake,
        description: 'Become a partner',
      },
    ],
  },
];

/**
 * Action Links
 *
 * Call-to-action links (typically buttons in the nav bar).
 */
export const ACTION_LINKS: NavigationLink[] = [
  {
    label: 'Submit Config',
    href: '/submit',
    icon: PlusCircle,
    description: 'Share your configuration',
  },
];

/**
 * Get All Navigation Links (Flat)
 *
 * Returns a flat array of all navigation links for search/command palette.
 *
 * @returns Flat array of all navigation links
 */
export function getAllNavigationLinks(): NavigationLink[] {
  const secondaryLinks = SECONDARY_NAVIGATION.flatMap((group) => group.links);
  return [...PRIMARY_NAVIGATION, ...secondaryLinks, ...ACTION_LINKS];
}

/**
 * Get Navigation Link by Path
 *
 * Finds a navigation link by its href path.
 *
 * @param path - The path to search for
 * @returns Navigation link or undefined if not found
 */
export function getNavigationLinkByPath(path: string): NavigationLink | undefined {
  return getAllNavigationLinks().find((link) => link.href === path);
}

/**
 * Is Active Path Helper
 *
 * Determines if a navigation link is active based on current pathname.
 *
 * @param linkPath - The navigation link path
 * @param currentPath - The current pathname
 * @returns True if the link is active
 */
export function isActivePath(linkPath: string, currentPath: string): boolean {
  // Exact match for homepage
  if (linkPath === '/' && currentPath === '/') {
    return true;
  }

  // Prefix match for all other routes
  if (linkPath !== '/' && currentPath.startsWith(linkPath)) {
    return true;
  }

  return false;
}

/**
 * Get Breadcrumb Trail
 *
 * Generates breadcrumb navigation from current path.
 *
 * @param pathname - Current pathname
 * @returns Array of navigation links forming breadcrumb trail
 *
 * @example
 * ```ts
 * getBreadcrumbTrail('/agents/production-specialist')
 * // Returns: [{ label: 'Home', href: '/' }, { label: 'Agents', href: '/agents' }]
 * ```
 */
export function getBreadcrumbTrail(pathname: string): NavigationLink[] {
  const breadcrumbs: NavigationLink[] = [
    {
      label: 'Home',
      href: '/',
    },
  ];

  if (pathname === '/') {
    return breadcrumbs;
  }

  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const link = getNavigationLinkByPath(currentPath);

    if (link) {
      breadcrumbs.push(link);
    } else {
      // Fallback for dynamic routes
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}
