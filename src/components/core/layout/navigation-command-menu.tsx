'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/src/components/primitives/ui/command';
import * as Icons from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

/**
 * Command palette navigation - Uses server-provided data from getNavigationMenu()
 */

interface NavigationCommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Navigation data from server (required) */
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
}

export function NavigationCommandMenu({
  open: controlledOpen,
  onOpenChange,
  navigationData,
}: NavigationCommandMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const inputId = useId();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Keyboard shortcut handler (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  // Dynamic icon mapper
  const getIcon = (icon_name: string | null | undefined) => {
    if (!icon_name) return null;
    const IconModule = Icons as Record<string, unknown>;
    const Icon = IconModule[icon_name];

    // Type guard: check if it's a valid React component
    if (typeof Icon === 'function') {
      const IconComponent = Icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className={`${UI_CLASSES.ICON_SM} shrink-0 text-muted-foreground`} />;
    }
    return null;
  };

  type NavigationMenuItem = Database['public']['CompositeTypes']['navigation_menu_item'];

  const renderItem = (item: NavigationMenuItem) => {
    if (!item.path) return null;
    const path = item.path; // Type narrowing: path is now definitely string
    return (
      <CommandItem key={path} onSelect={() => handleSelect(path)} className="group cursor-pointer">
        <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          {getIcon(item.icon_name)}
          <div className="flex flex-col items-start">
            <span>{item.title}</span>
            {item.description && (
              <span
                className={`text-muted-foreground text-xs transition-colors ${UI_CLASSES.GROUP_HOVER_ACCENT}`}
              >
                {item.description}
              </span>
            )}
          </div>
        </span>
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput id={inputId} name="command-search" placeholder="Search navigation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {navigationData.primary && navigationData.primary.length > 0 && (
          <>
            <CommandGroup heading="Primary Navigation">
              {navigationData.primary.map(renderItem).filter(Boolean)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {navigationData.secondary && navigationData.secondary.length > 0 && (
          <>
            <CommandGroup heading="More">
              {navigationData.secondary.map(renderItem).filter(Boolean)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {navigationData.actions && navigationData.actions.length > 0 && (
          <CommandGroup heading="Actions">
            {navigationData.actions.map(renderItem).filter(Boolean)}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
