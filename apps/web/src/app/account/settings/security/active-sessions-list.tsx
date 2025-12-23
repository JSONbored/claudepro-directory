'use client';

/**
 * Active Sessions List
 * Displays and manages active user sessions
 */

import { signOutSession } from '@heyclaude/web-runtime/actions/security';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Globe, Monitor, Smartphone, Tablet } from '@heyclaude/web-runtime/icons';
import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Session {
  createdAt?: null | string;
  id: string;
  ip?: null | string;
  isCurrent: boolean;
  updatedAt?: null | string;
  userAgent?: null | string;
}

interface ActiveSessionsListProps {
  userId: string;
}

function getDeviceIcon(userAgent?: null | string) {
  if (!userAgent) return Globe;

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return Smartphone;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return Tablet;
  }
  return Monitor;
}

function parseUserAgent(userAgent?: null | string): {
  browser: string;
  device: string;
  os: string;
} {
  if (!userAgent) {
    return { browser: 'Unknown', device: 'Unknown', os: 'Unknown' };
  }

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS detection
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Device detection
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, device, os };
}

export function ActiveSessionsList({ userId }: ActiveSessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Failed to sign out session',
    defaultRethrow: false,
    scope: 'ActiveSessionsList',
  });

  useEffect(() => {
    // Fetch sessions - for now, we'll use a placeholder
    // In production, you'd fetch from an RPC or API endpoint
    // Supabase Auth doesn't provide a direct getSessions() method
    // You'd need to create an RPC function to query auth.sessions table

    // For now, show current session only
    // TODO: Implement RPC function to fetch all sessions
    setIsLoading(false);
    setSessions([
      {
        createdAt: new Date().toISOString(),
        id: 'current-session',
        isCurrent: true,
        updatedAt: new Date().toISOString(),
        userAgent: globalThis.window === undefined ? null : globalThis.navigator.userAgent,
      },
    ]);
  }, [userId]);

  const handleSignOut = async (sessionId: string, isCurrent: boolean) => {
    await runLoggedAsync(async () => {
      const result = await signOutSession({ sessionId });

      if (result?.serverError) {
        toasts.error(result.serverError);
        return;
      }

      if (result?.data?.success) {
        if (isCurrent || result.data.signedOutCurrent) {
          toasts.success('Signed out successfully');
          router.push('/login');
        } else {
          toasts.success('Session signed out');
          // Refresh sessions list
          router.refresh();
        }
      }
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-muted-foreground text-sm">No active sessions found.</div>;
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const deviceInfo = parseUserAgent(session.userAgent);
        const DeviceIcon = getDeviceIcon(session.userAgent);
        const isCurrent = session.isCurrent;

        return (
          <div
            className="border-border bg-card flex items-center justify-between rounded-lg border p-4"
            key={session.id}
          >
            <div className="flex items-center gap-3">
              <DeviceIcon className="text-muted-foreground h-5 w-5" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {deviceInfo.browser} on {deviceInfo.os}
                  </p>
                  {isCurrent ? (
                    <span className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-xs font-medium">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-xs">
                  {deviceInfo.device}
                  {session.ip ? ` • ${session.ip}` : null}
                </p>
                {session.updatedAt ? (
                  <p className="text-muted-foreground text-xs">
                    Last active: {new Date(session.updatedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>
            {!isCurrent && (
              <Button
                onClick={() => handleSignOut(session.id, isCurrent)}
                size="sm"
                variant="outline"
              >
                Sign Out
              </Button>
            )}
          </div>
        );
      })}
      <p className="text-muted-foreground text-xs">
        Note: Signing out other sessions requires Supabase Admin API or RPC function. Currently,
        only the current session can be signed out directly.
      </p>
    </div>
  );
}
