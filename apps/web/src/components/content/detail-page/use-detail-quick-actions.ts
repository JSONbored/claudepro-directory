'use client';

import { isValidCategory, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { useCopyToClipboard, usePulse } from '@heyclaude/web-runtime/hooks';
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useCallback, useMemo } from 'react';

export interface DetailQuickAction {
  description?: string;
  key: string;
  label: string;
  onClick: () => Promise<void> | void;
}

interface UseDetailQuickActionsParams {
  configurationObject?: null | Record<string, unknown>;
  item: ContentItem;
  mcpServers?: null | Record<string, unknown>;
  metadata: Record<string, unknown>;
  packageName?: null | string;
}

/**
 * Builds an array of quick-action descriptors for a content detail view based on the provided item and metadata.
 *
 * @param {UseDetailQuickActionsParams} params - Parameters object
 * @param {ContentItem} params.item - The content item used to derive category and slug for telemetry and to decide available actions
 * @param {Record<string, unknown>} params.metadata - Metadata associated with the item; may contain keys `package`, `mcpServers`, and `configuration` used to generate actions
 * @param {string | null | undefined} params.packageName - Optional explicit package name to use for an install command; overrides `metadata['package']` when provided
 * @param {Record<string, unknown> | null | undefined} params.configurationObject - Optional explicit configuration object to copy; used when `mcpServers` is not provided and overrides `metadata.configuration`
 * @param {Record<string, unknown> | null | undefined} params.mcpServers - Optional explicit MCP servers object to copy; overrides `metadata.mcpServers` when provided
 * @returns {DetailQuickAction[]} An array of DetailQuickAction objects representing available copy actions (e.g., pnpm install command, Claude Desktop MCP config, or configuration JSON)
 */
