'use client';

import type { Database } from '@heyclaude/database-types';
import { isValidCategory, logger, logUnhandledPromise } from '@heyclaude/web-runtime/core';
import { useCopyToClipboard, usePulse } from '@heyclaude/web-runtime/hooks';
import type { ContentItem } from '@heyclaude/web-runtime/types/component.types';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useCallback, useMemo } from 'react';

export interface DetailQuickAction {
  key: string;
  label: string;
  description?: string;
  onClick: () => void | Promise<void>;
}

interface UseDetailQuickActionsParams {
  item: ContentItem;
  metadata: Record<string, unknown>;
  packageName?: string | null;
  configurationObject?: Record<string, unknown> | null;
  mcpServers?: Record<string, unknown> | null;
}

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

  const pulseCategory = isValidCategory(item.category)
    ? (item.category as Database['public']['Enums']['content_category'])
    : null;
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

  const resolvedPackageName =
    packageName ??
    (typeof metadata['package'] === 'string' ? (metadata['package'] as string) : undefined);

  const resolvedMcpServers =
    mcpServers ??
    (metadata['mcpServers'] && typeof metadata['mcpServers'] === 'object'
      ? (metadata['mcpServers'] as Record<string, unknown>)
      : null);

  const resolvedConfigurationObject =
    configurationObject ??
    (metadata['configuration'] && typeof metadata['configuration'] === 'object'
      ? (metadata['configuration'] as Record<string, unknown>)
      : null);

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
            logger.error('DetailQuickActions: failed to copy pnpm command', error as Error);
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy pnpm command.',
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
            logger.error('DetailQuickActions: failed to copy MCP config', error as Error);
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy Claude Desktop configuration.',
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
            logger.error('DetailQuickActions: failed to copy configuration JSON', error as Error);
            toasts.raw.error('Copy failed', {
              description: 'Unable to copy configuration JSON.',
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
