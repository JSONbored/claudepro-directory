/**
 * Status Page Content
 *
 * Client component that fetches and displays API status.
 */

'use client';

import { formatDate } from '@heyclaude/web-runtime/data/utils';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useInterval } from '@heyclaude/web-runtime/hooks/use-interval';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Status, StatusIndicator, StatusLabel } from '@/src/components/ui/status';

interface ApiHealthData {
  checks?: Record<string, unknown>;
  database?: string;
  status: 'degraded' | 'healthy' | 'unhealthy';
  timestamp?: string;
  version?: string;
}

function mapApiStatusToComponentStatus(
  apiStatus: string
): 'degraded' | 'maintenance' | 'offline' | 'online' {
  switch (apiStatus.toLowerCase()) {
    case 'degraded': {
      return 'degraded';
    }
    case 'healthy': {
      return 'online';
    }
    case 'unhealthy': {
      return 'offline';
    }
    default: {
      return 'offline';
    }
  }
}

// Optimized polling interval: 90 seconds (reduced from 30s)
// Status doesn't change frequently, so longer interval is acceptable
const POLL_INTERVAL_MS = 90_000; // 90 seconds
const INITIAL_POLL_INTERVAL_MS = 30_000; // 30 seconds for first poll after errors
const MAX_POLL_INTERVAL_MS = 300_000; // 5 minutes max (exponential backoff cap)

export function StatusPageContent() {
  const [healthData, setHealthData] = useState<ApiHealthData | null>(null);
  const {
    setFalse: setIsLoadingFalse,
    setTrue: setIsLoadingTrue,
    value: isLoading,
  } = useBoolean(true);
  const [error, setError] = useState<null | string>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [currentPollInterval, setCurrentPollInterval] = useState(POLL_INTERVAL_MS);
  const consecutiveErrorsRef = useRef(0);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoadingTrue();
      const response = await fetch('/api/status');
      const data = await response.json();
      setHealthData(data);
      setError(null);
      // Reset poll interval and error count on success
      consecutiveErrorsRef.current = 0;
      setCurrentPollInterval(POLL_INTERVAL_MS);
    } catch (error_) {
      const errorMessage = error_ instanceof Error ? error_.message : 'Failed to fetch status';
      setError(errorMessage);
      setHealthData({ status: 'unhealthy' });

      // Exponential backoff on errors
      consecutiveErrorsRef.current += 1;
      const backoffInterval = Math.min(
        INITIAL_POLL_INTERVAL_MS * Math.pow(2, consecutiveErrorsRef.current - 1),
        MAX_POLL_INTERVAL_MS
      );
      setCurrentPollInterval(backoffInterval);
    } finally {
      setIsLoadingFalse();
    }
  }, [setIsLoadingTrue, setIsLoadingFalse]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Visibility API: Pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      // Fetch immediately when tab becomes visible
      if (isVisible) {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  // Optimized polling: 90 seconds (was 30s), pauses when tab is hidden
  useInterval(
    () => {
      fetchStatus();
    },
    isTabVisible ? currentPollInterval : null
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="bg-muted h-4 w-48 animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = healthData?.status ? mapApiStatusToComponentStatus(healthData.status) : 'offline';

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
          <CardDescription>Current health status of the API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Status status={status}>
              <StatusIndicator />
              <StatusLabel>
                {healthData?.status
                  ? healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)
                  : 'Unknown'}
              </StatusLabel>
            </Status>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {healthData ? (
        <div className="grid gap-3 md:grid-cols-2">
          {healthData.database ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm capitalize">{healthData.database}</p>
              </CardContent>
            </Card>
          ) : null}

          {healthData.version ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-mono text-sm">{healthData.version}</p>
              </CardContent>
            </Card>
          ) : null}

          {healthData.timestamp ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{formatDate(healthData.timestamp)}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
