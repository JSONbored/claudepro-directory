'use client';

import { Button } from '@/src/components/ui/button';
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
    sm: `h-8 ${UI_CLASSES.PX_3} ${UI_CLASSES.TEXT_XS}`,
    md: `h-10 ${UI_CLASSES.PX_4} text-sm`,
    lg: `h-12 ${UI_CLASSES.PX_6} text-base`,
  };

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`
          ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.GAP_3} w-full max-w-md ${UI_CLASSES.PX_4} py-2.5
          bg-background border border-border ${UI_CLASSES.ROUNDED_LG}
          text-muted-foreground hover:text-foreground
          hover:border-border/80 transition-colors
          ${UI_CLASSES.GROUP} cursor-pointer
          ${className}
        `}
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        <span className={`${UI_CLASSES.FLEX_1} text-left text-sm`}>Search content...</span>
        {showShortcut && (
          <div
            className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.GAP_1} ${UI_CLASSES.TEXT_XS}`}
          >
            <kbd className={`px-1.5 py-0.5 ${UI_CLASSES.TEXT_XS} bg-muted border rounded`}>⌘K</kbd>
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
        <div className={`ml-2 ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.GAP_1}`}>
          <kbd
            className={`px-1.5 py-0.5 ${UI_CLASSES.TEXT_XS} bg-muted border rounded ${UI_CLASSES.HIDDEN} sm:${UI_CLASSES.INLINE_BLOCK}`}
          >
            ⌘K
          </kbd>
        </div>
      )}
    </Button>
  );
}
