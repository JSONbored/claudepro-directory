'use client';

import type { Database } from '@heyclaude/database-types';
import { cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import * as Icons from '@heyclaude/web-runtime/icons';
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
} from '@heyclaude/web-runtime/ui';

/**
 * Command palette navigation - Uses server-provided data from getNavigationMenu()
 */

interface NavigationCommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Navigation data from server (required) */
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
}

/**
 * Renders a searchable command-palette for site navigation and toggles open/closed with the keyboard shortcut ⌘/Ctrl+K.
 *
 * Renders groups for primary, secondary, and action navigation items, maps item icons and descriptions, and navigates via Next.js router when an item is selected.
 *
 * @param controlledOpen - If provided, controls the open state externally (controlled component).
 * @param onOpenChange - Optional callback invoked with the new open state when the palette is opened or closed.
 * @param navigationData - Server-provided navigation data containing `primary`, `secondary`, and `actions` arrays of navigation menu items.
 *
 * @returns A React element that displays the navigation command palette.
 *
 * @see CommandDialog
 * @see Database
 */
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
      return <IconComponent className={`${iconSize.sm} shrink-0 text-muted-foreground`} />;
    }
    return null;
  };

  type NavigationMenuItem = Database['public']['CompositeTypes']['navigation_menu_item'];

  const renderItem = (item: NavigationMenuItem) => {
    if (!item.path) return null;
    const path = item.path; // Type narrowing: path is now definitely string
    return (
      <CommandItem key={path} onSelect={() => handleSelect(path)} className="group cursor-pointer">
        <span className={cluster.compact}>
          {getIcon(item.icon_name)}
          <div className="flex flex-col items-start">
            <span>{item.title}</span>
            {item.description && (
              <span
                className="text-muted-foreground text-xs transition-colors group-hover:text-accent"
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