'use client';

import { formatRelativeDate } from '@heyclaude/web-runtime';
import {
  alignItems,
  animate,
  bgColor,
  border,
  cluster,
  display,
  gap,
  iconLeading,
  iconSize,
  justify,
  marginTop,
  maxWidth,
  muted,
  padding,
  radius,
  size,
  skeletonSize,
  spaceY,
  textAlign,
  textColor,
  tracking,
  weight,
  truncate,
  transform,
} from '@heyclaude/web-runtime/design-system';
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
      <SheetContent side="right" className={maxWidth.smLg}>
        <SheetHeader>
          <SheetTitle className={`${cluster.compact} ${textAlign.left}`}>
            <BookmarkPlus className={iconLeading.sm} />
            Pinned for Later
          </SheetTitle>
          <SheetDescription className={textAlign.left}>
            Save agents, MCP servers, and hooks without needing an account.
          </SheetDescription>
        </SheetHeader>

        <div className={`${marginTop.default} ${display.flex} ${alignItems.center} ${justify.between} ${muted.sm}`}>
          <span>{hasPins ? `${pinnedItems.length} saved` : 'No pinned items yet'}</span>
          {hasPins && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>

        <div className={`${marginTop.comfortable} ${spaceY.comfortable}`}>
          {!isLoaded && (
            <div className={`${spaceY.default} ${radius.lg} border ${border.dashedMedium} ${padding.default}`}>
              <div className={`${skeletonSize.barResponsive} ${animate.pulse} ${radius.default} ${bgColor['muted/60']}`} />
              <div className={`${skeletonSize.barSmResponsive} ${animate.pulse} ${radius.default} ${bgColor['muted/40']}`} />
              <div className={`${skeletonSize.barSmHalf} ${animate.pulse} ${radius.default} ${bgColor['muted/30']}`} />
            </div>
          )}

          {isLoaded && hasPins && (
            <ul className={spaceY.default}>
              {pinnedItems.map((item) => (
                <li
                  key={`${item.category}-${item.slug}`}
                  className={`${radius.lg} ${border.medium} ${padding.default}`}
                >
                  <div className={`${display.flex} ${alignItems.start} ${justify.between} ${gap.comfortable}`}>
                    <div>
                      <p className={`${muted.default} ${size.xs} ${transform.uppercase} ${tracking.wide}`}>
                        {item.category}
                        {item.typeName ? ` • ${item.typeName}` : ''}
                      </p>
                      <Link
                        href={`/${item.category}/${item.slug}`}
                        className={`${marginTop.tight} ${display.block} ${weight.semibold} ${size.base} ${textColor.primary} hover:underline`}
                        onClick={() => onOpenChange(false)}
                      >
                        {item.title}
                      </Link>
                      {item.description && (
                        <p className={`${marginTop.tight} ${truncate.lines2} ${muted.sm}`}>
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
            <div className={`${radius.lg} border ${border.dashedMedium} ${padding.comfortable} ${textAlign.center}`}>
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