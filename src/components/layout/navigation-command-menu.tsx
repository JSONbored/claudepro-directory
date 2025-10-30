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
} from '@/src/components/primitives/command';
import * as Icons from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Command palette navigation - Database-first (get_navigation_menu RPC)
 */

interface NavigationItem {
  path: string;
  title: string;
  description: string;
  iconName: string;
  group: 'primary' | 'secondary' | 'actions';
}

interface NavigationData {
  primary: NavigationItem[];
  secondary: NavigationItem[];
  actions: NavigationItem[];
}
interface NavigationCommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NavigationCommandMenu({
  open: controlledOpen,
  onOpenChange,
}: NavigationCommandMenuProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [navData, setNavData] = useState<NavigationData>({
    primary: [],
    secondary: [],
    actions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const inputId = useId();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Fetch navigation data from database
  useEffect(() => {
    let isMounted = true;

    async function fetchNavData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_navigation_menu');

        if (error || !data || !isMounted) return;

        if (isMounted) {
          setNavData(data as unknown as NavigationData);
        }
      } catch {
        // Silent fail
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchNavData();

    return () => {
      isMounted = false;
    };
  }, []);

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
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : null;
  };

  const renderItem = (item: NavigationItem) => (
    <CommandItem
      key={item.path}
      onSelect={() => handleSelect(item.path)}
      className="cursor-pointer group"
    >
      <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
        {getIcon(item.iconName)}
        <div className="flex flex-col items-start">
          <span>{item.title}</span>
          <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
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

        {!isLoading && navData.primary.length > 0 && (
          <>
            <CommandGroup heading="Primary Navigation">
              {navData.primary.map(renderItem)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {!isLoading && navData.secondary.length > 0 && (
          <>
            <CommandGroup heading="More">{navData.secondary.map(renderItem)}</CommandGroup>
            <CommandSeparator />
          </>
        )}

        {!isLoading && navData.actions.length > 0 && (
          <CommandGroup heading="Actions">{navData.actions.map(renderItem)}</CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
