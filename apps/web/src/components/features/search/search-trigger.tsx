'use client';

import { iconSize, groupHover } from '@heyclaude/web-runtime/design-system';
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
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full max-w-md cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground ${className}
        `}
      >
        <Search
          className={`${iconSize.sm} text-muted-foreground ${groupHover.accent}`}
        />
        <span className={'flex-1 text-left text-sm'}>Search content...</span>
        {showShortcut && (
          <div className={'flex items-center gap-1 text-xs'}>
            <kbd className={'rounded border bg-muted px-1.5 py-0.5 text-xs'}>⌘K</kbd>
          </div>
        )}
      </button>
    );
  }

  return (
    <Button variant={variant} onClick={onClick} className={`${sizeClasses[size]} ${className}`}>
      <Search className={iconSize.sm} />
      <span className="sr-only">Search</span>
      {showShortcut && size !== 'sm' && (
        <div className={'ml-2 flex items-center gap-1'}>
          <kbd className={'hidden rounded border bg-muted px-1.5 py-0.5 text-xs sm:inline-block'}>
            ⌘K
          </kbd>
        </div>
      )}
    </Button>
  );
}