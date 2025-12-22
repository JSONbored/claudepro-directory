'use client';

/**
 * Active Sessions List
 * Displays and manages active user sessions
 */

import { signOutSession } from '@heyclaude/web-runtime/actions/security';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { Monitor, Smartphone, Tablet, Globe } from '@heyclaude/web-runtime/icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  userAgent?: string | null;
  ip?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isCurrent: boolean;
}

interface ActiveSessionsListProps {
  userId: string;
}

function getDeviceIcon(userAgent?: string | null) {
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

function parseUserAgent(userAgent?: string | null): { browser: string; os: string; device: string } {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
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

  return { browser, os, device };
}

export function ActiveSessionsList({ userId }: ActiveSessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const runLoggedAsync = useLoggedAsync({
    scope: 'ActiveSessionsList',
    defaultMessage: 'Failed to sign out session',
    defaultRethrow: false,
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
        id: 'current-session',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    return (
      <div className="text-muted-foreground text-sm">
        No active sessions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const deviceInfo = parseUserAgent(session.userAgent);
        const DeviceIcon = getDeviceIcon(session.userAgent);
        const isCurrent = session.isCurrent;

        return (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <DeviceIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {deviceInfo.browser} on {deviceInfo.os}
                  </p>
                  {isCurrent && (
                    <span className="bg-accent/10 text-accent rounded-full px-2 py-0.5 text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {deviceInfo.device}
                  {session.ip && ` • ${session.ip}`}
                </p>
                {session.updatedAt && (
                  <p className="text-muted-foreground text-xs">
                    Last active: {new Date(session.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {!isCurrent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSignOut(session.id, isCurrent)}
              >
                Sign Out
              </Button>
            )}
          </div>
        );
      })}
      <p className="text-muted-foreground text-xs">
        Note: Signing out other sessions requires Supabase Admin API or RPC function. Currently, only the current session can be signed out directly.
      </p>
    </div>
  );
}

