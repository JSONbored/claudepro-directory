'use client';

import { between, iconSize, cluster, spaceY, marginTop, muted, weight ,size , padding , gap } from '@heyclaude/web-runtime/design-system';
import { Clock, Trash, X } from '@heyclaude/web-runtime/icons';
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

/**
 * Renders a mobile-only "Recently Viewed" bottom tray that shows locally saved browsing history.
 *
 * The tray auto-opens when recently viewed items are loaded and the user has not dismissed it.
 * It persists a "don't show again" preference to localStorage and allows clearing or removing items.
 *
 * @returns The component's React element, or `null` when the tray is hidden.
 *
 * @see {@link useRecentlyViewed}
 * @see {@link getCategoryRoute}
 */
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
        className={`-translate-x-1/2 fixed bottom-20 left-1/2 z-40 ${cluster.compact} rounded-full border border-border/60 bg-card/90 ${padding.xDefault} ${padding.yCompact} ${size.sm} shadow-lg backdrop-blur md:hidden`}
        onClick={() => setOpen(true)}
      >
        <Clock className={iconSize.sm} aria-hidden="true" />
        Recently viewed ({recentlyViewed.length})
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className={`h-[80vh] overflow-y-auto ${padding.xNone} md:hidden`}>
          <SheetHeader className="px-6">
            <SheetTitle>Recently Viewed</SheetTitle>
            <SheetDescription>Your locally saved browsing history.</SheetDescription>
          </SheetHeader>
          <div className={`${spaceY.comfortable} ${padding.xComfortable} pb-6`}>
            <div className={`${cluster.compact} ${muted.sm}`}>
              <Button variant="ghost" size="sm" onClick={clearAll} className={`${gap.compact}`}>
                <Trash className={iconSize.sm} aria-hidden="true" />
                Clear all
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismissForever} className={`${gap.compact}`}>
                <X className={iconSize.sm} aria-hidden="true" />
                Don't show again
              </Button>
            </div>
            <ul className={spaceY.default}>
              {sortedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className={`rounded-xl border border-border/50 ${padding.default}`}
                >
                  <div className={between.center}>
                    <div>
                      <p className={`${muted.default} ${size.xs} uppercase`}>{item.category}</p>
                      <Link
                        href={`/${getCategoryRoute(item.category)}/${item.slug}`}
                        className={`${weight.semibold} ${size.base} text-primary hover:underline`}
                        onClick={() => setOpen(false)}
                      >
                        {item.title}
                      </Link>
                    </div>
                    <button
                      type="button"
                      className={`${muted.default} transition-colors hover:text-destructive`}
                      onClick={() => removeItem(item.category, item.slug)}
                      aria-label={`Remove ${item.title} from recently viewed`}
                    >
                      <X className={iconSize.sm} aria-hidden="true" />
                    </button>
                  </div>
                  {item.description && (
                    <p className={`${marginTop.compact} line-clamp-3 ${muted.sm}`}>
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className={`${marginTop.compact} flex flex-wrap ${gap.compact} ${muted.default} ${size.xs}`}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={`rounded-full bg-muted ${padding.xTight} ${padding.yHair}`}>
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