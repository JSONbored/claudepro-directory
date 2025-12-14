/**
 * Status Page Content
 *
 * Client component that fetches and displays API status.
 */

'use client';

import { useBoolean, useInterval } from '@heyclaude/web-runtime/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';

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

export function StatusPageContent() {
  const [healthData, setHealthData] = useState<ApiHealthData | null>(null);
  const {
    setFalse: setIsLoadingFalse,
    setTrue: setIsLoadingTrue,
    value: isLoading,
  } = useBoolean(true);
  const [error, setError] = useState<null | string>(null);

  const fetchStatus = async () => {
    try {
      setIsLoadingTrue();
      const response = await fetch('/api/status');
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to fetch status');
      setHealthData({ status: 'unhealthy' });
    } finally {
      setIsLoadingFalse();
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [setIsLoadingTrue, setIsLoadingFalse]);

  // Refresh every 30 seconds
  useInterval(() => {
    fetchStatus();
  }, 30_000);

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
          <div className="flex items-center gap-4">
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
        <div className="grid gap-4 md:grid-cols-2">
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
                <p className="text-muted-foreground text-sm">
                  {new Date(healthData.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
