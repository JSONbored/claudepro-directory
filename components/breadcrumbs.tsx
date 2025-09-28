'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import type { BreadcrumbItem } from '@/lib/schemas/component.schema';

export function Breadcrumbs() {
  const pathname = usePathname();

  // Only show breadcrumbs on detail pages (paths with 3 segments like /agents/some-agent)
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length < 2) {
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

      const mappedLabel = labelMap[path.toLowerCase()];
      if (mappedLabel) {
        label = mappedLabel;
      }

      if (isLast) {
        breadcrumbs.push({ label });
      } else {
        breadcrumbs.push({ label, href: currentPath });
      }
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
      className="flex items-center space-x-1 text-sm text-muted-foreground"
    >
      <ol
        className="flex items-center space-x-1"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbs.map((item, index) => {
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
