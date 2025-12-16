'use client';

import { useRecentlyViewed, getCategoryRoute, useLocalStorage } from '@heyclaude/web-runtime/hooks';
import { Clock, Trash, X } from '@heyclaude/web-runtime/icons';
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from '@heyclaude/web-runtime/ui';
import { useBoolean } from '@heyclaude/web-runtime/hooks';
import Link from 'next/link';
import { useEffect } from 'react';
import { between, paddingX, paddingY, gap, spaceY, paddingBottom, padding, marginTop } from "@heyclaude/web-runtime/design-system";

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
  const { value: open, setTrue: setOpenTrue, setFalse: setOpenFalse } = useBoolean();
  
  // Use useLocalStorage for dismiss state
  const { value: dismissedValue, setValue: setDismissedValue } = useLocalStorage<string | null>(
    DISMISS_KEY,
    {
      defaultValue: null,
      syncAcrossTabs: false,
    }
  );
  
  const dismissed = dismissedValue === 'true';

  useEffect(() => {
    if (!dismissed && isLoaded && recentlyViewed.length > 0) {
      setOpenTrue();
    }
  }, [dismissed, isLoaded, recentlyViewed.length]);

  const handleDismissForever = () => {
    setDismissedValue('true');
    setOpenFalse();
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
        className={`border-border/60 bg-card/90 fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center ${gap.tight} rounded-full border ${paddingX.default} ${paddingY.tight} text-sm shadow-lg backdrop-blur md:hidden`}
        onClick={setOpenTrue}
      >
        <Clock className="h-4 w-4" aria-hidden="true" />
        Recently viewed ({recentlyViewed.length})
      </button>

      <Sheet open={open} onOpenChange={(open) => open ? setOpenTrue() : setOpenFalse()}>
        <SheetContent side="bottom" className={`h-[80vh] overflow-y-auto ${paddingX.default} md:hidden`}>
          <SheetHeader className={`${paddingX.comfortable}`}>
            <SheetTitle>Recently Viewed</SheetTitle>
            <SheetDescription>Your locally saved browsing history.</SheetDescription>
          </SheetHeader>
          <div className={`${spaceY.comfortable} ${paddingX.comfortable} ${paddingBottom.comfortable}`}>
            <div className={`text-muted-foreground flex items-center ${gap.tight} text-sm`}>
              <Button variant="ghost" size="sm" onClick={clearAll} className={`${gap.tight}`}>
                <Trash className="h-4 w-4" aria-hidden="true" />
                Clear all
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismissForever} className={`${gap.tight}`}>
                <X className="h-4 w-4" aria-hidden="true" />
                Don't show again
              </Button>
            </div>
            <ul className={`${spaceY.default}`}>
              {sortedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className={`border-border/50 rounded-xl border ${padding.default}`}
                >
                  <div className={between.center}>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase">{item.category}</p>
                      <Link
                        href={`/${getCategoryRoute(item.category)}/${item.slug}`}
                        className="text-primary text-base font-semibold hover:underline"
                        onClick={setOpenFalse}
                      >
                        {item.title}
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeItem(item.category, item.slug)}
                      aria-label={`Remove ${item.title} from recently viewed`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  {item.description ? (
                    <p className={`text-muted-foreground ${marginTop.compact} line-clamp-3 text-sm`}>
                      {item.description}
                    </p>
                  ) : null}
                  {item.tags && item.tags.length > 0 ? (
                    <div className={`text-muted-foreground ${marginTop.default} flex flex-wrap ${gap.tight} text-xs`}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={cn('bg-muted rounded-full', paddingX.tight, paddingY['1.5'])}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
