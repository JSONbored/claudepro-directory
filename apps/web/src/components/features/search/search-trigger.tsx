'use client';

import { iconSize, groupHover, cluster, border, radius, transition, srOnly, muted, padding, size as textSize , gap , maxWidth, cursor,
  bgColor,
  alignItems,
} from '@heyclaude/web-runtime/design-system';
import { Search } from '@heyclaude/web-runtime/icons';
import { Button } from '@heyclaude/web-runtime/ui';

interface SearchTriggerProps {
  onClick?: () => void;
  variant?: 'outline' | 'minimal' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showShortcut?: boolean;
  className?: string;
}

/**
 * Render a compact search trigger button that opens the search UI when activated.
 *
 * Renders either a full-width minimal button or a styled Button component depending on `variant`.
 *
 * @param onClick - Optional click handler invoked when the trigger is activated
 * @param variant - Visual variant of the trigger; one of `'outline' | 'minimal' | 'ghost' | 'default'` (default: `'outline'`)
 * @param size - Visual size of the trigger; one of `'sm' | 'md' | 'lg'` (default: `'md'`)
 * @param showShortcut - Whether to display the keyboard shortcut hint (⌘K) (default: `true`)
 * @param className - Optional additional class names applied to the root element
 * @returns A React element representing the search trigger button
 *
 * @see Search
 * @see Button
 * @see iconSize
 * @see groupHover
 */
export function SearchTrigger({
  onClick,
  variant = 'outline',
  size = 'md',
  showShortcut = true,
  className = '',
}: SearchTriggerProps) {
  const sizeClasses = {
    sm: `h-8 ${padding.xCompact} ${textSize.xs}`,
    md: `h-10 ${padding.xDefault} ${textSize.sm}`,
    lg: `h-12 ${padding.xComfortable} ${textSize.base}`,
  };

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full ${maxWidth.md} ${cursor.pointer} ${alignItems.center} ${gap.default} ${radius.lg} ${border.default} ${bgColor.background} ${padding.xDefault} ${padding.yTight} ${muted.default} ${transition.colors} hover:border-border/80 hover:text-foreground ${className}`}
      >
        <Search
          className={`${iconSize.sm} ${muted.default} ${groupHover.accent}`}
        />
        <span className={`flex-1 text-left ${textSize.sm}`}>Search content...</span>
        {showShortcut && (
          <div className={`${cluster.tight} ${textSize.xs}`}>
            <kbd className={`rounded border ${bgColor.muted} ${padding.xSnug} ${padding.yHair} ${textSize.xs}`}>⌘K</kbd>
          </div>
        )}
      </button>
    );
  }

  return (
    <Button variant={variant} onClick={onClick} className={`${sizeClasses[size]} ${className}`}>
      <Search className={iconSize.sm} />
      <span className={srOnly.default}>Search</span>
      {showShortcut && size !== 'sm' && (
        <div className={`ml-2 ${cluster.tight}`}>
          <kbd className={`hidden rounded border ${bgColor.muted} ${padding.xSnug} ${padding.yHair} ${textSize.xs} sm:inline-block`}>
            ⌘K
          </kbd>
        </div>
      )}
    </Button>
  );
}