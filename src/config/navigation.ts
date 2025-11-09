/**
 * Type-safe navigation configuration for all site navigation links
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
} from '@/src/lib/icons';

export interface NavigationLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  isNew?: boolean;
  external?: boolean;
  children?: NavigationLink[];
}

export interface NavigationGroup {
  heading: string;
  links: NavigationLink[];
}
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

export const ACTION_LINKS: NavigationLink[] = [
  {
    label: 'Create',
    href: '/submit',
    icon: PlusCircle,
    description: 'Share your configuration',
  },
];

export function getAllNavigationLinks(): NavigationLink[] {
  const secondaryLinks = SECONDARY_NAVIGATION.flatMap((group) => group.links);
  return [...PRIMARY_NAVIGATION, ...secondaryLinks, ...ACTION_LINKS];
}

export function getNavigationLinkByPath(path: string): NavigationLink | undefined {
  return getAllNavigationLinks().find((link) => link.href === path);
}

export function isActivePath(linkPath: string, currentPath: string): boolean {
  if (linkPath === '/' && currentPath === '/') return true;
  if (linkPath !== '/' && currentPath.startsWith(linkPath)) return true;
  return false;
}

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
