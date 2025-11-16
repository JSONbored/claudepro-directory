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
import type { GetNavigationMenuReturn } from '@/src/types/database-overrides';

/**
 * Command palette navigation - Uses server-provided data from getNavigationMenu()
 */

interface NavigationCommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Navigation data from server (required) */
  navigationData: GetNavigationMenuReturn;
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
  const getIcon = (iconName: string) => {
    const IconModule = Icons as Record<string, unknown>;
    const Icon = IconModule[iconName];

    // Type guard: check if it's a valid React component
    if (typeof Icon === 'function') {
      const IconComponent = Icon as React.ComponentType<{ className?: string }>;
      return (
        <IconComponent className={`${UI_CLASSES.ICON_SM} flex-shrink-0 text-muted-foreground`} />
      );
    }
    return null;
  };

  const renderItem = (item: GetNavigationMenuReturn['primary'][number]) => (
    <CommandItem
      key={item.path}
      onSelect={() => handleSelect(item.path)}
      className="group cursor-pointer"
    >
      <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
        {getIcon(item.iconName)}
        <div className="flex flex-col items-start">
          <span>{item.title}</span>
          <span
            className={`text-muted-foreground text-xs transition-colors ${UI_CLASSES.GROUP_HOVER_ACCENT}`}
          >
            {item.description}
          </span>
        </div>
      </span>
    </CommandItem>
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput id={inputId} name="command-search" placeholder="Search navigation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {navigationData.primary.length > 0 && (
          <>
            <CommandGroup heading="Primary Navigation">
              {navigationData.primary.map(renderItem)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {navigationData.secondary.length > 0 && (
          <>
            <CommandGroup heading="More">{navigationData.secondary.map(renderItem)}</CommandGroup>
            <CommandSeparator />
          </>
        )}

        {navigationData.actions.length > 0 && (
          <CommandGroup heading="Actions">{navigationData.actions.map(renderItem)}</CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
