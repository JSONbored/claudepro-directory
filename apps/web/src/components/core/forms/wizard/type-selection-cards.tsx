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
import { MICROINTERACTIONS, SPRING, STAGGER, DURATION, gap, marginBottom, spaceY, marginTop, radius, iconSize } from '@heyclaude/web-runtime/design-system';
// TOKENS removed - using direct Tailwind utilities and CSS custom properties
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';

interface TypeCard {
  description: string;
  examples: string[];
  icon: typeof Bot;
  label: string;
  type: SubmissionContentType;
  // Tailwind utility classes - NO CSS variables, NO inline styles
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  bgColorClass20: string; // 20% opacity background
  gradientFromClass: string; // 10% opacity for gradients
}

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'agents',
    label: 'Agent',
    description: 'Claude system prompts and AI agents',
    icon: Bot,
    colorClass: 'text-color-category-agents-submission',
    bgColorClass: 'bg-color-category-agents-submission',
    borderColorClass: 'border-color-category-agents-submission',
    bgColorClass20: 'bg-color-category-agents-submission/20',
    gradientFromClass: 'from-color-category-agents-submission/10',
    examples: ['React Expert', 'Code Reviewer', 'Writing Assistant'],
  },
  {
    type: 'mcp',
    label: 'MCP Server',
    description: 'Model Context Protocol integrations',
    icon: Zap,
    colorClass: 'text-color-category-mcp-submission',
    bgColorClass: 'bg-color-category-mcp-submission',
    borderColorClass: 'border-color-category-mcp-submission',
    bgColorClass20: 'bg-color-category-mcp-submission/20',
    gradientFromClass: 'from-color-category-mcp-submission/10',
    examples: ['Supabase MCP', 'GitHub MCP', 'File System'],
  },
  {
    type: 'rules',
    label: 'Rule',
    description: 'Expertise rules and specialized knowledge',
    icon: Brain,
    colorClass: 'text-color-category-rules-submission',
    bgColorClass: 'bg-color-category-rules-submission',
    borderColorClass: 'border-color-category-rules-submission',
    bgColorClass20: 'bg-color-category-rules-submission/20',
    gradientFromClass: 'from-color-category-rules-submission/10',
    examples: ['TypeScript Best Practices', 'Accessibility Guide'],
  },
  {
    type: 'commands',
    label: 'Command',
    description: 'Shell commands and automation scripts',
    icon: Terminal,
    colorClass: 'text-color-category-commands-submission',
    bgColorClass: 'bg-color-category-commands-submission',
    borderColorClass: 'border-color-category-commands-submission',
    bgColorClass20: 'bg-color-category-commands-submission/20',
    gradientFromClass: 'from-color-category-commands-submission/10',
    examples: ['Git aliases', 'Build scripts', 'Deploy commands'],
  },
  {
    type: 'hooks',
    label: 'Hook',
    description: 'React hooks and reusable logic',
    icon: Code,
    colorClass: 'text-color-category-hooks-submission',
    bgColorClass: 'bg-color-category-hooks-submission',
    borderColorClass: 'border-color-category-hooks-submission',
    bgColorClass20: 'bg-color-category-hooks-submission/20',
    gradientFromClass: 'from-color-category-hooks-submission/10',
    examples: ['useDebounce', 'useLocalStorage', 'useFetch'],
  },
  {
    type: 'statuslines',
    label: 'Statusline',
    description: 'Terminal status line configurations',
    icon: FileCode,
    colorClass: 'text-color-category-statuslines-submission',
    bgColorClass: 'bg-color-category-statuslines-submission',
    borderColorClass: 'border-color-category-statuslines-submission',
    bgColorClass20: 'bg-color-category-statuslines-submission/20',
    gradientFromClass: 'from-color-category-statuslines-submission/10',
    examples: ['Starship config', 'Oh My Zsh theme'],
  },
  {
    type: 'skills',
    label: 'Skill',
    description: 'Claude skills and capabilities',
    icon: Sparkles,
    colorClass: 'text-color-category-skills-submission',
    bgColorClass: 'bg-color-category-skills-submission',
    borderColorClass: 'border-color-category-skills-submission',
    bgColorClass20: 'bg-color-category-skills-submission/20',
    gradientFromClass: 'from-color-category-skills-submission/10',
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
  const shouldReduceMotion = useReducedMotion();

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
        className={`grid ${gap.default} sm:grid-cols-2 lg:grid-cols-3`}
        {...(shouldReduceMotion
          ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
            }
          : {
              initial: 'hidden',
              animate: 'visible',
              variants: {
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: STAGGER.tight,
                  },
                },
              },
            })}
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
                hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
                visible: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
              }}
              initial={shouldReduceMotion ? { opacity: 0 } : 'hidden'}
              animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      ...MICROINTERACTIONS.card.hover,
                      scale: 1.03, // Preserve exact original scale (design token is 1.02, but original was 1.03)
                      y: 0, // Preserve original (no y movement in original)
                    }
              }
              whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
              transition={MICROINTERACTIONS.card.transition}
              className={cn(
                'group relative overflow-hidden rounded-xl border-2 p-6 text-left',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-color-accent-primary bg-color-accent-primary/10 shadow-glow-orange'
                  : isHovered
                    ? 'border-color-accent-primary/50 bg-card shadow-md'
                    : 'border-border bg-card'
              )}
            >
              {/* Background Gradient Overlay */}
              <motion.div
                className={cn(
                  'pointer-events-none absolute inset-0 transition-opacity bg-gradient-to-br to-transparent',
                  card.gradientFromClass
                )}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                }}
                transition={{ duration: DURATION.default }}
              />

              {/* Content */}
              <div className={`relative z-10`}>
                {/* Icon and Badge */}
                <div className={`${marginBottom.default} flex items-start justify-between`}>
                  <motion.div
                    className={cn(
                      'flex items-center justify-center',
                      iconSize['2xl'],
                      radius.lg,
                      card.bgColorClass20
                    )}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : {
                            scale: isHovered ? 1.1 : 1,
                            rotate: isHovered ? 5 : 0,
                          }
                    }
                    transition={SPRING.bouncy}
                  >
                    <Icon
                      className={cn(iconSize.lg, card.colorClass)}
                    />
                  </motion.div>

                  {/* Selection Indicator */}
                  {isSelected ? (
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, rotate: -180 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                      transition={SPRING.bouncy}
                      className={cn(
                        'flex items-center justify-center',
                        iconSize.lg,
                        radius['full'],
                        'bg-color-accent-primary shadow-glow-orange'
                      )}
                    >
                      <svg
                        className={`${iconSize.sm} text-white`}
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
                    marginBottom.compact,
                    'text-lg font-semibold transition-colors',
                    isSelected
                      ? 'text-color-accent-primary'
                      : 'text-foreground group-hover:text-accent-primary'
                  )}
                >
                  {card.label}
                </h3>

                {/* Description */}
                <p className={`text-muted-foreground ${marginBottom.compact} text-sm leading-relaxed`}>
                  {card.description}
                </p>

                {/* Examples */}
                <div className={`${spaceY.tight}.5`}>
                  {card.examples.slice(0, 2).map((example, index) => (
                    <motion.div
                      key={example}
                      className={`flex items-center ${gap.tight} text-xs`}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                      animate={
                        shouldReduceMotion
                          ? { opacity: isHovered || isSelected ? 1 : 0.6 }
                          : {
                              opacity: isHovered || isSelected ? 1 : 0.6,
                              x: 0,
                            }
                      }
                      transition={{
                        delay: STAGGER.fast + index * STAGGER.micro,
                        duration: DURATION.quick,
                      }}
                    >
                      <div
                        className={cn('h-1 w-1', radius['full'], card.bgColorClass)}
                      />
                      <span className="text-muted-foreground">{example}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Hover Border Animation */}
              <motion.div
                className={cn(
                  'pointer-events-none absolute inset-0 border-2',
                  radius.xl,
                  card.borderColorClass
                )}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isHovered ? 0.3 : 0,
                }}
                transition={{ duration: DURATION.quick }}
              />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Helper Text */}
      <motion.p
        className={`text-muted-foreground ${marginTop.comfortable} text-center text-sm`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: STAGGER.loose }}
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
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className={cn('w-full', className)}>
      <div className={`grid ${gap.tight}`}>
        {TYPE_CARDS.map((card) => {
          const Icon = card.icon;
          const isSelected = selected === card.type;

          return (
            <motion.button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                isSelected
                  ? 'border-color-accent-primary bg-color-accent-primary/10'
                  : 'border-border bg-card'
              )}
            >
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center',
                  iconSize['10'],
                  radius.lg,
                  card.bgColorClass20
                )}
              >
                <Icon
                  className={cn(iconSize.md, card.colorClass)}
                />
              </div>

              <div className={`min-w-0 flex-1`}>
                <div className="text-sm font-medium">{card.label}</div>
                <div className="text-muted-foreground truncate text-xs">{card.description}</div>
              </div>

              {isSelected ? (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1 }}
                  className="shrink-0"
                >
                  <svg
                    className={cn(iconSize.md, 'text-color-accent-primary')}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
