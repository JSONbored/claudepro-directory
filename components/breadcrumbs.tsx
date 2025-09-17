'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on homepage
  if (pathname === '/') {
    return null;
  }

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;

      // Format the label
      let label = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Special case handling for known routes
      const labelMap: Record<string, string> = {
        mcp: 'MCP Servers',
        agents: 'AI Agents',
        rules: 'Rules',
        commands: 'Commands',
        hooks: 'Hooks',
        jobs: 'Jobs',
        community: 'Community',
        submit: 'Submit',
        trending: 'Trending',
      };

      if (labelMap[path.toLowerCase()]) {
        label = labelMap[path.toLowerCase()];
      }

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if only home
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-1 text-sm text-muted-foreground mb-4 px-4 md:px-6 lg:px-8"
    >
      <ol
        className="flex items-center space-x-1"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbs.map((item, index) => {
          const _isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <Fragment key={item.label}>
              {!isFirst && <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
              <li
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
                className="flex items-center"
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    itemProp="item"
                    className="hover:text-foreground transition-colors flex items-center"
                  >
                    {isFirst && <Home className="h-4 w-4 mr-1" />}
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : (
                  <span className="text-foreground font-medium flex items-center">
                    {isFirst && <Home className="h-4 w-4 mr-1" />}
                    <span itemProp="name">{item.label}</span>
                  </span>
                )}
                <meta itemProp="position" content={String(index + 1)} />
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
