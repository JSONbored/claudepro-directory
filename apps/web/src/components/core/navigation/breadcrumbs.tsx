'use client';

/**
 * Breadcrumbs - Supabase-style minimal navigation breadcrumbs
 *
 * Features:
 * - Clean, minimal design with chevron separators
 * - Auto-generates trail from pathname or accepts custom items
 * - Last item is non-interactive (current page)
 * - Supports truncation for long paths
 *
 * Note: JSON-LD breadcrumb schema is handled separately by StructuredData component
 * using the database's build_breadcrumb_json_ld RPC function
 */

import { ChevronRight, Home } from '@heyclaude/web-runtime/icons';
import { cn, STATE_PATTERNS } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  /** Custom breadcrumb items (overrides auto-generation) */
  items?: BreadcrumbItem[];
  /** Category label for content detail pages */
  categoryLabel?: string;
  /** Current page title (shown as last non-clickable item) */
  currentTitle?: string;
  /** Whether to show home icon */
  showHomeIcon?: boolean;
  /** Additional class names */
  className?: string;
  /** Maximum items to show before truncating (default: 4) */
  maxItems?: number;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegmentLabel(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(
  pathname: string,
  categoryLabel?: string,
  currentTitle?: string
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  if (pathname === '/') return items;

  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Use category label for first segment if provided
    if (index === 0 && categoryLabel) {
      items.push({ label: categoryLabel, href: currentPath });
    }
    // Use current title for last segment if provided
    else if (isLast && currentTitle) {
      items.push({ label: currentTitle, href: currentPath });
    }
    // Default: format the segment
    else {
      items.push({ label: formatSegmentLabel(segment), href: currentPath });
    }
  });

  return items;
}

export function Breadcrumbs({
  items: customItems,
  categoryLabel,
  currentTitle,
  showHomeIcon = true,
  className,
  maxItems = 4,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    if (customItems && customItems.length > 0) {
      return customItems;
    }
    return generateBreadcrumbs(pathname, categoryLabel, currentTitle);
  }, [customItems, pathname, categoryLabel, currentTitle]);

  // Truncate if too many items
  const displayItems = useMemo(() => {
    if (items.length <= maxItems) return items;
    
    // Guard against edge cases where maxItems < 3
    if (maxItems < 3) {
      // For maxItems=1, show only last item; for maxItems=2, show first and last
      if (maxItems === 1) return items.slice(-1);
      if (maxItems === 2) return [items[0]!, items[items.length - 1]!];
    }

    // Keep first, add ellipsis, then last (maxItems - 2) items
    const first = items[0];
    const take = Math.max(0, maxItems - 2);
    const last = take > 0 ? items.slice(-take) : [];
    return first ? [first, { label: '...', href: '#' }, ...last] : last;
  }, [items, maxItems]);

  if (displayItems.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {displayItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li key={`${item.href}-${index}`} className="flex items-center gap-1">
              {/* Separator (not before first item) */}
              {!isFirst && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                  aria-hidden="true"
                />
              )}

              {/* Ellipsis (non-interactive) */}
              {isEllipsis ? (
                <span className="px-1 text-muted-foreground" aria-hidden="true">
                  …
                </span>
              ) : isLast ? (
                /* Current page (non-interactive) */
                <span
                  className="max-w-[200px] truncate font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                /* Link to parent page */
                <Link
                  href={item.href}
                  className={cn(
                    STATE_PATTERNS.FOCUS_RING,
                    'flex items-center gap-1 rounded-sm text-muted-foreground transition-colors',
                    'hover:text-foreground'
                  )}
                >
                  {isFirst && showHomeIcon ? (
                    <>
                      <Home className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    <span className="max-w-[150px] truncate">{item.label}</span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
