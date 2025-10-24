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
} from '@/src/components/primitives/command';
import {
  BookmarkCheck,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  FileText,
  Handshake,
  Layers,
  MessageSquare,
  Plus,
  Sparkles,
  Terminal,
  TrendingUp,
  Users,
  Webhook,
} from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
interface NavigationCommandMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NavigationCommandMenu({
  open: controlledOpen,
  onOpenChange,
}: NavigationCommandMenuProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  /**
   * Keyboard shortcut handler
   * Listens for ⌘K (Mac) or Ctrl+K (Windows/Linux)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Toggle open state - handle both controlled and uncontrolled
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

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
          <CommandItem onSelect={() => handleSelect('/agents')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Bot className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Agents</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  AI-powered task automation
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/commands')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Terminal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Commands</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Slash commands library
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/hooks')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Webhook className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Hooks</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Event-driven automation
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/mcp')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Terminal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>MCP</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Model Context Protocol servers
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/rules')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <BookmarkCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Rules</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Project rules and guidelines
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect('/statuslines')}
            className="cursor-pointer group"
          >
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Terminal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Statuslines</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  <span className="inline-flex items-center gap-1">
                    Editor status bar configs
                    <span className={'inline-flex h-1.5 w-1.5 rounded-full bg-accent'} />
                  </span>
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem
            onSelect={() => handleSelect('/collections')}
            className="cursor-pointer group"
          >
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Collections</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  <span className="inline-flex items-center gap-1">
                    Curated content bundles
                    <span className={'inline-flex h-1.5 w-1.5 rounded-full bg-accent'} />
                  </span>
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/guides')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Guides</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Tutorials and how-tos
                </span>
              </div>
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Secondary Navigation Group */}
        <CommandGroup heading="More">
          <CommandItem onSelect={() => handleSelect('/for-you')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>For You</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Personalized recommendations
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/trending')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Trending</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Popular configurations
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/board')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Board</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Community board
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/companies')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Companies</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Browse companies
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/changelog')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Changelog</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Latest updates
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/jobs')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Jobs</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Find opportunities
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/community')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Community</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Join the community
                </span>
              </div>
            </span>
          </CommandItem>

          <CommandItem onSelect={() => handleSelect('/partner')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Handshake className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Partner</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Partner program
                </span>
              </div>
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Actions Group */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect('/submit')} className="cursor-pointer group">
            <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Submit Config</span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                  Share your configurations
                </span>
              </div>
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
