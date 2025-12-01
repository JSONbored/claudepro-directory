'use client';

import { formatRelativeDate } from '@heyclaude/web-runtime';
import { iconSize, iconLeading, animate, cluster, spaceY, marginTop, muted, weight, radius ,size , padding , gap } from '@heyclaude/web-runtime/design-system';
import { BookmarkMinus, BookmarkPlus } from '@heyclaude/web-runtime/icons';
import Link from 'next/link';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@heyclaude/web-runtime/ui';
import { usePinboard } from '@heyclaude/web-runtime/hooks';

interface PinboardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Displays a right-side drawer listing items the user pinned for later.
 *
 * Renders a header, a status row with a "Clear all" action when pins exist, a loading skeleton while pins load, and either a list of pinned items with unpin controls or an empty-state message. Clicking a pinned item's title navigates to its detail page and closes the drawer.
 *
 * @param open - Controls whether the drawer is visible.
 * @param onOpenChange - Called when the drawer open state should change.
 *
 * @returns The Pinboard drawer UI as a React element.
 *
 * @see usePinboard
 * @see formatRelativeDate
 */
export function PinboardDrawer({ open, onOpenChange }: PinboardDrawerProps) {
  const { pinnedItems, isLoaded, unpinItem, clearAll } = usePinboard();
  const hasPins = pinnedItems.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className={`${cluster.compact} text-left`}>
            <BookmarkPlus className={iconLeading.sm} />
            Pinned for Later
          </SheetTitle>
          <SheetDescription className="text-left">
            Save agents, MCP servers, and hooks without needing an account.
          </SheetDescription>
        </SheetHeader>

        <div className={`${marginTop.default} flex items-center justify-between ${muted.sm}`}>
          <span>{hasPins ? `${pinnedItems.length} saved` : 'No pinned items yet'}</span>
          {hasPins && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>

        <div className={`${marginTop.comfortable} ${spaceY.comfortable}`}>
          {!isLoaded && (
            <div className={`${spaceY.default} ${radius.lg} border border-border/60 border-dashed ${padding.default}`}>
              <div className={`h-4 w-2/3 ${animate.pulse} rounded bg-muted/60`} />
              <div className={`h-3 w-5/6 ${animate.pulse} rounded bg-muted/40`} />
              <div className={`h-3 w-1/2 ${animate.pulse} rounded bg-muted/30`} />
            </div>
          )}

          {isLoaded && hasPins && (
            <ul className={spaceY.default}>
              {pinnedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className={`${radius.lg} border border-border/60 ${padding.default}`}
                >
                  <div className={`flex items-start justify-between ${gap.comfortable}`}>
                    <div>
                      <p className={`${muted.default} ${size.xs} uppercase tracking-wide`}>
                        {item.category}
                        {item.typeName ? ` • ${item.typeName}` : ''}
                      </p>
                      <Link
                        href={`/${item.category}/${item.slug}`}
                        className={`${marginTop.tight} block ${weight.semibold} ${size.base} text-primary hover:underline`}
                        onClick={() => onOpenChange(false)}
                      >
                        {item.title}
                      </Link>
                      {item.description && (
                        <p className={`${marginTop.tight} line-clamp-2 ${muted.sm}`}>
                          {item.description}
                        </p>
                      )}
                      <p className={`${marginTop.compact} ${muted.default} ${size.xs}`}>
                        Pinned {formatRelativeDate(item.pinnedAt, { style: 'simple' })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => unpinItem(item.category, item.slug)}
                      aria-label={`Unpin ${item.title}`}
                    >
                      <BookmarkMinus className={iconSize.sm} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isLoaded && !hasPins && (
            <div className={`${radius.lg} border border-border/60 border-dashed ${padding.comfortable} text-center`}>
              <p className={weight.medium}>Nothing pinned yet</p>
              <p className={`${marginTop.compact} ${muted.sm}`}>
                Tap “Pin for later” on any detail page to build your personal shortlist.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}