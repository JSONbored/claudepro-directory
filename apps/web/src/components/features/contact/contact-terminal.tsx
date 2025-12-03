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

import type { Database } from '@heyclaude/database-types';
import {
  getContactCommands,
  submitContactForm,
  trackTerminalCommandAction,
  trackTerminalFormSubmissionAction,
} from '@heyclaude/web-runtime/actions';
import { logger, logUnhandledPromise, normalizeError } from '@heyclaude/web-runtime/core';
import {
  animate,
  bgColor,
  border,
  borderTop,
  cluster,
  cursor,
  display,
  flexDir,
  flexGrow,
  gap,
  helper,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginLeft,
  marginTop,
  marginX,
  minHeight,
  muted,
  overflow,
  paddingTop,
  position,
  radius,
  row,
  shadow,
  size,
  spaceY,
  textAlign,
  textColor,
  outline,
  focusRing,
  truncate,
  weight,
  width,
  absolute,
  maxHeight,
} from '@heyclaude/web-runtime/design-system';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Check, X } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { Label } from '@heyclaude/web-runtime/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@heyclaude/web-runtime/ui';
import { Textarea } from '@heyclaude/web-runtime/ui';
import { useConfetti } from '@heyclaude/web-runtime/hooks';

// Internal type with non-nullable fields (after transformation)
type ContactCommand = {
  id: string;
  text: string;
  description: string | null;
  category: string;
  icon_name: Database['public']['Enums']['contact_command_icon'] | null;
  action_type: Database['public']['Enums']['contact_action_type'];
  action_value: string | null;
  confetti_variant: Database['public']['Enums']['confetti_variant'] | null;
  requires_auth: boolean;
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
  const [selectedCategory, setSelectedCategory] = useState<
    Database['public']['Enums']['contact_category']
  >('general' as Database['public']['Enums']['contact_category']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
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
      setIsLoading(true);
      await runLoggedAsync(
        async () => {
          const result = await getContactCommands({});
          if (result?.data?.commands && Array.isArray(result.data.commands)) {
            // RPC returns commands with snake_case fields - use directly
            const transformedCommands: ContactCommand[] = result.data.commands.map((cmd) => ({
              id: cmd.id ?? '',
              text: cmd.text ?? '',
              description: cmd.description,
              category: cmd.category ?? '',
              icon_name: cmd.icon_name,
              action_type:
                cmd.action_type ??
                ('internal' as Database['public']['Enums']['contact_action_type']),
              action_value: cmd.action_value,
              confetti_variant: cmd.confetti_variant,
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
    } catch (error) {
      // Error already logged by useLoggedAsync
      setLoadError('Failed to load commands. Please refresh the page.');
      addOutput('error', 'Failed to load commands. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }, [addOutput, runLoggedAsync]);

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
      addOutput('error', `Command not found: "${commandText}"`, <X className={iconSize.xs} />);
      addOutput('output', 'Type for suggestions or try: help, report-bug, request-feature');
      trackTerminalCommandAction({
        command_id: 'unknown',
        action_type: 'internal' as Database['public']['Enums']['contact_action_type'], // Default fallback for unknown commands
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
        case 'internal':
          handleInternalCommand(command);
          break;

        case 'external':
          if (command.action_value) {
            addOutput('success', `Opening: ${command.action_value}`, <Check className={iconSize.xs} />);
            window.open(command.action_value, '_blank', 'noopener,noreferrer');
          }
          break;

        case 'route':
          if (command.action_value) {
            addOutput(
              'success',
              `Navigating to ${command.action_value}...`,
              <Check className={iconSize.xs} />
            );
            router.push(command.action_value);
          }
          break;

        case 'sheet':
          if (command.action_value) {
            setSelectedCategory(
              command.action_value as Database['public']['Enums']['contact_category']
            );
            setIsSheetOpen(true);
            addOutput(
              'success',
              `Opening ${command.action_value} contact form...`,
              <Check className={iconSize.xs} />
            );
          }
          break;

        case 'easter-egg':
          addOutput('success', command.action_value || '🎉 You found an easter egg!');
          break;
      }

      // Fire confetti
      if (command.confetti_variant) {
        fireConfetti(command.confetti_variant);
      }

      trackTerminalCommandAction({
        command_id: command.id ?? '',
        action_type: command.action_type ?? 'internal',
        success: true,
        execution_time_ms: Date.now() - startTime,
      }).catch(() => {
        // Fire-and-forget tracking
      });
    } catch (error) {
      addOutput(
        'error',
        'An error occurred while executing the command.',
        <X className={iconSize.xs} />
      );
      const normalized = normalizeError(error, 'Terminal command execution failed');
      logger.error('Terminal command execution failed', normalized, {
        commandId: command.id ?? 'unknown',
      });
      trackTerminalCommandAction({
        command_id: command.id ?? '',
        action_type: command.action_type ?? 'internal',
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
      case 'help':
        addOutput('output', '📋 Available commands:');
        for (const cmd of commands) {
          addOutput(
            'output',
            `  ${cmd.text?.padEnd(20) ?? ''} - ${cmd.description || 'No description'}`
          );
        }
        break;

      case 'clear':
        setOutput([]);
        addOutput('output', 'Terminal cleared. Type for suggestions or enter a command.');
        break;

      default:
        if (command.action_value) {
          addOutput('output', command.action_value);
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
      await runLoggedAsync(
        async () => {
          const result = await submitContactForm({
            name,
            email,
            category: selectedCategory,
            message,
            metadata: { source: 'terminal' } as Record<string, unknown>,
          });

          if (result?.data?.success) {
            addOutput(
              'success',
              "✓ Message sent successfully! We'll get back to you soon.",
              <Check className={iconSize.xs} />
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
        <X className={iconSize.xs} />
      );
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
      <Terminal className={`${position.relative} ${display.flex} ${minHeight.terminal} ${flexDir.col}`}>
        <div className={`${display.flex} ${flexGrow['1']} ${alignItems.center} ${justify.center}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${spaceY.compact} ${textAlign.center}`}
          >
            <div className={`${animate.pulse} ${textColor.primary} ${size.sm}`}>Loading terminal...</div>
            <div className={`${muted.default} ${size.xs}`}>Initializing commands</div>
          </motion.div>
        </div>
      </Terminal>
    );
  }

  // Error state
  if (loadError) {
    return (
      <Terminal className={`${position.relative} ${display.flex} ${minHeight.terminal} ${flexDir.col}`}>
        <div className={`${display.flex} ${flexGrow['1']} ${alignItems.center} ${justify.center}`}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${spaceY.comfortable} ${textAlign.center}`}
          >
            <X className={`${marginX.auto} ${iconSize.xl} ${textColor.destructive}`} />
            <div className={spaceY.compact}>
              <div className={`${weight.medium} ${helper.destructive}`}>{loadError}</div>
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
      <Terminal className={`${position.relative} ${display.flex} ${minHeight.terminal} ${flexDir.col}`}>
        {/* Output History */}
        <div className={`${marginBottom.default} ${minHeight[0]} ${flexGrow['1']} ${overflow.yAuto}`}>
          <AnimatePresence>
            {output.map((line, index) => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={cn(
                  `${row.compact}`,
                  line.type === 'error' && textColor.destructive,
                  line.type === 'success' && textColor.green,
                  line.type === 'command' && `${weight.semibold} ${textColor.primary}`
                )}
              >
                {line.icon && <span className={marginTop.micro}>{line.icon}</span>}
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
        <div className={position.relative}>
          {/* Suggestions Dropdown */}
          {showSuggestions && filteredCommands.length > 0 && (
            <div className={`${absolute.bottomFull} ${marginBottom.tight}`}>
              <Command className={`${radius.lg} ${border.default} ${bgColor.popover} ${shadow.lg}`}>
                <CommandList className={maxHeight.dropdown}>
                  <CommandEmpty>No commands found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    {filteredCommands.slice(0, 5).map((cmd) => (
                      <CommandItem
                        key={cmd.id}
                        value={cmd.text}
                        onSelect={() => handleSuggestionSelect(cmd.text)}
                        className={cursor.pointer}
                      >
                        <div className={`${display.flex} ${width.full} ${alignItems.center} ${gap.compact}`}>
                          <span className={`font-mono ${textColor.primary} ${size.xs}`}>$</span>
                          <span className={`${weight.medium} ${size.sm}`}>{cmd.text}</span>
                          {cmd.description && (
                            <span className={`${marginLeft.auto} ${truncate.single} ${muted.default} ${size.xs}`}>
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
          <div className={`${cluster.compact} ${borderTop.default} ${paddingTop.comfortable}`}>
            <span className={`${weight.semibold} ${textColor.primary} ${size.sm}`}>$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleSubmit}
              placeholder="Type a command or start typing for suggestions..."
              className={`${flexGrow['1']} ${border.none} ${bgColor.transparent} ${size.sm} ${outline.none} placeholder:${muted.opacity50} ${focusRing.none}`}
              autoFocus={true}
            />
            {input && <span className={`${muted.opacity50} ${size.xs}`}>Press Enter ⏎</span>}
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

          <form onSubmit={handleFormSubmit} className={`${marginTop.comfortable} ${spaceY.comfortable}`}>
            <div className={spaceY.compact}>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                required={true}
                disabled={isSubmitting}
              />
            </div>

            <div className={spaceY.compact}>
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

            <div className={spaceY.compact}>
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

            <div className={`${display.flex} ${justify.end} ${gap.compact}`}>
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
