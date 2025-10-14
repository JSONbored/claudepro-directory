'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/src/components/ui/command';

/**
 * NavigationCommandMenu Component
 *
 * Global command palette (⌘K / Ctrl+K) for quick navigation across the entire site.
 * Provides keyboard-first navigation to all major sections and pages.
 *
 * Features:
 * - Keyboard shortcut (⌘K on Mac, Ctrl+K on Windows/Linux)
 * - Searchable navigation
 * - Grouped by section (Primary, More, Actions)
 * - Instant navigation on selection
 * - Accessible (WCAG 2.1 AA)
 * - Performance optimized (lazy loaded)
 *
 * @example
 * ```tsx
 * <NavigationCommandMenu />
 * ```
 *
 * Usage: Include once in layout component (automatically handled via keyboard shortcut)
 *
 * @see Research Report: "shadcn Menu Components for Navigation"
 */
export function NavigationCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  /**
   * Keyboard shortcut handler
   * Listens for ⌘K (Mac) or Ctrl+K (Windows/Linux)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prevOpen) => !prevOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Handle navigation selection
   * Closes menu and navigates to selected path
   */
  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search navigation... (try typing 'agents' or 'guides')" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Primary Navigation Group */}
        <CommandGroup heading="Primary Navigation">
          <CommandItem onSelect={() => handleSelect('/agents')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">🤖</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Agents</span>
                <span className="text-xs text-muted-foreground">AI-powered task automation</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/commands')} className="cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <div className="flex flex-col items-start">
                <span>Commands</span>
                <span className="text-xs text-muted-foreground">Slash commands library</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/hooks')} className="cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="text-sm">🪝</span>
              <div className="flex flex-col items-start">
                <span>Hooks</span>
                <span className="text-xs text-muted-foreground">Event-driven automation</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/mcp')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">🔌</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>MCP</span>
                <span className="text-xs text-muted-foreground">
                  Model Context Protocol servers
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/rules')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">📋</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Rules</span>
                <span className="text-xs text-muted-foreground">Project rules and guidelines</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/statuslines')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">💻</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Statuslines</span>
                <span className="text-xs text-muted-foreground">
                  <span className={UI_CLASSES.INLINE_FLEX_ITEMS_CENTER_GAP_1}>
                    Editor status bar configs
                    <span className={`${UI_CLASSES.INLINE_FLEX} h-1.5 w-1.5 rounded-full bg-accent`} />
                  </span>
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/collections')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">📚</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Collections</span>
                <span className="text-xs text-muted-foreground">
                  <span className={UI_CLASSES.INLINE_FLEX_ITEMS_CENTER_GAP_1}>
                    Curated content bundles
                    <span className={`${UI_CLASSES.INLINE_FLEX} h-1.5 w-1.5 rounded-full bg-accent`} />
                  </span>
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/guides')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">📖</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Guides</span>
                <span className="text-xs text-muted-foreground">Tutorials and how-tos</span>
              </div>
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Secondary Navigation Group */}
        <CommandGroup heading="More">
          <CommandItem onSelect={() => handleSelect('/for-you')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">✨</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>For You</span>
                <span className="text-xs text-muted-foreground">Personalized recommendations</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/trending')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">📈</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Trending</span>
                <span className="text-xs text-muted-foreground">Popular configurations</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/board')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">💬</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Board</span>
                <span className="text-xs text-muted-foreground">Community board</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/companies')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">🏢</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Companies</span>
                <span className="text-xs text-muted-foreground">Browse companies</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/changelog')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">📝</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Changelog</span>
                <span className="text-xs text-muted-foreground">Latest updates</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/jobs')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">💼</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Jobs</span>
                <span className="text-xs text-muted-foreground">Find opportunities</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/community')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">👥</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Community</span>
                <span className="text-xs text-muted-foreground">Join the community</span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/partner')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">🤝</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Partner</span>
                <span className="text-xs text-muted-foreground">Partner program</span>
              </div>
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Actions Group */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect('/submit')} className="cursor-pointer">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-sm">➕</span>
              <div className={UI_CLASSES.FLEX_COL_ITEMS_START}>
                <span>Submit Config</span>
                <span className="text-xs text-muted-foreground">Share your configurations</span>
              </div>
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
