/**
 * Interactive Contact Terminal
 *
 * Beautiful animated terminal with typing effects, command history, and smart autocomplete
 * Follows shadcn terminal patterns with Motion animations
 *
 * Reuses:
 * - Terminal, TypingAnimation, AnimatedSpan from primitives/display/terminal
 * - Command for smart autocomplete suggestions
 * - Sheet for contact forms
 * - useConfetti for celebrations
 */

'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@/src/components/primitives/display/terminal';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/src/components/primitives/ui/command';
import { Input } from '@/src/components/primitives/ui/input';
import { Label } from '@/src/components/primitives/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/primitives/ui/sheet';
import { Textarea } from '@/src/components/primitives/ui/textarea';
import { useConfetti } from '@/src/hooks/use-confetti';
import { getContactCommands } from '@/src/lib/actions/contact.actions';
import { submitContactForm } from '@/src/lib/actions/contact-form.actions';
import {
  trackTerminalCommandAction,
  trackTerminalFormSubmissionAction,
} from '@/src/lib/actions/pulse.actions';
import { Check, X } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { cn } from '@/src/lib/utils';
import { logUnhandledPromise, normalizeError } from '@/src/lib/utils/error.utils';
import type {
  ConfettiVariant,
  ContactActionType,
  ContactCategory,
} from '@/src/types/database-overrides';

type ContactCommand = {
  id: string;
  text: string;
  description: string | null;
  category: string;
  iconName: string | null;
  actionType: ContactActionType;
  actionValue: string | null;
  confettiVariant: ConfettiVariant | null;
  requiresAuth: boolean;
  aliases: string[];
};

interface OutputLine {
  id: string;
  type: 'command' | 'output' | 'success' | 'error';
  content: string;
  icon?: React.ReactNode;
}

