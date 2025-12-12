'use client';

/**
 * Saved Search Presets Hook
 *
 * Client-only state manager for persisting search presets per pathname.
 * - Stores presets in localStorage with debounced writes.
 * - Enforces a hard cap on preset count (≤5).
 * - Provides helpers to save, apply (reorder), and remove presets.
 * - Guards against SSR/localStorage absence to avoid hydration issues.
 */

import { logClientError, logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  type FilterState,
  type SavedSearchPreset,
} from '@heyclaude/web-runtime/types/component.types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_PREFIX = 'saved-search-presets:v1:';
const PRESET_LIMIT = 5;
const WRITE_DEBOUNCE_MS = 200;

export interface SavePresetPayload {
  filters: FilterState;
  label: string;
  query: string;
}

export interface UseSavedSearchPresetsOptions {
  /**
   * Optional flag to skip initial localStorage read (mainly for tests).
   */
  disableStorage?: boolean;
  pathname?: null | string;
}

export interface UseSavedSearchPresetsReturn {
  applyPreset: (presetId: string) => null | SavedSearchPreset;
  clearPresets: () => void;
  isAtLimit: boolean;
  isLoaded: boolean;
  presets: SavedSearchPreset[];
  removePreset: (presetId: string) => void;
  savePreset: (payload: SavePresetPayload) => null | SavedSearchPreset;
}

type PresetFingerprint = string;

