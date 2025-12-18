'use client';

import { Search } from '@heyclaude/web-runtime/icons';
import { Button } from '@heyclaude/web-runtime/ui';
import { logClientInfo } from '@heyclaude/web-runtime/logging/client';

interface SearchTriggerProps {
  className?: string;
  onClick?: () => void;
  showShortcut?: boolean;
  size?: 'lg' | 'md' | 'sm';
  variant?: 'default' | 'ghost' | 'minimal' | 'outline';
}

export function SearchTrigger({
  onClick,
  variant = 'outline',
  size = 'md',
  showShortcut = true,
  className = '',
}: SearchTriggerProps) {
  const handleClick = () => {
    logClientInfo(
      '[SearchTrigger] Clicked',
      'SearchTrigger.onClick',
      {
        component: 'SearchTrigger',
        action: 'click',
        category: 'navigation',
        hasOnClick: Boolean(onClick),
      }
    );
    onClick?.();
  };
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full max-w-md cursor-pointer items-center gap-3 border-border bg-background px-4 py-2.5 text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground card-base group ${className}`}
      >
        <Search
          className="h-4 w-4 text-muted-foreground group-hover:text-accent"
        />
        <span className="flex-1 text-left text-sm">Search content...</span>
        {showShortcut ? (
          <div className="flex items-center gap-1 text-xs">
            <kbd className="rounded-lg border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
          </div>
        ) : null}
      </button>
    );
  }

  return (
    <Button variant={variant} onClick={handleClick} className={`${sizeClasses[size]} ${className}`}>
      <Search className="h-4 w-4" />
      <span className="sr-only">Search</span>
      {showShortcut && size !== 'sm' ? (
        <div className="ml-2 flex items-center gap-0.5">
          <kbd className="hidden rounded-lg border bg-muted px-1.5 py-0.5 text-xs sm:inline-block">
            ⌘K
          </kbd>
        </div>
      ) : null}
    </Button>
  );
}