export function useDetailQuickActions({
  item,
  metadata,
  packageName,
  configurationObject,
  mcpServers,
}: UseDetailQuickActionsParams): DetailQuickAction[] {
  const pulse = usePulse();
  const { copy: copyToClipboard } = useCopyToClipboard({
    context: {
      component: 'detail-quick-actions',
      action: 'copy',
    },
  });

  const pulseCategory = isValidCategory(item.category) ? item.category : null;
  const contentSlug = typeof item.slug === 'string' ? item.slug : null;

  const trackCopyPulse = useCallback(
    (metadataOverride?: Record<string, unknown>) => {
      if (!(pulseCategory && contentSlug)) return;
      pulse
        .copy({
          category: pulseCategory,
          slug: contentSlug,
          ...(metadataOverride ? { metadata: metadataOverride } : {}),
        })
        .catch((error) => {
          logUnhandledPromise('DetailQuickActions: pulse.copy failed', error, {
            category: item.category ?? 'null',
            slug: contentSlug ?? 'null',
          });
        });
    },
    [contentSlug, pulse, pulseCategory, item.category]
  );

  // Treat undefined as "use metadata", null as "force-disable"
  const resolvedPackageName =
    packageName === null
      ? null
      : packageName !== undefined
        ? packageName
        : typeof metadata['package'] === 'string'
          ? metadata['package']
          : undefined;

  const resolvedMcpServers =
    mcpServers === null
      ? null
      : mcpServers !== undefined
        ? mcpServers
        : metadata['mcpServers'] && typeof metadata['mcpServers'] === 'object'
          ? (metadata['mcpServers'] as Record<string, unknown>)
          : null;

  const resolvedConfigurationObject =
    configurationObject === null
      ? null
      : configurationObject !== undefined
        ? configurationObject
        : metadata['configuration'] && typeof metadata['configuration'] === 'object'
          ? (metadata['configuration'] as Record<string, unknown>)
          : null;

  return useMemo<DetailQuickAction[]>(() => {
    const actions: DetailQuickAction[] = [];

    if (resolvedPackageName) {
      const pnpmCommand = `pnpm add ${resolvedPackageName}`;
      actions.push({
        key: 'pnpm-install',
        label: `Copy “${pnpmCommand}”`,
        description: 'Paste into your terminal to install this package',
        onClick: async () => {
          try {
            await copyToClipboard(pnpmCommand);
            toasts.raw.success('Install command copied', {
              description: pnpmCommand,
            });
            trackCopyPulse({ action: 'copy_install', manager: 'pnpm' });
          } catch (error) {
            const normalized = normalizeError(error, 'Copy pnpm command failed');
            logClientWarn(
              '[Clipboard] Copy pnpm command failed',
              normalized,
              'useDetailQuickActions.copyPnpmCommand',
              {
                component: 'useDetailQuickActions',
                action: 'copy-pnpm-command',
                category: 'clipboard',
                recoverable: true,
                userRetryable: true,
              }
            );
            // Show error toast with "Retry" button
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy pnpm command.',
              action: {
                label: 'Retry',
                onClick: async () => {
                  try {
                    await copyToClipboard(pnpmCommand);
                    toasts.raw.success('Install command copied', {
                      description: pnpmCommand,
                    });
                    trackCopyPulse({ action: 'copy_install', manager: 'pnpm' });
                  } catch (retryError) {
                    // Error will be handled by the toast above if it fails again
                  }
                },
              },
            });
          }
        },
      });
    }

    if (resolvedMcpServers) {
      actions.push({
        key: 'copy-mcp-config',
        label: 'Copy Claude Desktop config',
        description: 'Adds this MCP server to Claude Desktop settings',
        onClick: async () => {
          try {
            await copyToClipboard(JSON.stringify({ mcpServers: resolvedMcpServers }, null, 2));
            toasts.raw.success('Claude config copied', {
              description: 'Paste into Claude Desktop → Settings → MCP Servers.',
            });
            trackCopyPulse({ action: 'copy_mcp_config' });
          } catch (error) {
            const normalized = normalizeError(error, 'Copy MCP config failed');
            logClientWarn(
              '[Clipboard] Copy MCP config failed',
              normalized,
              'useDetailQuickActions.copyMcpConfig',
              {
                component: 'useDetailQuickActions',
                action: 'copy-mcp-config',
                category: 'clipboard',
                recoverable: true,
                userRetryable: true,
              }
            );
            // Show error toast with "Retry" button
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy Claude Desktop configuration.',
              action: {
                label: 'Retry',
                onClick: async () => {
                  try {
                    await copyToClipboard(JSON.stringify({ mcpServers: resolvedMcpServers }, null, 2));
                    toasts.raw.success('Claude config copied', {
                      description: 'Paste into Claude Desktop → Settings → MCP Servers.',
                    });
                    trackCopyPulse({ action: 'copy_mcp_config' });
                  } catch (retryError) {
                    // Error will be handled by the toast above if it fails again
                  }
                },
              },
            });
          }
        },
      });
    }

    if (resolvedConfigurationObject && !resolvedMcpServers) {
      actions.push({
        key: 'copy-config-json',
        label: 'Copy configuration JSON',
        description: 'Use this configuration in your own project',
        onClick: async () => {
          try {
            await copyToClipboard(JSON.stringify(resolvedConfigurationObject, null, 2));
            toasts.raw.success('Configuration copied', {
              description: 'JSON configuration saved to your clipboard.',
            });
            trackCopyPulse({ action: 'copy_configuration' });
          } catch (error) {
            const normalized = normalizeError(error, 'Copy configuration failed');
            logClientWarn(
              '[Clipboard] Copy configuration failed',
              normalized,
              'useDetailQuickActions.copyConfiguration',
              {
                component: 'useDetailQuickActions',
                action: 'copy-configuration',
                category: 'clipboard',
                recoverable: true,
                userRetryable: true,
              }
            );
            // Show error toast with "Retry" button
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy configuration JSON.',
              action: {
                label: 'Retry',
                onClick: async () => {
                  try {
                    await copyToClipboard(JSON.stringify(resolvedConfigurationObject, null, 2));
                    toasts.raw.success('Configuration copied', {
                      description: 'JSON configuration saved to your clipboard.',
                    });
                    trackCopyPulse({ action: 'copy_configuration' });
                  } catch (retryError) {
                    // Error will be handled by the toast above if it fails again
                  }
                },
              },
            });
          }
        },
      });
    }

    return actions;
  }, [
    resolvedPackageName,
    resolvedMcpServers,
    resolvedConfigurationObject,
    copyToClipboard,
    trackCopyPulse,
  ]);
}