export function useSavedSearchPresets({
  pathname,
  disableStorage = false,
}: UseSavedSearchPresetsOptions = {}): UseSavedSearchPresetsReturn {
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}${pathname && pathname.length > 0 ? pathname : 'global'}`,
    [pathname]
  );

  const canUseStorage = useMemo(() => !disableStorage && isStorageAvailable(), [disableStorage]);
  const writeTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  const [presets, setPresets] = useState<SavedSearchPreset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Bootstrap from localStorage on mount (client-only)
  useEffect(() => {
    if (!canUseStorage || isLoaded) return;

    const stored = loadFromStorage(storageKey);
    if (stored.length > 0) {
      setPresets(stored);
    }
    setIsLoaded(true);
  }, [canUseStorage, isLoaded, storageKey]);

  // Cleanup pending debounced writes
  useEffect(() => {
    return () => {
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
    };
  }, []);

  const schedulePersist = useCallback(
    (nextPresets: SavedSearchPreset[]) => {
      if (!canUseStorage) return;
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
      }
      writeTimeoutRef.current = setTimeout(() => {
        try {
          globalThis.localStorage.setItem(storageKey, JSON.stringify(nextPresets));
        } catch (error) {
          const normalized = normalizeError(error, 'Failed to persist presets');
          logClientWarn(
            '[Storage] Failed to persist presets',
            normalized,
            'useSavedSearchPresets.schedulePersist',
            {
              component: 'useSavedSearchPresets',
              action: 'persist-presets',
              category: 'storage',
              storageKey,
            }
          );
        }
        writeTimeoutRef.current = null;
      }, WRITE_DEBOUNCE_MS);
    },
    [canUseStorage, storageKey]
  );

  const updatePresets = useCallback(
    (updater: (current: SavedSearchPreset[]) => SavedSearchPreset[]) => {
      setPresets((current) => {
        const next = updater(current);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist]
  );

  const savePreset = useCallback(
    (payload: SavePresetPayload): null | SavedSearchPreset => {
      const label = payload.label?.trim();
      const sanitizedQuery = (payload.query ?? '').trim().slice(0, 200);
      const sanitizedFilters = sanitizeFilters(payload.filters);
      const hasQuery = sanitizedQuery.length > 0;
      const hasFilters = hasPresetFilters(sanitizedFilters);
      if (!(label && (hasQuery || hasFilters))) {
        return null;
      }

      const fingerprint = buildPresetFingerprint(sanitizedQuery, sanitizedFilters);
      const createdAt = Date.now();

      let savedPreset: null | SavedSearchPreset = null;
      updatePresets((current) => {
        const existingIndex = current.findIndex(
          (preset) => buildPresetFingerprint(preset.query, preset.filters) === fingerprint
        );

        const normalizedList = [...current];

        if (existingIndex !== -1) {
          const existing = normalizedList[existingIndex];
          if (!existing) {
            // Should never happen, but TypeScript safety check
            return current;
          }
          const updatedPreset: SavedSearchPreset = {
            ...existing,
            label,
            query: sanitizedQuery,
            filters: sanitizedFilters,
            createdAt,
          };
          savedPreset = updatedPreset;
          normalizedList.splice(existingIndex, 1);
          return enforcePresetLimit([updatedPreset, ...normalizedList]);
        }

        if (normalizedList.length >= PRESET_LIMIT) {
          normalizedList.pop();
        }

        const newPreset: SavedSearchPreset = {
          id: generatePresetId(),
          label,
          query: sanitizedQuery,
          filters: sanitizedFilters,
          createdAt,
        };

        savedPreset = newPreset;
        return enforcePresetLimit([newPreset, ...normalizedList]);
      });

      return savedPreset;
    },
    [updatePresets]
  );

  const applyPreset = useCallback(
    (presetId: string): null | SavedSearchPreset => {
      const target = presets.find((preset) => preset.id === presetId);
      if (!target) {
        return null;
      }

      updatePresets((current) => {
        const index = current.findIndex((preset) => preset.id === presetId);
        if (index === -1) {
          return current;
        }
        const reordered = [...current];
        const [selected] = reordered.splice(index, 1);
        if (!selected) {
          return current;
        }
        return [selected, ...reordered];
      });

      return target;
    },
    [presets, updatePresets]
  );

  const removePreset = useCallback(
    (presetId: string) => {
      updatePresets((current) => current.filter((preset) => preset.id !== presetId));
    },
    [updatePresets]
  );

  const clearPresets = useCallback(() => {
    setPresets([]);
    if (canUseStorage) {
      try {
        globalThis.localStorage.removeItem(storageKey);
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to clear presets');
        logClientWarn(
          '[Storage] Failed to clear presets',
          normalized,
          'useSavedSearchPresets.clearPresets',
          {
            component: 'useSavedSearchPresets',
            action: 'clear-presets',
            category: 'storage',
            storageKey,
          }
        );
      }
    }
  }, [canUseStorage, storageKey]);

  return {
    presets,
    isLoaded,
    isAtLimit: presets.length >= PRESET_LIMIT,
    savePreset,
    applyPreset,
    removePreset,
    clearPresets,
  };
}

// =============================================================================
// Helpers
// =============================================================================

function isStorageAvailable(): boolean {
  if (globalThis.window === undefined || !globalThis.localStorage) {
    return false;
  }

  try {
    const testKey = '__preset_test__';
    globalThis.localStorage.setItem(testKey, testKey);
    globalThis.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function loadFromStorage(key: string): SavedSearchPreset[] {
  if (!isStorageAvailable()) return [];

  try {
    const raw = globalThis.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedSearchPreset[];
    if (!Array.isArray(parsed)) {
      logClientWarn(
        'useSavedSearchPresets: invalid preset payload',
        undefined,
        'useSavedSearchPresets.readPresets',
        {
          component: 'useSavedSearchPresets',
          action: 'read-presets',
        }
      );
      return [];
    }

    return enforcePresetLimit(
      parsed
        .map((preset) => sanitizePresetFromStorage(preset))
        .filter((preset): preset is SavedSearchPreset => preset !== null)
    );
  } catch (error) {
    logClientError(
      'useSavedSearchPresets: failed to parse stored presets',
      normalizeError(error, 'Failed to parse stored presets'),
      'useSavedSearchPresets.readPresets',
      {
        component: 'useSavedSearchPresets',
        action: 'read-presets',
      }
    );
    return [];
  }
}

function sanitizePresetFromStorage(
  entry: Record<string, unknown> | SavedSearchPreset
): null | SavedSearchPreset {
  if (!entry || typeof entry !== 'object') return null;

  const label = typeof entry.label === 'string' ? entry.label.trim() : '';
  const query = typeof entry.query === 'string' ? entry.query.trim().slice(0, 200) : '';
  const createdAt =
    typeof entry.createdAt === 'number' && Number.isFinite(entry.createdAt)
      ? entry.createdAt
      : Date.now();
  const id = typeof entry.id === 'string' && entry.id.length > 0 ? entry.id : generatePresetId();
  const filters = sanitizeFilters((entry as { filters?: FilterState }).filters ?? {});
  const hasQuery = query.length > 0;
  const hasFilters = hasPresetFilters(filters);

  if (!(label && (hasQuery || hasFilters))) {
    return null;
  }

  return {
    id,
    label,
    query,
    filters,
    createdAt,
  };
}

function sanitizeFilters(filters: FilterState = {}): FilterState {
  const sanitized: FilterState = {};

  if (filters.sort) sanitized.sort = filters.sort;
  if (filters.category) sanitized.category = filters.category;
  if (filters.author && filters.author.trim().length > 0) {
    sanitized.author = filters.author.trim();
  }
  if (filters.dateRange) sanitized.dateRange = filters.dateRange;
  if (filters.popularity) sanitized.popularity = [...filters.popularity];
  if (Array.isArray(filters.tags) && filters.tags.length > 0) {
    const normalizedTags = [
      ...new Set(
        filters.tags
          .map((tag: string) => (typeof tag === 'string' ? tag.trim() : ''))
          .filter((tag: string): tag is string => tag.length > 0)
      ),
    ].sort((a: string, b: string) => a.localeCompare(b));
    if (normalizedTags.length > 0) {
      sanitized.tags = normalizedTags;
    }
  }

  return sanitized;
}

function enforcePresetLimit(presets: SavedSearchPreset[]): SavedSearchPreset[] {
  if (presets.length <= PRESET_LIMIT) {
    return presets;
  }
  return presets.slice(0, PRESET_LIMIT);
}

function generatePresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildPresetFingerprint(query: string, filters: FilterState): PresetFingerprint {
  return JSON.stringify({ query, filters });
}

function hasPresetFilters(filters: FilterState = {}): boolean {
  return Boolean(
    filters.category ||
    filters.author ||
    filters.dateRange ||
    (filters.tags && filters.tags.length > 0) ||
    filters.popularity ||
    (filters.sort && filters.sort !== ('trending' as FilterState['sort']))
  );
}
