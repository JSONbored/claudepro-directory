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

import {
  contact_action_type as ContactActionType,
  contact_command_icon,
  type contact_action_type,
  type contact_category,
  type confetti_variant,
} from '@heyclaude/web-runtime/types/client-safe-enums';
import { getContactCommands } from '@heyclaude/web-runtime/actions/contact';
import { submitContactForm } from '@heyclaude/web-runtime/actions/submit-contact-form';
import {
  trackTerminalCommandAction,
  trackTerminalFormSubmissionAction,
} from '@heyclaude/web-runtime/actions/pulse';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { logUnhandledPromise } from '@heyclaude/web-runtime/errors';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { useConfetti } from '@heyclaude/web-runtime/hooks/use-confetti';
import { Check, X } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  cn,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@heyclaude/web-runtime/ui';
import { Terminal, AnimatedSpan, TypingAnimation } from '@/src/components/ui/terminal';
import { STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

// Internal type with non-nullable fields (after transformation)
interface ContactCommand {
  action_type: contact_action_type;
  action_value: null | string;
  aliases: string[];
  category: string;
  confetti_variant: confetti_variant | null;
  description: null | string;
  icon_name: contact_command_icon | null;
  id: string;
  requires_auth: boolean;
  text: string;
}

interface OutputLine {
  content: string;
  icon?: React.ReactNode;
  id: string;
  type: 'command' | 'error' | 'output' | 'success';
}

export function ContactTerminal() {
  const router = useRouter();
  const { fireConfetti } = useConfetti();
  const { value: mounted, setTrue: setMountedTrue } = useBoolean();
  const {
    value: isLoading,
    setTrue: setIsLoadingTrue,
    setFalse: setIsLoadingFalse,
  } = useBoolean(true);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [commands, setCommands] = useState<ContactCommand[]>([]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<OutputLine[]>([]);
  const {
    value: showSuggestions,
    setFalse: setShowSuggestionsFalse,
    setValue: setShowSuggestions,
  } = useBoolean();
  const {
    value: isSheetOpen,
    setTrue: setIsSheetOpenTrue,
    setFalse: setIsSheetOpenFalse,
    setValue: setIsSheetOpenValue,
  } = useBoolean();
  const [selectedCategory, setSelectedCategory] = useState<contact_category>(
    'general' as contact_category
  );
  const {
    value: isSubmitting,
    setTrue: setIsSubmittingTrue,
    setFalse: setIsSubmittingFalse,
  } = useBoolean();
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const runLoggedAsync = useLoggedAsync({
    scope: 'ContactTerminal',
    defaultMessage: 'Contact terminal operation failed',
    defaultRethrow: false,
  });

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
      setIsLoadingTrue();
      await runLoggedAsync(
        async () => {
          const result = await getContactCommands({});
          if (result?.data?.commands && Array.isArray(result.data.commands)) {
            // Service returns commands array directly (migrated from RPC)
            // Type assertion needed because safe-action infers generic types
            // Convert through unknown first to avoid type overlap issues
            const commandsArray = result.data.commands as unknown as Array<{
              id: string | null;
              text: string | null;
              description: string | null;
              category: string | null;
              icon_name: string | null;
              action_type: string | null;
              action_value: string | null;
              confetti_variant: string | null;
              requires_auth: boolean | null;
              aliases: string[] | null;
            }>;
            const transformedCommands: ContactCommand[] = commandsArray.map((cmd) => ({
              id: cmd.id ?? '',
              text: cmd.text ?? '',
              description: cmd.description ?? null,
              category: cmd.category ?? '',
              icon_name: (cmd.icon_name as contact_command_icon) ?? null,
              action_type: (cmd.action_type as contact_action_type) ?? ContactActionType.internal,
              action_value: cmd.action_value ?? null,
              confetti_variant: (cmd.confetti_variant as confetti_variant) ?? null,
              requires_auth: cmd.requires_auth ?? false,
              aliases: cmd.aliases ?? [],
            }));
            setCommands(transformedCommands);
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
            throw new Error(result.serverError);
          }
        },
        {
          message: 'Failed to load terminal commands',
          context: { component: 'ContactTerminal', action: 'loadCommands' },
          level: 'warn',
        }
      );
    } catch {
      // Error already logged by useLoggedAsync
      setLoadError('Failed to load commands. Please refresh the page.');
      addOutput('error', 'Failed to load commands. Please refresh the page.');
    } finally {
      setIsLoadingFalse();
    }
  }, [addOutput, runLoggedAsync]);

  // Initial load effect
  useEffect(() => {
    setMountedTrue();
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
        action_type: ContactActionType.internal, // Default fallback for unknown commands
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
      switch (command.action_type) {
        case 'internal': {
          handleInternalCommand(command);
          break;
        }

        case 'external': {
          if (command.action_value) {
            addOutput('success', `Opening: ${command.action_value}`, <Check className="h-3 w-3" />);
            window.open(command.action_value, '_blank', 'noopener,noreferrer');
          }
          break;
        }

        case 'route': {
          if (command.action_value) {
            addOutput(
              'success',
              `Navigating to ${command.action_value}...`,
              <Check className="h-3 w-3" />
            );
            router.push(command.action_value);
          }
          break;
        }

        case 'sheet': {
          if (command.action_value) {
            setSelectedCategory(command.action_value as contact_category);
            setIsSheetOpenTrue();
            addOutput(
              'success',
              `Opening ${command.action_value} contact form...`,
              <Check className="h-3 w-3" />
            );
          }
          break;
        }

        case 'easter-egg': {
          addOutput('success', command.action_value || '🎉 You found an easter egg!');
          break;
        }
      }

      // Fire confetti (if enabled)
      if (command.confetti_variant) {
        const confettiEnabled = checkConfettiEnabled();
        if (confettiEnabled) {
          fireConfetti(command.confetti_variant);
        }
      }

      // Validate and ensure proper type
      const actionType = (command.action_type ?? ContactActionType.internal) as contact_action_type;
      trackTerminalCommandAction({
        command_id: command.id ?? '',
        action_type: actionType,
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
      const normalized = normalizeError(error, 'Terminal command execution failed');
      logClientError(
        '[Contact] Terminal command execution failed',
        normalized,
        'ContactTerminal.executeCommand',
        {
          component: 'ContactTerminal',
          action: 'execute-command',
          category: 'contact',
          commandId: command.id ?? 'unknown',
        }
      );
      // Validate and ensure proper type
      const actionType = (command.action_type ?? ContactActionType.internal) as contact_action_type;
      trackTerminalCommandAction({
        command_id: command.id ?? '',
        action_type: actionType,
        success: false,
        error_reason: normalized.message,
        execution_time_ms: Date.now() - startTime,
      }).catch(() => {
        // Fire-and-forget tracking
      });
    }
  };

  const handleInternalCommand = (command: ContactCommand) => {
    switch (command.id) {
      case 'help': {
        addOutput('output', '📋 Available commands:');
        for (const cmd of commands) {
          addOutput(
            'output',
            `  ${cmd.text?.padEnd(20) ?? ''} - ${cmd.description || 'No description'}`
          );
        }
        break;
      }

      case 'clear': {
        setOutput([]);
        addOutput('output', 'Terminal cleared. Type for suggestions or enter a command.');
        break;
      }

      default: {
        if (command.action_value) {
          addOutput('output', command.action_value);
        }
      }
    }
  };

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const commandText = input.trim();
      addOutput('command', `$ ${commandText}`);
      setInput('');
      setShowSuggestionsFalse();
      executeCommand(commandText).catch((error) => {
        logUnhandledPromise('ContactTerminal.executeCommand', error, {
          command: commandText,
        });
      });
    } else if (e.key === 'Escape') {
      setShowSuggestionsFalse();
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
    setIsSubmittingTrue();

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    try {
      await runLoggedAsync(
        async () => {
          const result = await submitContactForm({
            name,
            email,
            category: selectedCategory,
            message,
            metadata: { source: 'terminal' } as Record<string, unknown>,
          });

          // submitContactForm returns InsertContactSubmissionReturns (array), check if result exists
          if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
            addOutput(
              'success',
              "✓ Message sent successfully! We'll get back to you soon.",
              <Check className="h-3 w-3" />
            );
            setIsSheetOpenFalse();
            // Fire confetti (if enabled)
            const confettiEnabled = checkConfettiEnabled();
            if (confettiEnabled) {
              fireConfetti('success');
            }
            trackTerminalFormSubmissionAction({
              category: selectedCategory,
              success: true,
            }).catch(() => {
              // Fire-and-forget tracking
            });
            (e.target as HTMLFormElement).reset();
          } else {
            const error = result?.serverError || 'Failed to send message.';
            throw new Error(error);
          }
        },
        {
          message: 'Contact form submission failed',
          context: {
            component: 'ContactTerminal',
            category: selectedCategory,
            hasName: !!name,
            hasEmail: !!email,
            hasMessage: !!message,
          },
        }
      );
    } catch (error) {
      // Error already logged by useLoggedAsync
      addOutput(
        'error',
        normalizeError(error, 'An error occurred. Please try again.').message,
        <X className="h-3 w-3" />
      );
      trackTerminalFormSubmissionAction({
        category: selectedCategory,
        success: false,
        ...(error instanceof Error && { error: error.message }),
      }).catch(() => {
        // Fire-and-forget tracking
      });
    } finally {
      setIsSubmittingFalse();
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
      <Terminal className="relative flex min-h-[500px] flex-col" wrapInPreCode={false}>
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 text-center"
          >
            <div className="text-primary animate-pulse text-sm">Loading terminal...</div>
            <div className="text-muted-foreground text-xs">Initializing commands</div>
          </motion.div>
        </div>
      </Terminal>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Terminal className="relative flex min-h-[500px] flex-col" wrapInPreCode={false}>
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <X className="text-destructive mx-auto h-8 w-8" />
            <div className="space-y-2">
              <div className="text-destructive text-sm-medium">{loadError}</div>
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
      <Terminal className="relative flex min-h-[500px] flex-col" wrapInPreCode={false}>
        {/* Output History */}
        <div className="mb-4 min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence>
            {output.map((line, index) => (
              <motion.div
                key={line.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ duration: DURATION.quick, delay: index * STAGGER.micro }} // Using micro for 30ms
                className={cn(
                  'flex items-start gap-2',
                  line.type === 'error' && 'text-destructive',
                  line.type === 'success' && 'text-green-500',
                  line.type === 'command' && 'text-primary font-semibold'
                )}
              >
                {line.icon ? <span className="mt-[18px]">{line.icon}</span> : null}
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
          {showSuggestions && filteredCommands.length > 0 ? (
            <div className="absolute right-0 bottom-full left-0 mb-2">
              <Command className="bg-popover card-base shadow-lg">
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
                        <div className="flex w-full items-center gap-1">
                          <span className="text-primary font-mono text-xs">$</span>
                          <span className="text-sm-medium">{cmd.text}</span>
                          {cmd.description ? (
                            <span className="text-muted-foreground ml-auto truncate text-xs">
                              {cmd.description}
                            </span>
                          ) : null}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          ) : null}

          {/* Input Prompt */}
          <div className="border-border flex items-center gap-1 border-t pt-4">
            <span className="text-primary text-sm font-semibold">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleSubmit}
              placeholder="Type a command or start typing for suggestions..."
              className="placeholder:text-muted-foreground/50 flex-1 border-none bg-transparent text-sm outline-none focus:ring-0"
              autoFocus
            />
            {input ? <span className="text-muted-foreground/50 text-xs">Press Enter ⏎</span> : null}
          </div>
        </div>
      </Terminal>

      {/* Contact Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpenValue}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              Contact Us - {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </SheetTitle>
            <SheetDescription>
              Fill out the form below and we&apos;ll get back to you as soon as possible.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                required
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
                required
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
                required
                disabled={isSubmitting}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="outline"
                onClick={setIsSheetOpenFalse}
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
