'use client';

/**
 * Social Proof Badge Component
 *
 * Displays live social proof indicators in the submission wizard:
 * - Top contributors this week
 * - Recent submission count
 * - Success rate indicators
 * - "Join X users" messaging
 */

import { Award, CheckCircle, Sparkles, TrendingUp, Users } from '@heyclaude/web-runtime/icons';
import {
  alignItems,
  cluster,
  flexDir,
  flexWrap,
  gap,
  iconSize,
  muted,
  padding,
  radius,
  size,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { SUBMISSION_FORM_TOKENS as TOKENS } from '@heyclaude/web-runtime/ui/design-tokens/submission-form';
import { motion } from 'motion/react';

interface SocialProofBadgeProps {
  variant: 'contributors' | 'submissions' | 'success' | 'join';
  count?: number;
  names?: string[];
  percentage?: number;
  className?: string;
}

export function SocialProofBadge({
  variant,
  count = 0,
  names = [],
  percentage,
  className,
}: SocialProofBadgeProps) {
  const badges = {
    contributors: (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TOKENS.animations.spring.smooth}
        className={cn(
          `${cluster.compact} ${radius.lg} border border-purple-500/30`,
          `bg-purple-500/10 ${padding.xCompact} ${padding.yCompact}`,
          className
        )}
      >
        <Award className={`${iconSize.sm} text-purple-400`} />
        <div className={`flex ${flexDir.col}`}>
          <span className={`${weight.medium} text-purple-300 ${size.xs}`}>Top Contributors</span>
          {names.length > 0 && (
            <span className={`${size['2xs']} text-purple-400/80`}>
              {names.slice(0, 2).join(', ')}
              {names.length > 2 && ` +${names.length - 2}`}
            </span>
          )}
        </div>
      </motion.div>
    ),

    submissions: (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className={cn(
          `${cluster.compact} ${radius.lg} border border-blue-500/30`,
          `bg-blue-500/10 ${padding.xCompact} ${padding.yCompact}`,
          className
        )}
      >
        <TrendingUp className={`${iconSize.sm} text-blue-400`} />
        <div className={`flex ${flexDir.col}`}>
          <span className={`${weight.medium} text-blue-300 ${size.xs}`}>{count} submissions</span>
          <span className={`${size['2xs']} text-blue-400/80`}>this week</span>
        </div>
      </motion.div>
    ),

    success: (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={TOKENS.animations.spring.bouncy}
        className={cn(
          `${cluster.compact} ${radius.lg} border border-green-500/30`,
          `bg-green-500/10 ${padding.xCompact} ${padding.yCompact}`,
          className
        )}
      >
        <CheckCircle className={`${iconSize.sm} text-green-400`} />
        <div className={`flex ${flexDir.col}`}>
          <span className={`${weight.medium} text-green-300 ${size.xs}`}>{percentage}% approved</span>
          <span className={`${size['2xs']} text-green-400/80`}>success rate</span>
        </div>
      </motion.div>
    ),

    join: (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={TOKENS.animations.spring.smooth}
        className={cn(
          `${cluster.compact} ${radius.lg} border border-amber-500/30`,
          `bg-amber-500/10 ${padding.xCompact} ${padding.yCompact}`,
          className
        )}
      >
        <Users className={`${iconSize.sm} text-amber-400`} />
        <span className={`${weight.medium} text-amber-300 ${size.xs}`}>
          Join {count.toLocaleString()} users
        </span>
      </motion.div>
    ),
  };

  return badges[variant];
}

/**
 * Social Proof Bar - Horizontal collection of badges
 */
interface SocialProofBarProps {
  stats: {
    contributors?: { count: number; names: string[] };
    submissions?: number;
    successRate?: number | null;
    totalUsers?: number;
  };
  className?: string;
}

export function SocialProofBar({ stats, className }: SocialProofBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TOKENS.animations.spring.smooth}
      className={cn(
  `flex ${flexWrap.wrap} ${alignItems.center} ${gap.compact}`, className)}
    >
      {stats.contributors && stats.contributors.count > 0 && (
        <SocialProofBadge
          variant="contributors"
          count={stats.contributors.count}
          names={stats.contributors.names}
        />
      )}

      {stats.submissions && stats.submissions > 0 && (
        <SocialProofBadge variant="submissions" count={stats.submissions} />
      )}

      {stats.successRate && <SocialProofBadge variant="success" percentage={stats.successRate} />}

      {stats.totalUsers && stats.totalUsers > 0 && (
        <SocialProofBadge variant="join" count={stats.totalUsers} />
      )}
    </motion.div>
  );
}

/**
 * Inline Social Proof - Compact single-line version
 */
interface InlineSocialProofProps {
  icon?: 'users' | 'sparkles' | 'trending';
  text: string;
  subtext?: string;
  className?: string;
}

export function InlineSocialProof({
  icon = 'users',
  text,
  subtext,
  className,
}: InlineSocialProofProps) {
  const icons = {
    users: <Users className={iconSize.xsPlus} />,
    sparkles: <Sparkles className={iconSize.xsPlus} />,
    trending: <TrendingUp className={iconSize.xsPlus} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={TOKENS.animations.spring.smooth}
      className={cn(`inline-${cluster.snug} ${muted.default} ${size.xs}`, className)}
    >
      {icons[icon]}
      <span>
        {text}
        {subtext && <span className={`${muted.default}/60`}> {subtext}</span>}
      </span>
    </motion.div>
  );
}

/**
 * Step Social Proof - Contextual proof for each wizard step
 */
interface StepSocialProofProps {
  step: 1 | 2 | 3 | 4 | 5;
  stats?: {
    step1?: string;
    step2?: string;
    step3?: string;
    step4?: string;
    step5?: string;
  };
  className?: string;
}

export function StepSocialProof({ step, stats, className }: StepSocialProofProps) {
  const proofMessages = {
    1: stats?.step1 || '234 users started this week',
    2: stats?.step2 || '89% complete this step in under 2 minutes',
    3: stats?.step3 || 'Used by 567 successful submissions',
    4: stats?.step4 || 'Most submissions have 3+ examples',
    5: stats?.step5 || '94% approval rate for complete submissions',
  };

  return (
    <InlineSocialProof
      icon={step === 5 ? 'sparkles' : step >= 3 ? 'trending' : 'users'}
      text={proofMessages[step]}
      {...(className ? { className } : {})}
    />
  );
}
