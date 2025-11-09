'use client';

import { Button } from '@/src/components/primitives/button';
import { Search } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface SearchTriggerProps {
  onClick?: () => void;
  variant?: 'outline' | 'minimal' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg';
  showShortcut?: boolean;
  className?: string;
}

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
          className={`${UI_CLASSES.ICON_SM} text-muted-foreground ${UI_CLASSES.GROUP_HOVER_ACCENT}`}
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
      <Search className={UI_CLASSES.ICON_SM} />
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
