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
  message: string;
  timestamp: string;
  title: string;
  type: 'info' | 'success' | 'warning';
}

export function SecurityAlerts({ userId }: SecurityAlertsProps) {
  // For now, show placeholder alerts
  // In production, you'd fetch from an RPC or API endpoint
  const alerts: SecurityAlert[] = [
    {
      id: '1',
      message: '2FA is enabled on your account. This adds an extra layer of security.',
      timestamp: new Date().toISOString(),
      title: 'Two-Factor Authentication',
      type: 'success',
    },
    {
      id: '2',
      message: 'Your password was last changed recently. Consider updating it regularly.',
      timestamp: new Date().toISOString(),
      title: 'Password Strength',
      type: 'info',
    },
  ];

  if (alerts.length === 0) {
    return <div className="text-muted-foreground text-sm">No security alerts at this time.</div>;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const Icon =
          alert.type === 'success' ? CheckCircle : (alert.type === 'warning' ? AlertTriangle : Info);

        const bgColor =
          alert.type === 'success'
            ? 'bg-success-bg border-success-border'
            : alert.type === 'warning'
              ? 'bg-warning-bg border-warning-border'
              : 'bg-info-bg border-info-border';

        const textColor =
          alert.type === 'success'
            ? 'text-success'
            : alert.type === 'warning'
              ? 'text-warning'
              : 'text-info';

        return (
          <div className={`flex items-start gap-3 rounded-lg border p-3 ${bgColor}`} key={alert.id}>
            <Icon className={`h-5 w-5 flex-shrink-0 ${textColor} mt-0.5`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${textColor}`}>{alert.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">{alert.message}</p>
              {alert.timestamp ? (
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
