'use client';

import {
  backdrop,
  between,
  borderColor,
  cluster,
  flexWrap,
  gap,
  iconSize,
  marginTop,
  muted,
  overflow,
  padding,
  paddingLeft,
  paddingBottom,
  radius,
  shadow,
  size,
  spaceY,
  transition,
  weight,
  zLayer,
  bgColor,
  textColor,
  display,
  position,
  height,
  truncate,
  border,
  transform,
} from '@heyclaude/web-runtime/design-system';
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
        className={`-translate-x-1/2 ${position.fixed} bottom-20 left-1/2 ${zLayer.overlay} ${cluster.compact} ${radius.full} ${border.default} ${borderColor['border/60']} ${bgColor['card/90']} ${padding.xDefault} ${padding.yCompact} ${size.sm} ${shadow.lg} ${backdrop.default} md:${display.none}`}
        onClick={() => setOpen(true)}
      >
        <Clock className={iconSize.sm} aria-hidden="true" />
        Recently viewed ({recentlyViewed.length})
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className={`${height.viewport80} ${overflow.yAuto} ${padding.xNone} md:${display.none}`}>
          <SheetHeader className={paddingLeft.relaxed}>
            <SheetTitle>Recently Viewed</SheetTitle>
            <SheetDescription>Your locally saved browsing history.</SheetDescription>
          </SheetHeader>
          <div className={`${spaceY.comfortable} ${padding.xComfortable} ${paddingBottom.relaxed}`}>
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
                  className={`${radius.xl} ${border.default} ${borderColor['border/50']} ${padding.default}`}
                >
                  <div className={between.center}>
                    <div>
                      <p className={`${muted.default} ${size.xs} ${transform.uppercase}`}>{item.category}</p>
                      <Link
                        href={`/${getCategoryRoute(item.category)}/${item.slug}`}
                        className={`${weight.semibold} ${size.base} ${textColor.primary} hover:underline`}
                        onClick={() => setOpen(false)}
                      >
                        {item.title}
                      </Link>
                    </div>
                    <button
                      type="button"
                      className={`${muted.default} ${transition.colors} hover:${textColor.destructive}`}
                      onClick={() => removeItem(item.category, item.slug)}
                      aria-label={`Remove ${item.title} from recently viewed`}
                    >
                      <X className={iconSize.sm} aria-hidden="true" />
                    </button>
                  </div>
                  {item.description && (
                    <p className={`${marginTop.compact} ${truncate.lines3} ${muted.sm}`}>
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className={`${marginTop.compact} ${display.flex} ${flexWrap.wrap} ${gap.compact} ${muted.default} ${size.xs}`}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={`${radius.full} ${bgColor.muted} ${padding.xTight} ${padding.yHair}`}>
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