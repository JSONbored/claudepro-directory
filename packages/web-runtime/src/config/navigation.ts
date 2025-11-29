/**
 * Navigation Configuration
 *
 * Type-safe navigation configuration for all site navigation links.
 * Provides primary navigation, secondary navigation groups, and action links.
 *
 * @example
 * ```tsx
 * import { PRIMARY_NAVIGATION, isActivePath } from '@heyclaude/web-runtime/config/navigation';
 *
 * function Nav({ currentPath }: { currentPath: string }) {
 *   return (
 *     <nav>
 *       {PRIMARY_NAVIGATION.map((link) => (
 *         <a
 *           key={link.href}
 *           href={link.href}
 *           className={isActivePath(link.href, currentPath) ? 'active' : ''}
 *         >
 *           {link.label}
 *         </a>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 *
 * @module web-runtime/config/navigation
 */

import {
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  FileText,
  Handshake,
  Layers,
  type LucideIcon,
  MessageSquare,
  Plug,
  PlusCircle,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from '../icons.tsx';

/** A single navigation link with optional icon and children */
export interface NavigationLink {
  /** Display label for the link */
  label: string;
  /** URL path or href */
  href: string;
  /** Optional Lucide icon component */
  icon?: LucideIcon;
  /** Optional description for tooltips/dropdowns */
  description?: string;
  /** Whether to show a "new" badge */
  isNew?: boolean;
  /** Whether link opens in new tab */
  external?: boolean;
  /** Nested navigation links (for dropdowns) */
  children?: NavigationLink[];
}

/** A group of navigation links with a heading */
export interface NavigationGroup {
  /** Section heading */
  heading: string;
  /** Links in this group */
  links: NavigationLink[];
}

/** Primary navigation links shown in main nav */
export const PRIMARY_NAVIGATION: NavigationLink[] = [
  {
    label: 'Configs',
    href: '#',
    icon: Layers,
    description: 'Browse all configuration types',
    children: [
      {
        label: 'Agents',
        href: '/agents',
        icon: Terminal,
        description: 'AI-powered task automation agents',
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
        label: 'Skills',
        href: '/skills',
        icon: BookOpen,
        description: 'Task-focused capability guides (PDF/DOCX/PPTX/XLSX)',
        isNew: true,
      },
      {
        label: 'Statuslines',
        href: '/statuslines',
        icon: Terminal,
        description: 'Customizable editor status bars',
      },
      {
        label: 'Collections',
        href: '/collections',
        icon: Layers,
        description: 'Curated content bundles',
      },
    ],
  },
  {
    label: 'Trending',
    href: '/trending',
    icon: TrendingUp,
    description: 'Popular configurations',
  },
  {
    label: 'Guides',
    href: '/guides',
    icon: BookOpen,
    description: 'Tutorials and how-to guides',
  },
  {
    label: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
    description: 'Find career opportunities',
  },
  {
    label: 'Contact',
    href: '/contact',
    icon: MessageSquare,
    description: 'Get in touch with us',
  },
];

/** Secondary navigation groups shown in footer/sidebar */
export const SECONDARY_NAVIGATION: NavigationGroup[] = [
  {
    heading: 'Discover',
    links: [
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

/** Action links (CTAs) */
export const ACTION_LINKS: NavigationLink[] = [
  {
    label: 'Create',
    href: '/submit',
    icon: PlusCircle,
    description: 'Share your configuration',
  },
];

/**
 * Get all navigation links flattened into a single array
 * @returns All primary, secondary, and action links
 */
export function getAllNavigationLinks(): NavigationLink[] {
  const secondaryLinks = SECONDARY_NAVIGATION.flatMap((group) => group.links);
  return [...PRIMARY_NAVIGATION, ...secondaryLinks, ...ACTION_LINKS];
}

/**
 * Find a navigation link by its path
 * @param path - The URL path to search for
 * @returns The matching NavigationLink or undefined
 */
export function getNavigationLinkByPath(path: string): NavigationLink | undefined {
  return getAllNavigationLinks().find((link) => link.href === path);
}

/**
 * Check if a link path matches the current path
 * @param linkPath - The navigation link's path
 * @param currentPath - The current URL path
 * @returns True if the link should be marked as active
 */
export function isActivePath(linkPath: string, currentPath: string): boolean {
  if (linkPath === '/' && currentPath === '/') return true;
  if (linkPath !== '/' && currentPath.startsWith(linkPath)) return true;
  return false;
}

/**
 * Generate breadcrumb trail for a given pathname
 * @param pathname - The current URL pathname
 * @returns Array of NavigationLinks representing the breadcrumb trail
 */
export function getBreadcrumbTrail(pathname: string): NavigationLink[] {
  const breadcrumbs: NavigationLink[] = [{ label: 'Home', href: '/' }];
  if (pathname === '/') return breadcrumbs;

  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    const link = getNavigationLinkByPath(currentPath);

    if (link) {
      breadcrumbs.push(link);
    } else {
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}