export function ContactTerminal() {
  const router = useRouter();
  const { fireConfetti } = useConfetti();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commands, setCommands] = useState<ContactCommand[]>([]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory>(
    'general' as ContactCategory
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Define addOutput first (no dependencies)
  const addOutput = useCallback(
    (type: OutputLine['type'], content: string, icon?: React.ReactNode) => {
      setOutput((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          type,
          content,
          icon,
        },
      ]);
    },
    []
  );

  // Define loadCommands with addOutput as dependency
  const loadCommands = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getContactCommands({});
      if (result?.data && Array.isArray(result.data.commands)) {
        setCommands(result.data.commands as ContactCommand[]);
        if (result.data.commands.length === 0) {
          setLoadError('No commands available');
          addOutput('error', 'No commands available');
        } else {
          setLoadError(null);
        }
      } else {
        throw new Error('Invalid commands response');
      }
      if (result?.serverError) {
        // Error already logged by safe-action middleware
        logger.error('Failed to load terminal commands', new Error(result.serverError), {
          component: 'ContactTerminal',
          action: 'loadCommands',
        });
        setLoadError('Failed to load commands. Please refresh the page.');
        addOutput('error', 'Failed to load commands. Please refresh the page.');
      }
    } catch (error) {
      logger.error('Failed to load terminal commands', error as Error, {
        component: 'ContactTerminal',
        action: 'loadCommands',
      });
      setLoadError('Failed to load commands. Please refresh the page.');
      addOutput('error', 'Failed to load commands. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [addOutput]);

  // Initial load effect
  useEffect(() => {
    setMounted(true);
    loadCommands().catch((error) => {
      logUnhandledPromise('ContactTerminal.loadCommands', error, {
        source: 'initial_load',
      });
    });
    addOutput('output', 'Welcome to Claude Pro Directory Terminal! 👋');
    addOutput('output', 'Type a command or start typing for suggestions...');
  }, [loadCommands, addOutput]);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const findCommand = (commandText: string): ContactCommand | undefined => {
    const normalized = commandText.toLowerCase().trim();
    return commands.find(
      (cmd) =>
        cmd.text.toLowerCase() === normalized ||
        cmd.aliases.some((alias) => alias.toLowerCase() === normalized)
    );
  };

  const executeCommand = async (commandText: string) => {
    const startTime = Date.now();
    const command = findCommand(commandText);

    if (!command) {
      addOutput('error', `Command not found: "${commandText}"`, <X className="h-3 w-3" />);
      addOutput('output', 'Type for suggestions or try: help, report-bug, request-feature');
      trackTerminalCommandAction({
        command_id: 'unknown',
        action_type: 'internal' as ContactActionType, // Default fallback for unknown commands
        success: false,
        error_reason: 'command_not_found',
        execution_time_ms: Date.now() - startTime,
      }).catch(() => {
        // Fire-and-forget tracking
      });
      return;
    }

    try {
      // Show command description
      if (command.description) {
        addOutput('output', command.description);
      }

      // Handle different action types
      switch (command.actionType) {
        case 'internal':
          handleInternalCommand(command);
          break;

        case 'external':
          if (command.actionValue) {
            addOutput('success', `Opening: ${command.actionValue}`, <Check className="h-3 w-3" />);
            window.open(command.actionValue, '_blank', 'noopener,noreferrer');
          }
          break;

        case 'route':
          if (command.actionValue) {
            addOutput(
              'success',
              `Navigating to ${command.actionValue}...`,
              <Check className="h-3 w-3" />
            );
            router.push(command.actionValue);
          }
          break;

        case 'sheet':
          if (command.actionValue) {
            setSelectedCategory(command.actionValue as ContactCategory);
            setIsSheetOpen(true);
            addOutput(
              'success',
              `Opening ${command.actionValue} contact form...`,
              <Check className="h-3 w-3" />
            );
          }
          break;

        case 'easter-egg':
          addOutput('success', command.actionValue || '🎉 You found an easter egg!');
          break;
      }

      // Fire confetti
      if (command.confettiVariant) {
        fireConfetti(command.confettiVariant);
      }

      trackTerminalCommandAction({
        command_id: command.id,
        action_type: command.actionType,
        success: true,
        execution_time_ms: Date.now() - startTime,
      }).catch(() => {
        // Fire-and-forget tracking
      });
    } catch (error) {
      addOutput(
        'error',
        'An error occurred while executing the command.',
        <X className="h-3 w-3" />
      );
      logger.error('Terminal command execution failed', error as Error, { commandId: command.id });
      trackTerminalCommandAction({
        command_id: command.id,
        action_type: command.actionType,
        success: false,
        error_reason: error instanceof Error ? error.message : 'unknown_error',
        execution_time_ms: Date.now() - startTime,
      }).catch(() => {
        // Fire-and-forget tracking
      });
    }
  };

  const handleInternalCommand = (command: ContactCommand) => {
    switch (command.id) {
      case 'help':
        addOutput('output', '📋 Available commands:');
        for (const cmd of commands) {
          addOutput('output', `  ${cmd.text.padEnd(20)} - ${cmd.description || 'No description'}`);
        }
        break;

      case 'clear':
        setOutput([]);
        addOutput('output', 'Terminal cleared. Type for suggestions or enter a command.');
        break;

      default:
        if (command.actionValue) {
          addOutput('output', command.actionValue);
        }
    }
  };

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const commandText = input.trim();
      addOutput('command', `$ ${commandText}`);
      setInput('');
      setShowSuggestions(false);
      executeCommand(commandText).catch((error) => {
        logUnhandledPromise('ContactTerminal.executeCommand', error, {
          command: commandText,
        });
      });
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionSelect = (commandText: string) => {
    setInput(commandText);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    try {
      const result = await submitContactForm({
        name,
        email,
        category: selectedCategory,
        message,
        metadata: { source: 'terminal' } as Record<string, unknown>,
      });

      if (result.success) {
        addOutput(
          'success',
          "✓ Message sent successfully! We'll get back to you soon.",
          <Check className="h-3 w-3" />
        );
        setIsSheetOpen(false);
        fireConfetti('success');
        trackTerminalFormSubmissionAction({
          category: selectedCategory,
          success: true,
        }).catch(() => {
          // Fire-and-forget tracking
        });
        (e.target as HTMLFormElement).reset();
      } else {
        addOutput('error', result.error || 'Failed to send message.', <X className="h-3 w-3" />);
        trackTerminalFormSubmissionAction({
          category: selectedCategory,
          success: false,
          ...(result.error && { error: result.error }),
        }).catch(() => {
          // Fire-and-forget tracking
        });
      }
    } catch (error) {
      addOutput('error', 'An error occurred. Please try again.', <X className="h-3 w-3" />);
      const normalized = normalizeError(error, 'Contact form submission failed');
      logger.error('Contact form submission failed', normalized, {
        component: 'ContactTerminal',
        category: selectedCategory,
        hasName: !!name,
        hasEmail: !!email,
        hasMessage: !!message,
      });
      trackTerminalFormSubmissionAction({
        category: selectedCategory,
        success: false,
        ...(error instanceof Error && { error: error.message }),
      }).catch(() => {
        // Fire-and-forget tracking
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.text.toLowerCase().includes(input.toLowerCase()) ||
      cmd.aliases.some((alias) => alias.toLowerCase().includes(input.toLowerCase())) ||
      cmd.description?.toLowerCase().includes(input.toLowerCase())
  );

  if (!mounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Terminal className="relative flex min-h-[500px] flex-col">
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 text-center"
          >
            <div className="animate-pulse text-primary text-sm">Loading terminal...</div>
            <div className="text-muted-foreground text-xs">Initializing commands</div>
          </motion.div>
        </div>
      </Terminal>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Terminal className="relative flex min-h-[500px] flex-col">
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 text-center"
          >
            <X className="mx-auto h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <div className="font-medium text-destructive text-sm">{loadError}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoadError(null);
                  loadCommands().catch((error) => {
                    logUnhandledPromise('ContactTerminal.loadCommands', error, {
                      source: 'retry_button',
                    });
                  });
                }}
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      </Terminal>
    );
  }

  return (
    <>
      <Terminal className="relative flex min-h-[500px] flex-col">
        {/* Output History */}
        <div className="mb-4 min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence>
            {output.map((line, index) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={cn(
                  'flex items-start gap-2',
                  line.type === 'error' && 'text-destructive',
                  line.type === 'success' && 'text-green-500',
                  line.type === 'command' && 'font-semibold text-primary'
                )}
              >
                {line.icon && <span className="mt-0.5">{line.icon}</span>}
                {line.type === 'command' ? (
                  <TypingAnimation duration={20}>{line.content}</TypingAnimation>
                ) : (
                  <AnimatedSpan delay={index * 30}>{line.content}</AnimatedSpan>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={outputEndRef} />
        </div>

        {/* Input Area with Autocomplete */}
        <div className="relative">
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredCommands.length > 0 && (
            <div className="absolute right-0 bottom-full left-0 mb-2">
              <Command className="rounded-lg border bg-popover shadow-lg">
                <CommandList className="max-h-[200px]">
                  <CommandEmpty>No commands found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    {filteredCommands.slice(0, 5).map((cmd) => (
                      <CommandItem
                        key={cmd.id}
                        value={cmd.text}
                        onSelect={() => handleSuggestionSelect(cmd.text)}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center gap-2">
                          <span className="font-mono text-primary text-xs">$</span>
                          <span className="font-medium text-sm">{cmd.text}</span>
                          {cmd.description && (
                            <span className="ml-auto truncate text-muted-foreground text-xs">
                              {cmd.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}

          {/* Input Prompt */}
          <div className="flex items-center gap-2 border-border border-t pt-4">
            <span className="font-semibold text-primary text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleSubmit}
              placeholder="Type a command or start typing for suggestions..."
              className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-0"
              autoFocus={true}
            />
            {input && <span className="text-muted-foreground/50 text-xs">Press Enter ⏎</span>}
          </div>
        </div>
      </Terminal>

      {/* Contact Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              Contact Us - {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </SheetTitle>
            <SheetDescription>
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                required={true}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required={true}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us more..."
                rows={6}
                required={true}
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
