'use client';

/**
 * Current Plan Card
 * Displays the user's current plan/tier information
 */

import { Crown, Star, Zap } from '@heyclaude/web-runtime/icons';
import { Badge } from '@heyclaude/web-runtime/ui';
import { type user_tier } from '@prisma/client';

interface CurrentPlanCardProps {
  tier: null | string | user_tier;
}

const tierConfig: Record<
  string,
  { color: string; features: string[]; icon: typeof Zap; name: string }
> = {
  enterprise: {
    color: 'bg-warning text-warning-foreground',
    features: ['Everything in Pro', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    icon: Crown,
    name: 'Enterprise',
  },
  free: {
    color: 'bg-muted text-muted-foreground',
    features: ['Basic profile', 'Bookmark content', 'Submit content', 'View public profiles'],
    icon: Star,
    name: 'Free',
  },
  pro: {
    color: 'bg-primary text-primary-foreground',
    features: ['Everything in Free', 'Advanced analytics', 'Priority support', 'Custom branding'],
    icon: Zap,
    name: 'Pro',
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
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${config.color}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold sm:text-lg">{config.name} Plan</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {tierKey === 'free' ? 'No subscription required' : 'Active subscription'}
            </p>
          </div>
        </div>
        <Badge
          className="self-start sm:self-center"
          variant={tierKey === 'free' ? 'secondary' : 'default'}
        >
          {tierKey === 'free' ? 'Free' : 'Active'}
        </Badge>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Plan Features:</h4>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          {config.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>

      {tierKey !== 'enterprise' && (
        <div className="border-border border-t pt-4">
          <p className="text-muted-foreground mb-2 text-sm">
            Want to upgrade? Contact us to learn more about our Pro and Enterprise plans.
          </p>
        </div>
      )}
    </div>
  );
}
