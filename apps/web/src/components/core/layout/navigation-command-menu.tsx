'use client';

import * as Icons from '@heyclaude/web-runtime/icons';
import { getCommandMenuNavigationData } from '@heyclaude/web-runtime/config/navigation';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  UI_CLASSES,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useEffect, useId, useState } from 'react';

type NavigationMenuItem = {
  path: string;
  title: string;
  description: string | null;
  icon_name: string | null;
};

/**
 * Command palette navigation - Uses static navigation config
 */

interface NavigationCommandMenuProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function NavigationCommandMenu({
  open: controlledOpen,
  onOpenChange,
}: NavigationCommandMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const inputId = useId();

  const open = controlledOpen === undefined ? internalOpen : controlledOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Get navigation data from static config (no RPC needed)
  const navigationData = useMemo(() => getCommandMenuNavigationData(), []);

  // Log when dialog should be open but controlledOpen is undefined (indicates provider issue)
  useEffect(() => {
    if (open && controlledOpen === undefined && !internalOpen) {
      const normalized = normalizeError(
        new Error('CommandPaletteProvider may not be available'),
        'Dialog open state mismatch'
      );
      logClientWarn(
        '[Navigation] Dialog open state mismatch',
        normalized,
        'NavigationCommandMenu.stateMismatch',
        {
          component: 'NavigationCommandMenu',
          action: 'state-mismatch',
          category: 'navigation',
          open,
          controlledOpen: 'undefined',
          internalOpen,
          hasOnOpenChange: Boolean(onOpenChange),
        }
      );
    }
  }, [open, controlledOpen, internalOpen, onOpenChange]);

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
    // Strip query parameters added for uniqueness (section/group params)
    const cleanPath = path.split('?')[0];
    if (cleanPath) {
      router.push(cleanPath);
    }
  };

  // Dynamic icon mapper
  const getIcon = (icon_name: null | string | undefined) => {
    if (!icon_name) return null;
    const IconModule = Icons as Record<string, unknown>;
    const Icon = IconModule[icon_name];

    // Type guard: check if it's a valid React component
    if (typeof Icon === 'function') {
      const IconComponent = Icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className={`${UI_CLASSES.ICON_SM} text-muted-foreground shrink-0`} />;
    }
    return null;
  };

  const renderItem = (item: NavigationMenuItem) => {
    if (!item.path) return null;
    const path = item.path; // Type narrowing: path is now definitely string
    return (
      <CommandItem key={path} onSelect={() => handleSelect(path)} className="group cursor-pointer">
        <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
          {getIcon(item.icon_name)}
          <div className="flex flex-col items-start">
            <span>{item.title}</span>
            {item.description ? (
              <span
                className={`text-muted-foreground text-xs transition-colors ${UI_CLASSES.GROUP_HOVER_ACCENT}`}
              >
                {item.description}
              </span>
            ) : null}
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

        {navigationData.primary && navigationData.primary.length > 0 ? (
          <>
            <CommandGroup heading="Primary Navigation">
              {navigationData.primary.map(renderItem).filter(Boolean)}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {navigationData.secondary && navigationData.secondary.length > 0 ? (
          <>
            <CommandGroup heading="More">
              {navigationData.secondary.map(renderItem).filter(Boolean)}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {navigationData.actions && navigationData.actions.length > 0 ? (
          <CommandGroup heading="Actions">
            {navigationData.actions.map(renderItem).filter(Boolean)}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
