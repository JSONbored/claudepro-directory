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
  Bookmark,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  FileText,
  Github,
  Handshake,
  HelpCircle,
  Layers,
  type LucideIcon,
  MessageSquare,
  PlusCircle,
  Plug,
  Rocket,
  Rss,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  TrendingUp,
  User,
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
  /** Optional section grouping for organized dropdowns */
  sections?: NavigationSection[];
}

/** A section within a navigation dropdown */
export interface NavigationSection {
  /** Section heading label */
  heading: string;
  /** Links in this section */
  links: NavigationLink[];
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
    sections: [
      {
        heading: 'Configure',
        links: [
          {
            label: 'CLAUDE.md',
            href: '/rules',
            icon: FileText,
            description: 'Project rules and guidelines',
          },
          {
            label: 'Agents',
            href: '/agents',
            icon: Terminal,
            description: 'AI-powered task automation agents',
          },
          {
            label: 'Statuslines',
            href: '/statuslines',
            icon: Terminal,
            description: 'Customizable editor status bars',
          },
        ],
      },
      {
        heading: 'Extend',
        links: [
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
        ],
      },
      {
        heading: 'Integrate',
        links: [
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
        ],
      },
      {
        heading: 'Discover',
        links: [
          {
            label: 'Collections',
            href: '/collections',
            icon: Layers,
            description: 'Curated content bundles',
          },
        ],
      },
    ],
  },
  {
    label: 'Discover',
    href: '#',
    icon: Sparkles,
    description: 'Find content and people',
    sections: [
      {
        heading: 'Browse',
        links: [
          {
            label: 'Trending',
            href: '/trending',
            icon: TrendingUp,
            description: 'Popular configurations this week',
          },
          {
            label: 'Search',
            href: '/search',
            icon: Sparkles,
            description: 'Find configurations and content',
          },
        ],
      },
      {
        heading: 'Community',
        links: [
          {
            label: 'Community Directory',
            href: '/community/directory',
            icon: Users,
            description: 'Browse all users and profiles',
          },
          {
            label: 'Community',
            href: '/community',
            icon: MessageSquare,
            description: 'Join discussions and connect',
          },
        ],
      },
      {
        heading: 'Companies',
        links: [
          {
            label: 'Browse Companies',
            href: '/companies',
            icon: Building,
            description: 'Find organizations and teams',
          },
        ],
      },
    ],
  },
  {
    label: 'Resources',
    href: '#',
    icon: BookOpen,
    description: 'Learning and tools',
    sections: [
      {
        heading: 'Learn',
        links: [
          {
            label: 'Guides',
            href: '/guides',
            icon: BookOpen,
            description: 'Tutorials and how-to guides',
          },
          {
            label: 'Help Center',
            href: '/help',
            icon: HelpCircle,
            description: 'FAQs and support documentation',
          },
          {
            label: 'Changelog',
            href: '/changelog',
            icon: Calendar,
            description: 'Latest updates and releases',
          },
        ],
      },
      {
        heading: 'Tools',
        links: [
          {
            label: 'Config Recommender',
            href: '/tools/config-recommender',
            icon: Sparkles,
            description: 'Get personalized recommendations',
            isNew: true,
          },
        ],
      },
      {
        heading: 'Formats',
        links: [
          {
            label: 'LLMs.txt',
            href: '/llms.txt',
            icon: FileText,
            description: 'AI-optimized content format',
          },
          {
            label: 'RSS Feed',
            href: '/api/feeds',
            icon: Rss,
            description: 'Subscribe to updates',
            external: true,
          },
        ],
      },
    ],
  },
  {
    label: 'Contribute',
    href: '#',
    icon: Rocket,
    description: 'Ways to contribute and engage',
    sections: [
      {
        heading: 'Submit',
        links: [
          {
            label: 'Submit Content',
            href: '/submit',
            icon: PlusCircle,
            description: 'Share your configurations',
          },
        ],
      },
      {
        heading: 'Partner',
        links: [
          {
            label: 'Partner Program',
            href: '/partner',
            icon: Handshake,
            description: 'Become a partner',
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
        ],
      },
    ],
  },
  {
    label: 'Jobs',
    href: '#',
    icon: Briefcase,
    description: 'Find career opportunities',
    sections: [
      {
        heading: 'Browse',
        links: [
          {
            label: 'Browse All Jobs',
            href: '/jobs',
            icon: Briefcase,
            description: 'View all job listings',
          },
          {
            label: 'Remote Jobs',
            href: '/jobs?remote=true',
            icon: Building,
            description: 'Remote opportunities',
          },
        ],
      },
    ],
  },
];

