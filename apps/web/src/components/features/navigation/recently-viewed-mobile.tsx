'use client';

import { Clock, Trash, X } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@heyclaude/web-runtime/ui';
import { useRecentlyViewed, getCategoryRoute } from '@heyclaude/web-runtime/hooks';

const DISMISS_KEY = 'heyclaude_recently_viewed_mobile_dismissed';

export function RecentlyViewedMobileTray() {
  const { recentlyViewed, isLoaded, removeItem, clearAll } = useRecentlyViewed();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      setDismissed(stored === 'true');
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (!dismissed && isLoaded && recentlyViewed.length > 0) {
      setOpen(true);
    }
  }, [dismissed, isLoaded, recentlyViewed.length]);

  const handleDismissForever = () => {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
    setOpen(false);
  };

  if (!isLoaded || recentlyViewed.length === 0 || dismissed) {
    return null;
  }

  const sortedItems = [...recentlyViewed].sort(
    (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
  );

  return (
    <>
      <button
        type="button"
        className="-translate-x-1/2 fixed bottom-20 left-1/2 z-40 flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-2 text-sm shadow-lg backdrop-blur md:hidden"
        onClick={() => setOpen(true)}
      >
        <Clock className="h-4 w-4" aria-hidden="true" />
        Recently viewed ({recentlyViewed.length})
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto px-0 md:hidden">
          <SheetHeader className="px-6">
            <SheetTitle>Recently Viewed</SheetTitle>
            <SheetDescription>Your locally saved browsing history.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-2">
                <Trash className="h-4 w-4" aria-hidden="true" />
                Clear all
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismissForever} className="gap-2">
                <X className="h-4 w-4" aria-hidden="true" />
                Don't show again
              </Button>
            </div>
            <ul className="space-y-3">
              {sortedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className="rounded-xl border border-border/50 p-4"
                >
                  <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">{item.category}</p>
                      <Link
                        href={`/${getCategoryRoute(item.category)}/${item.slug}`}
                        className="font-semibold text-base text-primary hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        {item.title}
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => removeItem(item.category, item.slug)}
                      aria-label={`Remove ${item.title} from recently viewed`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  {item.description && (
                    <p className="mt-2 line-clamp-3 text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-muted-foreground text-xs">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
