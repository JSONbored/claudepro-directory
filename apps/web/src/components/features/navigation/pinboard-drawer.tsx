'use client';

import { formatRelativeDate } from '@heyclaude/web-runtime';
import { usePinboard } from '@heyclaude/web-runtime/hooks';
import { BookmarkMinus, BookmarkPlus } from '@heyclaude/web-runtime/icons';
import { logClientInfo } from '@heyclaude/web-runtime/logging/client';
import {
  UI_CLASSES,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

interface PinboardDrawerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function PinboardDrawer({ open, onOpenChange }: PinboardDrawerProps) {
  const { pinnedItems, isLoaded, unpinItem, clearAll } = usePinboard();
  const hasPins = pinnedItems.length > 0;

  // CRITICAL: Ensure open is explicitly boolean (Radix UI requires this)
  const isOpen = open === true;

  // Log drawer state for debugging
  useEffect(() => {
    logClientInfo(
      '[PinboardDrawer] Render',
      'PinboardDrawer.render',
      {
        component: 'PinboardDrawer',
        action: 'render',
        category: 'navigation',
        open,
        isOpen,
        isLoaded,
        pinnedItemsCount: pinnedItems.length,
        hasOnOpenChange: Boolean(onOpenChange),
      }
    );
  }, [open, isOpen, isLoaded, pinnedItems.length, onOpenChange]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <BookmarkPlus className={UI_CLASSES.ICON_SM_LEADING} />
            Pinned for Later
          </SheetTitle>
          <SheetDescription className="text-left">
            Save agents, MCP servers, and hooks without needing an account.
          </SheetDescription>
        </SheetHeader>

        <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
          <span>{hasPins ? `${pinnedItems.length} saved` : 'No pinned items yet'}</span>
          {hasPins ? (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {!isLoaded && (
            <div className="border-border/60 space-y-3 rounded-lg border border-dashed p-4">
              <div className="bg-muted/60 h-4 w-2/3 animate-pulse rounded" />
              <div className="bg-muted/40 h-3 w-5/6 animate-pulse rounded" />
              <div className="bg-muted/30 h-3 w-1/2 animate-pulse rounded" />
            </div>
          )}

          {isLoaded && hasPins ? (
            <ul className="space-y-3">
              {pinnedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className="border-border/60 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-muted-foreground text-xs tracking-wide uppercase">
                        {item.category}
                        {item.typeName ? ` • ${item.typeName}` : ''}
                      </p>
                      <Link
                        href={`/${item.category}/${item.slug}`}
                        className="text-primary mt-1 block text-base font-semibold hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {item.title}
                      </Link>
                      {item.description ? (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {item.description}
                        </p>
                      ) : null}
                      <p className="text-muted-foreground mt-2 text-xs">
                        Pinned {formatRelativeDate(item.pinnedAt, { style: 'simple' })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => unpinItem(item.category, item.slug)}
                      aria-label={`Unpin ${item.title}`}
                    >
                      <BookmarkMinus className={UI_CLASSES.ICON_SM} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {isLoaded && !hasPins ? (
            <div className="border-border/60 rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">Nothing pinned yet</p>
              <p className="text-muted-foreground mt-2 text-sm">
                Tap “Pin for later” on any detail page to build your personal shortlist.
              </p>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
