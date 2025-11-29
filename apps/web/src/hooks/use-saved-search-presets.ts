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

import { logClientWarning, logger, normalizeError } from '@heyclaude/web-runtime/core';
import type { FilterState, SavedSearchPreset } from '@heyclaude/web-runtime/types/component.types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_PREFIX = 'saved-search-presets:v1:';
const PRESET_LIMIT = 5;
const WRITE_DEBOUNCE_MS = 200;

export interface SavePresetPayload {
  label: string;
  query: string;
  filters: FilterState;
}

export interface UseSavedSearchPresetsOptions {
  pathname?: string | null;
  /**
   * Optional flag to skip initial localStorage read (mainly for tests).
   */
  disableStorage?: boolean;
}

export interface UseSavedSearchPresetsReturn {
  presets: SavedSearchPreset[];
  isLoaded: boolean;
  isAtLimit: boolean;
  savePreset: (payload: SavePresetPayload) => SavedSearchPreset | null;
  applyPreset: (presetId: string) => SavedSearchPreset | null;
  removePreset: (presetId: string) => void;
  clearPresets: () => void;
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
  const writeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          window.localStorage.setItem(storageKey, JSON.stringify(nextPresets));
        } catch (error) {
          logClientWarning('useSavedSearchPresets: failed to persist presets', error);
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
    (payload: SavePresetPayload): SavedSearchPreset | null => {
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

      let savedPreset: SavedSearchPreset | null = null;
      updatePresets((current) => {
        const existingIndex = current.findIndex(
          (preset) => buildPresetFingerprint(preset.query, preset.filters) === fingerprint
        );

        const normalizedList = [...current];

        if (existingIndex >= 0) {
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
    (presetId: string): SavedSearchPreset | null => {
      const target = presets.find((preset) => preset.id === presetId);
      if (!target) {
        return null;
      }

      updatePresets((current) => {
        const index = current.findIndex((preset) => preset.id === presetId);
        if (index < 0) {
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
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        logClientWarning('useSavedSearchPresets: failed to clear presets', error);
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
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const testKey = '__preset_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function loadFromStorage(key: string): SavedSearchPreset[] {
  if (!isStorageAvailable()) return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedSearchPreset[];
    if (!Array.isArray(parsed)) {
      logger.warn('useSavedSearchPresets: invalid preset payload');
      return [];
    }

    return enforcePresetLimit(
      parsed
        .map((preset) => sanitizePresetFromStorage(preset))
        .filter((preset): preset is SavedSearchPreset => preset !== null)
    );
  } catch (error) {
    logger.error(
      'useSavedSearchPresets: failed to parse stored presets',
      normalizeError(error, 'Failed to parse stored presets')
    );
    return [];
  }
}

function sanitizePresetFromStorage(
  entry: SavedSearchPreset | Record<string, unknown>
): SavedSearchPreset | null {
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
    const normalizedTags = Array.from(
      new Set(
        filters.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
          .filter((tag): tag is string => tag.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
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
