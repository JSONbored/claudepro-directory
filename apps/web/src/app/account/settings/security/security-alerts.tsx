'use client';

/**
 * Security Alerts Component
 * Displays recent security events and important account security information
 */

import { AlertTriangle, CheckCircle, Info } from '@heyclaude/web-runtime/icons';
import { Card } from '@heyclaude/web-runtime/ui';

interface SecurityAlertsProps {
  userId: string;
}

interface SecurityAlert {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export function SecurityAlerts({ userId }: SecurityAlertsProps) {
  // For now, show placeholder alerts
  // In production, you'd fetch from an RPC or API endpoint
  const alerts: SecurityAlert[] = [
    {
      id: '1',
      type: 'success',
      title: 'Two-Factor Authentication',
      message: '2FA is enabled on your account. This adds an extra layer of security.',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'info',
      title: 'Password Strength',
      message: 'Your password was last changed recently. Consider updating it regularly.',
      timestamp: new Date().toISOString(),
    },
  ];

  if (alerts.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No security alerts at this time.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon =
          alert.type === 'success'
            ? CheckCircle
            : alert.type === 'warning'
            ? AlertTriangle
            : Info;

        const bgColor =
          alert.type === 'success'
            ? 'bg-green-500/10 border-green-500/20'
            : alert.type === 'warning'
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-blue-500/10 border-blue-500/20';

        const textColor =
          alert.type === 'success'
            ? 'text-green-600 dark:text-green-400'
            : alert.type === 'warning'
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-blue-600 dark:text-blue-400';

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border p-3 ${bgColor}`}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${textColor} mt-0.5`} />
            <div className="flex-1">
              <p className={`font-medium text-sm ${textColor}`}>{alert.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">{alert.message}</p>
              {alert.timestamp && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

