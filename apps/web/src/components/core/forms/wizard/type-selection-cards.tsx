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
import {
  borderColor,
  cluster,
  gap,
  iconSize,
  alignItems,
  marginBottom,
  marginTop,
  muted,
  opacityLevel,
  overflow,
  radius,
  size,
  textColor,
  transition,
  weight,
  zLayer,
  justify,
  flexGrow,
  padding,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
import type { SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/ui/design-tokens/submission-form';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';

interface TypeCard {
  type: SubmissionContentType;
  label: string;
  description: string;
  icon: typeof Bot;
  color: string;
  examples: string[];
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
  selected?: SubmissionContentType;
  onSelect: (type: SubmissionContentType) => void;
  className?: string;
}

export function TypeSelectionCards({ selected, onSelect, className }: TypeSelectionCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<SubmissionContentType | null>(null);

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
        className={`grid ${gap.comfortable} sm:grid-cols-2 lg:grid-cols-3`}
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
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                `group relative ${overflow.hidden} ${radius.xl} border-2 ${padding.comfortable} text-left ${transition.all}`,
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isSelected
                  ? 'border-accent-primary bg-accent-primary/10'
                  : `${borderColor.border} bg-background-secondary hover:border-accent-primary/50`
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
                className={`pointer-events-none absolute inset-0 ${opacityLevel[0]} ${transition.opacity}`}
                style={{
                  background: `linear-gradient(135deg, ${card.color}10, transparent)`,
                }}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Content */}
              <div className={`relative ${zLayer.raised}`}>
                {/* Icon and Badge */}
                <div className={`${marginBottom.default} flex ${alignItems.start} ${justify.between}`}>
                  <motion.div
                    className={`flex ${iconSize['3xl']} ${alignItems.center} ${justify.center} ${radius.lg}`}
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
                      className={iconSize.lg}
                      style={{
                        color: card.color,
                      }}
                    />
                  </motion.div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={TOKENS.animations.spring.bouncy}
                      className={`flex ${iconSize.lg} ${alignItems.center} ${justify.center} ${radius.full}`}
                      style={{
                        backgroundColor: TOKENS.colors.accent.primary,
                        boxShadow: TOKENS.shadows.glow.orange,
                      }}
                    >
                      <svg
                        className={`${iconSize.sm} ${textColor.white}`}
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
                  )}
                </div>

                {/* Label */}
                <h3
                  className={cn(
                    `${marginBottom.tight} ${weight.semibold} ${size.lg} ${transition.colors}`,
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
                <p className={`${marginBottom.compact} ${muted.smRelaxed}`}>
                  {card.description}
                </p>

                {/* Examples */}
                <div className="space-y-1.5">
                  {card.examples.slice(0, 2).map((example, index) => (
                    <motion.div
                      key={example}
                      className={`${cluster.compact} ${size.xs}`}
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
                        className={`${squareSize.dot} ${radius.full}`}
                        style={{
                          backgroundColor: card.color,
                        }}
                      />
                      <span className={muted.default}>{example}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Hover Border Animation */}
              <motion.div
                className={`pointer-events-none absolute inset-0 ${radius.xl} border-2`}
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
        className={`${marginTop.comfortable} text-center ${muted.sm}`}
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
      <div className={`grid ${gap.compact}`}>
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
                `${cluster.default} ${radius.lg} border ${padding.compact} text-left ${transition.all}`,
                isSelected
                  ? 'border-accent-primary bg-accent-primary/10'
                  : `${borderColor.border} bg-background-secondary hover:border-accent-primary/50`
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
                className={`flex ${iconSize['2xl']} ${flexGrow.shrink0} ${alignItems.center} ${justify.center} ${radius.lg}`}
                style={{
                  backgroundColor: `${card.color}20`,
                }}
              >
                <Icon
                  className={iconSize.md}
                  style={{
                    color: card.color,
                  }}
                />
              </div>

              <div className={`min-w-0 ${flexGrow['1']}`}>
                <div className={`${weight.medium} ${size.sm}`}>{card.label}</div>
                <div className={`truncate ${muted.default} ${size.xs}`}>{card.description}</div>
              </div>

              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                  <svg
                    className={iconSize.md}
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
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
