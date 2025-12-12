'use client';

import { Search } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';
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
        className={`group border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground flex w-full max-w-md cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${className}`}
      >
        <Search
          className={`${UI_CLASSES.ICON_SM} text-muted-foreground ${UI_CLASSES.GROUP_HOVER_ACCENT}`}
        />
        <span className="flex-1 text-left text-sm">Search content...</span>
        {showShortcut ? (
          <div className="flex items-center gap-1 text-xs">
            <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">⌘K</kbd>
          </div>
        ) : null}
      </button>
    );
  }

  return (
    <Button variant={variant} onClick={handleClick} className={`${sizeClasses[size]} ${className}`}>
      <Search className={UI_CLASSES.ICON_SM} />
      <span className="sr-only">Search</span>
      {showShortcut && size !== 'sm' ? (
        <div className="ml-2 flex items-center gap-1">
          <kbd className="bg-muted hidden rounded border px-1.5 py-0.5 text-xs sm:inline-block">
            ⌘K
          </kbd>
        </div>
      ) : null}
    </Button>
  );
}
