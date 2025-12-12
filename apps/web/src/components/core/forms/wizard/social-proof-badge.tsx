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
import { cn } from '@heyclaude/web-runtime/ui';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';

interface SocialProofBadgeProps {
  className?: string;
  count?: number;
  names?: string[];
  percentage?: number;
  variant: 'contributors' | 'join' | 'submissions' | 'success';
}

/**
 * Render an animated social-proof badge for a specified variant.
 *
 * @param variant - One of `'contributors' | 'join' | 'submissions' | 'success'` indicating which badge layout and content to render.
 * @param count - Numeric value used by the `submissions` and `join` variants (number of submissions or total users); defaults to 0.
 * @param names - Array of contributor names shown by the `contributors` variant; only the first two are displayed and additional names are summarized.
 * @param percentage - Percent value shown by the `success` variant (displayed as `{percentage}% approved`).
 * @param className - Optional additional CSS classes applied to the badge container.
 *
 * @returns A JSX element representing the requested social-proof badge.
 *
 * @see SocialProofBar
 * @see InlineSocialProof
 */
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
        transition={SPRING.smooth}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-purple-500/30',
          'bg-purple-500/10 px-3 py-2',
          className
        )}
      >
        <Award className="h-4 w-4 text-purple-400" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-purple-300">Top Contributors</span>
          {names.length > 0 && (
            <span className="text-[10px] text-purple-400/80">
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
        transition={SPRING.smooth}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-blue-500/30',
          'bg-blue-500/10 px-3 py-2',
          className
        )}
      >
        <TrendingUp className="h-4 w-4 text-blue-400" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-blue-300">{count} submissions</span>
          <span className="text-[10px] text-blue-400/80">this week</span>
        </div>
      </motion.div>
    ),

    success: (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING.bouncy}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-green-500/30',
          'bg-green-500/10 px-3 py-2',
          className
        )}
      >
        <CheckCircle className="h-4 w-4 text-green-400" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-green-300">{percentage}% approved</span>
          <span className="text-[10px] text-green-400/80">success rate</span>
        </div>
      </motion.div>
    ),

    join: (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-amber-500/30',
          'bg-amber-500/10 px-3 py-2',
          className
        )}
      >
        <Users className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-medium text-amber-300">
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
  className?: string;
  stats: {
    contributors?: { count: number; names: string[] };
    submissions?: number;
    successRate?: null | number;
    totalUsers?: number;
  };
}

/**
 * Render a horizontal bar of social proof badges based on provided stats.
 *
 * Renders zero or more SocialProofBadge components (contributors, submissions, success, join)
 * according to which fields in `stats` are present and positive.
 *
 * @param stats - Object controlling which badges are shown:
 *   - `contributors?: { count: number; names?: string[] }` — shows the contributors badge when `count > 0`.
 *   - `submissions?: number` — shows the submissions badge when > 0.
 *   - `successRate?: null | number` — shows the success badge when non-null.
 *   - `totalUsers?: number` — shows the join badge when > 0.
 * @param className - Optional additional className applied to the outer container.
 * @returns A React element containing the animated, horizontally arranged social-proof badges.
 *
 * @see SocialProofBadge
 * @see InlineSocialProof
 */
export function SocialProofBar({ stats, className }: SocialProofBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {stats.contributors && stats.contributors.count > 0 ? (
        <SocialProofBadge
          variant="contributors"
          count={stats.contributors.count}
          names={stats.contributors.names}
        />
      ) : null}

      {stats.submissions && stats.submissions > 0 ? (
        <SocialProofBadge variant="submissions" count={stats.submissions} />
      ) : null}

      {stats.successRate ? (
        <SocialProofBadge variant="success" percentage={stats.successRate} />
      ) : null}

      {stats.totalUsers && stats.totalUsers > 0 ? (
        <SocialProofBadge variant="join" count={stats.totalUsers} />
      ) : null}
    </motion.div>
  );
}

/**
 * Inline Social Proof - Compact single-line version
 */
interface InlineSocialProofProps {
  className?: string;
  icon?: 'sparkles' | 'trending' | 'users';
  subtext?: string;
  text: string;
}

/**
 * Renders a compact inline social proof element with an icon, primary text, and optional subdued subtext.
 *
 * @param icon - Which icon to display: `'sparkles'`, `'trending'`, or `'users'`. Defaults to `'users'`.
 * @param text - Primary text to display next to the icon.
 * @param subtext - Optional secondary text rendered in a subdued style after the primary text.
 * @param className - Optional additional CSS class names applied to the container.
 * @returns The JSX element for the inline social proof.
 *
 * @see InlineSocialProofProps
 * @see SocialProofBadge
 * @see StepSocialProof
 */
export function InlineSocialProof({
  icon = 'users',
  text,
  subtext,
  className,
}: InlineSocialProofProps) {
  const icons = {
    users: <Users className="h-3.5 w-3.5" />,
    sparkles: <Sparkles className="h-3.5 w-3.5" />,
    trending: <TrendingUp className="h-3.5 w-3.5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING.smooth}
      className={cn('text-muted-foreground inline-flex items-center gap-1.5 text-xs', className)}
    >
      {icons[icon]}
      <span>
        {text}
        {subtext ? <span className="text-muted-foreground/60"> {subtext}</span> : null}
      </span>
    </motion.div>
  );
}

/**
 * Step Social Proof - Contextual proof for each wizard step
 */
interface StepSocialProofProps {
  className?: string;
  stats?: {
    step1?: string;
    step2?: string;
    step3?: string;
    step4?: string;
    step5?: string;
  };
  step: 1 | 2 | 3 | 4 | 5;
}

/**
 * Render contextual social proof for a specific wizard step.
 *
 * Chooses a message from `stats` or a sensible default for the given `step` and renders
 * an InlineSocialProof with an icon selected for that step.
 *
 * @param step - The current step number (1–5) to determine message and icon
 * @param stats - Optional step-specific override messages keyed by step (step1–step5)
 * @param className - Optional additional CSS class names applied to the rendered component
 * @returns The configured InlineSocialProof element for the provided step
 *
 * @see InlineSocialProof
 */
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