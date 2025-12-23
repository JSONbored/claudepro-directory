'use client';

/**
 * Rate Limits Component
 * Displays API rate limit usage and quotas
 */

interface RateLimitsProps {
  userId: string;
}

export function RateLimits({ userId }: RateLimitsProps) {
  // For now, show placeholder
  // In production, this would fetch from rate limit tracking system

  const limits = [
    {
      endpoint: 'API Requests',
      limit: 1000,
      period: 'per hour',
      used: 0,
    },
    {
      endpoint: 'Webhook Deliveries',
      limit: 100,
      period: 'per hour',
      used: 0,
    },
  ];

  return (
    <div className="space-y-4">
      {limits.map((limit) => {
        const percentage = (limit.used / limit.limit) * 100;
        const isNearLimit = percentage > 80;

        return (
          <div className="space-y-2" key={limit.endpoint}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{limit.endpoint}</p>
              <p className="text-muted-foreground text-sm">
                {limit.used} / {limit.limit} {limit.period}
              </p>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className={`h-full transition-all ${isNearLimit ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {isNearLimit ? (
              <p className="text-warning text-xs">Warning: Approaching rate limit</p>
            ) : null}
          </div>
        );
      })}

      <div className="bg-muted border-border rounded-lg border p-4">
        <p className="mb-2 text-sm font-medium">Rate Limit Information</p>
        <p className="text-muted-foreground text-xs">
          Rate limits reset at the start of each hour. Contact support if you need higher limits.
        </p>
      </div>
    </div>
  );
}
