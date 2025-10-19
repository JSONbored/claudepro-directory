'use client';

import { Button } from '@/src/components/primitives/button';
import { Search } from '@/src/lib/icons';

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
        className={`
          flex items-center gap-3 w-full max-w-md px-4 py-2.5
          bg-background border border-border rounded-lg
          text-muted-foreground hover:text-foreground
          hover:border-border/80 transition-colors
          group cursor-pointer
          ${className}
        `}
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        <span className={'flex-1 text-left text-sm'}>Search content...</span>
        {showShortcut && (
          <div className={'flex items-center gap-1 text-xs'}>
            <kbd className={'px-1.5 py-0.5 text-xs bg-muted border rounded'}>⌘K</kbd>
          </div>
        )}
      </button>
    );
  }

  return (
    <Button variant={variant} onClick={onClick} className={`${sizeClasses[size]} ${className}`}>
      <Search className="h-4 w-4 mr-2" />
      Search
      {showShortcut && size !== 'sm' && (
        <div className={'ml-2 flex items-center gap-1'}>
          <kbd className={'px-1.5 py-0.5 text-xs bg-muted border rounded hidden sm:inline-block'}>
            ⌘K
          </kbd>
        </div>
      )}
    </Button>
  );
}
