/**
 * BetterStack API Client
 * 
 * Programmatic creation and management of BetterStack monitors.
 * Uses BETTERSTACK_API_TOKEN for authentication.
 * 
 * @module web-runtime/inngest/utils/betterstack-api
 */

import { getEnvVar } from '@heyclaude/shared-runtime';
import { logger, normalizeError } from '../../logging/server';

const BETTERSTACK_API_BASE = 'https://uptime.betterstack.com/api/v2';

interface HeartbeatMonitorConfig {
  name: string;
  period: number; // seconds (minimum: 30)
  grace: number; // seconds (minimum: 0, recommended: ~20% of period)
  team_name?: string;
  paused?: boolean;
  email?: boolean;
  sms?: boolean;
  call?: boolean;
  push?: boolean;
  critical_alert?: boolean;
  team_wait?: number; // seconds before escalating
  policy_id?: string | null;
}

interface HeartbeatMonitorResponse {
  id: string;
  heartbeat_url: string;
  name: string;
}

/**
 * Create a BetterStack heartbeat monitor via API
 * 
 * @param config - Monitor configuration
 * @returns Monitor ID and heartbeat URL, or null if creation failed
 */
export async function createHeartbeatMonitor(
  config: HeartbeatMonitorConfig
): Promise<HeartbeatMonitorResponse | null> {
  const apiToken = getEnvVar('BETTERSTACK_API_TOKEN');
  if (!apiToken) {
    logger.warn({ envVarName: 'BETTERSTACK_API_TOKEN' }, 'BETTERSTACK_API_TOKEN not set, skipping monitor creation');
    return null;
  }

  try {
    const response = await fetch(`${BETTERSTACK_API_BASE}/heartbeats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        period: config.period,
        grace: config.grace,
        ...(config.team_name && { team_name: config.team_name }),
        paused: config.paused ?? false,
        email: config.email ?? true,
        sms: config.sms ?? false,
        call: config.call ?? false,
        push: config.push ?? true,
        critical_alert: config.critical_alert ?? false,
        ...(config.team_wait && { team_wait: config.team_wait }),
        ...(config.policy_id !== undefined && { policy_id: config.policy_id }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          monitorName: config.name,
        },
        'BetterStack API error creating heartbeat monitor'
      );
      return null;
    }

    const data = await response.json();
    const monitor = data.data;

    if (!monitor?.attributes?.url || !monitor?.id) {
      logger.error(
        {
          monitorId: monitor?.id || 'missing',
          hasUrl: !!monitor?.attributes?.url,
        },
        'BetterStack API returned invalid monitor response'
      );
      return null;
    }

    logger.info(
      {
        monitorId: monitor.id,
        monitorName: config.name,
        heartbeatUrl: monitor.attributes.url,
      },
      'BetterStack heartbeat monitor created successfully'
    );

    return {
      id: monitor.id,
      heartbeat_url: monitor.attributes.url,
      name: monitor.attributes.name || config.name,
    };
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to create BetterStack heartbeat monitor');
    logger.error(
      {
        err: normalized,
        monitorName: config.name,
      },
      'Failed to create BetterStack heartbeat monitor'
    );
    return null;
  }
}

/**
 * List all heartbeat monitors
 * 
 * @returns Array of monitor IDs and URLs, or null if fetch failed
 */
export async function listHeartbeatMonitors(): Promise<
  Array<{ id: string; name: string; url: string }> | null
> {
  const apiToken = getEnvVar('BETTERSTACK_API_TOKEN');
  if (!apiToken) {
    logger.warn({ envVarName: 'BETTERSTACK_API_TOKEN' }, 'BETTERSTACK_API_TOKEN not set, cannot list monitors');
    return null;
  }

  try {
    const response = await fetch(`${BETTERSTACK_API_BASE}/heartbeats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        },
        'BetterStack API error listing heartbeat monitors'
      );
      return null;
    }

    const data = await response.json();
    const monitors = data.data || [];

    return monitors.map((monitor: { id: string; attributes: { name: string; url: string } }) => ({
      id: String(monitor.id),
      name: String(monitor.attributes.name),
      url: String(monitor.attributes.url),
    }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to list BetterStack heartbeat monitors');
    logger.error({ err: normalized }, 'Failed to list BetterStack heartbeat monitors');
    return null;
  }
}

/**
 * Delete a heartbeat monitor
 * 
 * @param monitorId - Monitor ID to delete
 * @returns true if deleted successfully, false otherwise
 */
export async function deleteHeartbeatMonitor(monitorId: string): Promise<boolean> {
  const apiToken = getEnvVar('BETTERSTACK_API_TOKEN');
  if (!apiToken) {
    logger.warn({ envVarName: 'BETTERSTACK_API_TOKEN' }, 'BETTERSTACK_API_TOKEN not set, cannot delete monitor');
    return false;
  }

  try {
    const response = await fetch(`${BETTERSTACK_API_BASE}/heartbeats/${monitorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          monitorId,
        },
        'BetterStack API error deleting heartbeat monitor'
      );
      return false;
    }

    logger.info({ monitorId: String(monitorId) }, 'BetterStack heartbeat monitor deleted successfully');
    return true;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to delete BetterStack heartbeat monitor');
    logger.error({ err: normalized, monitorId: String(monitorId) }, 'Failed to delete BetterStack heartbeat monitor');
    return false;
  }
}
