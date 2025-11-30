'use client';

import { formatRelativeDate } from '@heyclaude/web-runtime';
import { iconSize, iconLeading } from '@heyclaude/web-runtime/design-system';
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

export function PinboardDrawer({ open, onOpenChange }: PinboardDrawerProps) {
  const { pinnedItems, isLoaded, unpinItem, clearAll } = usePinboard();
  const hasPins = pinnedItems.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <BookmarkPlus className={iconLeading.sm} />
            Pinned for Later
          </SheetTitle>
          <SheetDescription className="text-left">
            Save agents, MCP servers, and hooks without needing an account.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center justify-between text-muted-foreground text-sm">
          <span>{hasPins ? `${pinnedItems.length} saved` : 'No pinned items yet'}</span>
          {hasPins && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {!isLoaded && (
            <div className="space-y-3 rounded-lg border border-border/60 border-dashed p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted/30" />
            </div>
          )}

          {isLoaded && hasPins && (
            <ul className="space-y-3">
              {pinnedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className="rounded-lg border border-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide">
                        {item.category}
                        {item.typeName ? ` • ${item.typeName}` : ''}
                      </p>
                      <Link
                        href={`/${item.category}/${item.slug}`}
                        className="mt-1 block font-semibold text-base text-primary hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {item.title}
                      </Link>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-2 text-muted-foreground text-xs">
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
            <div className="rounded-lg border border-border/60 border-dashed p-6 text-center">
              <p className="font-medium">Nothing pinned yet</p>
              <p className="mt-2 text-muted-foreground text-sm">
                Tap “Pin for later” on any detail page to build your personal shortlist.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
