'use client';

/**
 * Type Selection Cards - Animated Submission Type Picker
 *
 * Displays submission types as animated, interactive cards.
 * Supports hover effects, selection states, and category-specific styling.
 *
 * Features:
 * - Animated card grid with stagger effects
 * - Category-specific colors and icons
 * - Hover effects with scale and glow
 * - Selection state with visual feedback
 * - Responsive grid layout
 * - Keyboard navigation support
 */

import { Bot, Brain, Code, FileCode, Sparkles, Terminal, Zap } from '@heyclaude/web-runtime/icons';
import { type SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/design-tokens';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';

interface TypeCard {
  color: string;
  description: string;
  examples: string[];
  icon: typeof Bot;
  label: string;
  type: SubmissionContentType;
}

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'agents',
    label: 'Agent',
    description: 'Claude system prompts and AI agents',
    icon: Bot,
    color: TOKENS.colors.category.agents,
    examples: ['React Expert', 'Code Reviewer', 'Writing Assistant'],
  },
  {
    type: 'mcp',
    label: 'MCP Server',
    description: 'Model Context Protocol integrations',
    icon: Zap,
    color: TOKENS.colors.category.mcp,
    examples: ['Supabase MCP', 'GitHub MCP', 'File System'],
  },
  {
    type: 'rules',
    label: 'Rule',
    description: 'Expertise rules and specialized knowledge',
    icon: Brain,
    color: TOKENS.colors.category.rules,
    examples: ['TypeScript Best Practices', 'Accessibility Guide'],
  },
  {
    type: 'commands',
    label: 'Command',
    description: 'Shell commands and automation scripts',
    icon: Terminal,
    color: TOKENS.colors.category.commands,
    examples: ['Git aliases', 'Build scripts', 'Deploy commands'],
  },
  {
    type: 'hooks',
    label: 'Hook',
    description: 'React hooks and reusable logic',
    icon: Code,
    color: TOKENS.colors.category.hooks,
    examples: ['useDebounce', 'useLocalStorage', 'useFetch'],
  },
  {
    type: 'statuslines',
    label: 'Statusline',
    description: 'Terminal status line configurations',
    icon: FileCode,
    color: TOKENS.colors.category.statuslines,
    examples: ['Starship config', 'Oh My Zsh theme'],
  },
  {
    type: 'skills',
    label: 'Skill',
    description: 'Claude skills and capabilities',
    icon: Sparkles,
    color: TOKENS.colors.category.skills,
    examples: ['API design', 'Database optimization'],
  },
];

interface TypeSelectionCardsProps {
  className?: string;
  onSelect: (type: SubmissionContentType) => void;
  selected?: SubmissionContentType;
}

export function TypeSelectionCards({ selected, onSelect, className }: TypeSelectionCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<null | SubmissionContentType>(null);

  const handleSelect = useCallback(
    (type: SubmissionContentType) => {
      onSelect(type);
    },
    [onSelect]
  );

  return (
    <div className={cn('w-full', className)}>
      {/* Grid of Type Cards */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
      >
        {TYPE_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = selected === card.type;
          const isHovered = hoveredCard === card.type;

          return (
            <motion.button
              key={card.type}
              type="button"
              onClick={() => handleSelect(card.type)}
              onMouseEnter={() => setHoveredCard(card.type)}
              onMouseLeave={() => setHoveredCard(null)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{
                ...MICROINTERACTIONS.card.hover,
                scale: 1.03, // Preserve exact original scale (design token is 1.02, but original was 1.03)
                y: 0, // Preserve original (no y movement in original)
              }}
              whileTap={MICROINTERACTIONS.card.tap}
              transition={MICROINTERACTIONS.card.transition}
              className={cn(
                'group relative overflow-hidden rounded-xl border-2 p-6 text-left',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border bg-background-secondary hover:border-accent-primary/50'
              )}
              style={{
                borderColor: isSelected
                  ? TOKENS.colors.accent.primary
                  : isHovered
                    ? `${TOKENS.colors.accent.primary}80`
                    : TOKENS.colors.border.default,
                backgroundColor: isSelected
                  ? `${TOKENS.colors.accent.primary}1a`
                  : TOKENS.colors.background.secondary,
                boxShadow: isSelected
                  ? TOKENS.shadows.glow.orange
                  : isHovered
                    ? TOKENS.shadows.md
                    : 'none',
              }}
            >
              {/* Background Gradient Overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${card.color}10, transparent)`,
                }}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon and Badge */}
                <div className="mb-4 flex items-start justify-between">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${card.color}20`,
                    }}
                    animate={{
                      scale: isHovered ? 1.1 : 1,
                      rotate: isHovered ? 5 : 0,
                    }}
                    transition={TOKENS.animations.spring.bouncy}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{
                        color: card.color,
                      }}
                    />
                  </motion.div>

                  {/* Selection Indicator */}
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={TOKENS.animations.spring.bouncy}
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: TOKENS.colors.accent.primary,
                        boxShadow: TOKENS.shadows.glow.orange,
                      }}
                    >
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  ) : null}
                </div>

                {/* Label */}
                <h3
                  className={cn(
                    'mb-2 text-lg font-semibold transition-colors',
                    isSelected
                      ? 'text-accent-primary'
                      : 'text-foreground group-hover:text-accent-primary'
                  )}
                  style={{
                    color: isSelected ? TOKENS.colors.accent.primary : undefined,
                  }}
                >
                  {card.label}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                  {card.description}
                </p>

                {/* Examples */}
                <div className="space-y-1.5">
                  {card.examples.slice(0, 2).map((example, index) => (
                    <motion.div
                      key={example}
                      className="flex items-center gap-2 text-xs"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: isHovered || isSelected ? 1 : 0.6,
                        x: 0,
                      }}
                      transition={{
                        delay: 0.1 + index * 0.05,
                        duration: 0.2,
                      }}
                    >
                      <div
                        className="h-1 w-1 rounded-full"
                        style={{
                          backgroundColor: card.color,
                        }}
                      />
                      <span className="text-muted-foreground">{example}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Hover Border Animation */}
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-xl border-2"
                style={{
                  borderColor: card.color,
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isHovered ? 0.3 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className="text-muted-foreground mt-6 text-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Select the type that best matches your submission
      </motion.p>
    </div>
  );
}

/**
 * Compact Type Selection (Dropdown Alternative)
 * Useful for mobile or space-constrained layouts
 */
export function CompactTypeSelection({ selected, onSelect, className }: TypeSelectionCardsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="grid gap-2">
        {TYPE_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = selected === card.type;

          return (
            <motion.button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                isSelected
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border bg-background-secondary hover:border-accent-primary/50'
              )}
              style={{
                borderColor: isSelected
                  ? TOKENS.colors.accent.primary
                  : TOKENS.colors.border.default,
                backgroundColor: isSelected
                  ? `${TOKENS.colors.accent.primary}1a`
                  : TOKENS.colors.background.secondary,
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${card.color}20`,
                }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{
                    color: card.color,
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{card.label}</div>
                <div className="text-muted-foreground truncate text-xs">{card.description}</div>
              </div>

              {isSelected ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: TOKENS.colors.accent.primary }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
