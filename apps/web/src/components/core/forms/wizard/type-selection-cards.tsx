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
  absolute,
  alignItems,
  bgColor,
  borderColor,
  categoryText,
  cluster,
  display,
  flexGrow,
  gap,
  glowShadow,
  grid,
  iconSize,
  justify,
  marginBottom,
  marginTop,
  muted,
  opacityLevel,
  overflow,
  padding,
  position,
  radius,
  shadow,
  size,
  spaceY,
  squareSize,
  submissionFormColors,
  textColor,
  transition,
  weight,
  zLayer,
  width,
  textAlign,
  borderWidth,
  minWidth,
  pointerEvents,
} from '@heyclaude/web-runtime/design-system';
import type { SubmissionContentType } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { animation } from '@heyclaude/web-runtime/design-system/tokens';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';

interface TypeCard {
  type: SubmissionContentType;
  label: string;
  description: string;
  icon: typeof Bot;
  colorClass: string; // Tailwind class for text color
  colorValue: string; // OKLCH value for inline styles
  examples: string[];
}

const TYPE_CARDS: TypeCard[] = [
  {
    type: 'agents',
    label: 'Agent',
    description: 'Claude system prompts and AI agents',
    icon: Bot,
    colorClass: categoryText.agents,
    colorValue: submissionFormColors.category.agents,
    examples: ['React Expert', 'Code Reviewer', 'Writing Assistant'],
  },
  {
    type: 'mcp',
    label: 'MCP Server',
    description: 'Model Context Protocol integrations',
    icon: Zap,
    colorClass: categoryText.mcp,
    colorValue: submissionFormColors.category.mcp,
    examples: ['Supabase MCP', 'GitHub MCP', 'File System'],
  },
  {
    type: 'rules',
    label: 'Rule',
    description: 'Expertise rules and specialized knowledge',
    icon: Brain,
    colorClass: categoryText.rules,
    colorValue: submissionFormColors.category.rules,
    examples: ['TypeScript Best Practices', 'Accessibility Guide'],
  },
  {
    type: 'commands',
    label: 'Command',
    description: 'Shell commands and automation scripts',
    icon: Terminal,
    colorClass: categoryText.commands,
    colorValue: submissionFormColors.category.commands,
    examples: ['Git aliases', 'Build scripts', 'Deploy commands'],
  },
  {
    type: 'hooks',
    label: 'Hook',
    description: 'React hooks and reusable logic',
    icon: Code,
    colorClass: categoryText.hooks,
    colorValue: submissionFormColors.category.hooks,
    examples: ['useDebounce', 'useLocalStorage', 'useFetch'],
  },
  {
    type: 'statuslines',
    label: 'Statusline',
    description: 'Terminal status line configurations',
    icon: FileCode,
    colorClass: categoryText.statuslines,
    colorValue: submissionFormColors.category.statuslines,
    examples: ['Starship config', 'Oh My Zsh theme'],
  },
  {
    type: 'skills',
    label: 'Skill',
    description: 'Claude skills and capabilities',
    icon: Sparkles,
    colorClass: categoryText.skills,
    colorValue: submissionFormColors.category.skills,
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
    <div className={cn(width.full, className)}>
      {/* Grid of Type Cards */}
      <motion.div
        className={grid.responsive123}
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
                `group relative ${overflow.hidden} ${radius.xl} ${borderWidth['2']} ${padding.comfortable} ${textAlign.left} ${transition.all}`,
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isSelected
                  ? `${borderColor.accent} ${bgColor['accent/10']} ${shadow.md}`
                  : isHovered
                    ? `${borderColor['accent/50']} ${bgColor.muted} ${shadow.md}`
                    : `${borderColor.border} ${bgColor.muted}`
              )}
              style={{
                boxShadow: isSelected ? glowShadow.orange : isHovered ? undefined : 'none',
              }}
            >
              {/* Background Gradient Overlay */}
              <motion.div
                className={`${pointerEvents.none} ${absolute.inset} ${opacityLevel[0]} ${transition.opacity}`}
                style={{
                  background: `linear-gradient(135deg, ${card.colorValue}10, transparent)`,
                }}
                animate={{
                  opacity: isHovered || isSelected ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* Content */}
              <div className={`${position.relative} ${zLayer.raised}`}>
                {/* Icon and Badge */}
                <div className={`${marginBottom.default} ${display.flex} ${alignItems.start} ${justify.between}`}>
                  <motion.div
                    className={`${display.flex} ${iconSize['3xl']} ${alignItems.center} ${justify.center} ${radius.lg}`}
                    style={{
                      backgroundColor: `${card.colorValue}20`,
                    }}
                    animate={{
                      scale: isHovered ? 1.1 : 1,
                      rotate: isHovered ? 5 : 0,
                    }}
                    transition={animation.spring.bouncy}
                  >
                    <Icon
                      className={cn(iconSize.lg, card.colorClass)}
                    />
                  </motion.div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={animation.spring.bouncy}
                      className={cn(`${display.flex} ${iconSize.lg} ${alignItems.center} ${justify.center} ${radius.full}`, bgColor.accent)}
                      style={{
                        boxShadow: glowShadow.orange,
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
                      ? textColor.accent
                      : `${textColor.foreground} group-hover:${textColor.accent}`
                  )}
                >
                  {card.label}
                </h3>

                {/* Description */}
                <p className={`${marginBottom.compact} ${muted.smRelaxed}`}>
                  {card.description}
                </p>

                {/* Examples */}
                <div className={spaceY.snug}>
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
                          backgroundColor: card.colorValue,
                        }}
                      />
                      <span className={muted.default}>{example}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Hover Border Animation */}
              <motion.div
                className={`${pointerEvents.none} ${absolute.inset} ${radius.xl} ${borderWidth['2']}`}
                style={{
                  borderColor: card.colorValue,
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
        className={`${marginTop.comfortable} ${textAlign.center} ${muted.sm}`}
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
    <div className={cn(width.full, className)}>
      <div className={`${grid.base} ${gap.compact}`}>
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
                `${cluster.default} ${radius.lg} border ${padding.compact} ${textAlign.left} ${transition.all}`,
                isSelected
                  ? `border-accent-primary ${bgColor['accent/10']}`
                  : `${borderColor.border} ${bgColor.secondary} hover:border-accent-primary/50`
              )}
              style={{
                borderColor: isSelected
                  ? submissionFormColors.accent.primary
                  : submissionFormColors.border.default,
                backgroundColor: isSelected
                  ? `${submissionFormColors.accent.primary}1a`
                  : submissionFormColors.background.secondary,
              }}
            >
              <div
                className={`${display.flex} ${iconSize['2xl']} ${flexGrow.shrink0} ${alignItems.center} ${justify.center} ${radius.lg}`}
                style={{
                  backgroundColor: `${card.colorValue}20`,
                }}
              >
                <Icon
                  className={`${iconSize.md} ${card.colorClass}`}
                />
              </div>

              <div className={`${minWidth[0]} ${flexGrow['1']}`}>
                <div className={`${weight.medium} ${size.sm}`}>{card.label}</div>
                <div className={`truncate ${muted.default} ${size.xs}`}>{card.description}</div>
              </div>

              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={flexGrow.shrink0}>
                  <svg
                    className={`${iconSize.md} ${textColor.accent}`}
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
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
