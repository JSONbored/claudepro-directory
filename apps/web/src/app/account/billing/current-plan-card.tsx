'use client';

/**
 * Current Plan Card
 * Displays the user's current plan/tier information
 */

import { Badge } from '@heyclaude/web-runtime/ui';
import { type user_tier } from '@prisma/client';
import { Zap, Crown, Star } from '@heyclaude/web-runtime/icons';

interface CurrentPlanCardProps {
  tier: user_tier | null | string;
}

const tierConfig: Record<string, { name: string; icon: typeof Zap; color: string; features: string[] }> = {
  free: {
    name: 'Free',
    icon: Star,
    color: 'bg-muted text-muted-foreground',
    features: [
      'Basic profile',
      'Bookmark content',
      'Submit content',
      'View public profiles',
    ],
  },
  pro: {
    name: 'Pro',
    icon: Zap,
    color: 'bg-primary text-primary-foreground',
    features: [
      'Everything in Free',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    icon: Crown,
    color: 'bg-warning text-warning-foreground',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
};

export function CurrentPlanCard({ tier }: CurrentPlanCardProps) {
  const tierKey = (tier ?? 'free').toString();
  const config = tierConfig[tierKey] ?? tierConfig.free;
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base sm:text-lg truncate">{config.name} Plan</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {tierKey === 'free' ? 'No subscription required' : 'Active subscription'}
            </p>
          </div>
        </div>
        <Badge variant={tierKey === 'free' ? 'secondary' : 'default'} className="self-start sm:self-center">
          {tierKey === 'free' ? 'Free' : 'Active'}
        </Badge>
      </div>

      <div>
        <h4 className="font-medium text-sm mb-2">Plan Features:</h4>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          {config.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {tierKey !== 'enterprise' && (
        <div className="pt-4 border-t border-border">
          <p className="text-muted-foreground text-sm mb-2">
            Want to upgrade? Contact us to learn more about our Pro and Enterprise plans.
          </p>
        </div>
      )}
    </div>
  );
}