/** Secondary navigation groups shown in "More" dropdown */
export const SECONDARY_NAVIGATION: NavigationGroup[] = [
  {
    heading: 'Support',
    links: [
      {
        label: 'Help Center',
        href: '/help',
        icon: HelpCircle,
        description: 'FAQs and support documentation',
      },
      {
        label: 'Contact',
        href: '/contact',
        icon: MessageSquare,
        description: 'Get in touch with us',
      },
      {
        label: 'Consulting',
        href: '/consulting',
        icon: Briefcase,
        description: 'Professional consulting services',
      },
      {
        label: 'Accessibility',
        href: '/accessibility',
        icon: Shield,
        description: 'Accessibility information',
      },
      {
        label: 'Privacy',
        href: '/privacy',
        icon: Shield,
        description: 'Privacy policy',
      },
      {
        label: 'Terms',
        href: '/terms',
        icon: FileText,
        description: 'Terms of service',
      },
      {
        label: 'Cookies',
        href: '/cookies',
        icon: Settings,
        description: 'Cookie policy',
      },
    ],
  },
  {
    heading: 'Community',
    links: [
      {
        label: 'Pinboard',
        href: '#',
        icon: Bookmark,
        description: 'View your saved items',
        // Note: Special handling in desktop navigation to open drawer instead of navigating
      },
      {
        label: 'Discord',
        href: 'https://discord.gg/Ax3Py4YDrq',
        icon: MessageSquare,
        description: 'Join our Discord community',
        external: true,
      },
      {
        label: 'GitHub',
        href: 'https://github.com/heyclaude/directory',
        icon: Github,
        description: 'Star us on GitHub',
        external: true,
      },
    ],
  },
];

/** Action links (CTAs) */
export const ACTION_LINKS: NavigationLink[] = [
  // Removed Create+ button - unused and minimal design
  // Users can still access /submit directly if needed
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

/**
 * Get icon name from LucideIcon component
 * Creates a reverse mapping from icon component to its name string
 */
function getIconName(icon?: LucideIcon): string | null {
  if (!icon) return null;
  
  // Create reverse mapping from icon component to name
  const iconNameMap: Map<LucideIcon, string> = new Map([
    [BookOpen, 'BookOpen'],
    [Briefcase, 'Briefcase'],
    [Building, 'Building'],
    [Calendar, 'Calendar'],
    [FileText, 'FileText'],
    [Handshake, 'Handshake'],
    [HelpCircle, 'HelpCircle'],
    [Layers, 'Layers'],
    [MessageSquare, 'MessageSquare'],
    [PlusCircle, 'PlusCircle'],
    [Plug, 'Plug'],
    [Rocket, 'Rocket'],
    [Rss, 'Rss'],
    [Settings, 'Settings'],
    [Shield, 'Shield'],
    [Sparkles, 'Sparkles'],
    [Terminal, 'Terminal'],
    [TrendingUp, 'TrendingUp'],
    [User, 'User'],
    [Users, 'Users'],
    [Zap, 'Zap'],
  ]);
  
  return iconNameMap.get(icon) ?? null;
}

/**
 * Convert NavigationLink to command menu item format
 * Flattens sections and children into a single array of items
 */
function convertLinkToCommandItems(link: NavigationLink): Array<{
  path: string;
  title: string;
  description: string | null;
  icon_name: string | null;
}> {
  const items: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> = [];

  // Skip links with href='#' (parent items with children)
  if (link.href !== '#') {
    items.push({
      path: link.href,
      title: link.label,
      description: link.description ?? null,
      icon_name: getIconName(link.icon),
    });
  }

  // Flatten sections (for Configs dropdown)
  if (link.sections) {
    let sectionIndex = 0;
    for (const section of link.sections) {
      for (const childLink of section.links) {
        // CRITICAL FIX: Create unique path by including section heading AND index
        // This prevents duplicates when the same heading appears multiple times (e.g., "Community")
        // Use section heading + section index + path to ensure uniqueness
        const uniquePath = childLink.href === '#' 
          ? childLink.href 
          : `${childLink.href}?section=${encodeURIComponent(section.heading)}&sectionIndex=${sectionIndex}`;
        items.push({
          path: uniquePath,
          title: childLink.label,
          description: childLink.description ?? null,
          icon_name: getIconName(childLink.icon),
        });
      }
      sectionIndex++;
    }
  }

  // Flatten children (legacy format)
  if (link.children) {
    for (const childLink of link.children) {
      items.push({
        path: childLink.href,
        title: childLink.label,
        description: childLink.description ?? null,
        icon_name: getIconName(childLink.icon),
      });
    }
  }

  return items;
}

/**
 * Get navigation data for command palette
 * Converts static config to command menu format
 * @returns Navigation data in command menu format
 */
export function getCommandMenuNavigationData(): {
  primary: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> | null;
  secondary: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> | null;
  actions: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> | null;
} {
  // Convert primary navigation (flatten sections/children)
  const primary: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> = [];

  for (const link of PRIMARY_NAVIGATION) {
    const items = convertLinkToCommandItems(link);
    primary.push(...items);
  }

  // Convert secondary navigation (from groups)
  const secondary: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> = [];

  for (const group of SECONDARY_NAVIGATION) {
    for (const link of group.links) {
      const items = convertLinkToCommandItems(link);
      // Add group context to paths to ensure uniqueness
      const itemsWithContext = items.map(item => ({
        ...item,
        path: item.path === '#' ? item.path : `${item.path}?group=${encodeURIComponent(group.heading)}`,
      }));
      secondary.push(...itemsWithContext);
    }
  }

  // Convert action links
  const actions: Array<{
    path: string;
    title: string;
    description: string | null;
    icon_name: string | null;
  }> = [];

  for (const link of ACTION_LINKS) {
    const items = convertLinkToCommandItems(link);
    actions.push(...items);
  }

  return {
    primary: primary.length > 0 ? primary : null,
    secondary: secondary.length > 0 ? secondary : null,
    actions: actions.length > 0 ? actions : null,
  };
}
