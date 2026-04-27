"use client";

import { useEffect, useRef } from "react";

type UseBrowseUrlSyncParams = {
  enabled: boolean;
  query: string;
  category: string;
  utilityFilter: string;
  platformFilter: string;
  sortMode: string;
  normalizeCategory: (value?: string) => string;
  normalizeUtilityFilter: (value?: string) => string;
  normalizePlatformFilter: (value?: string) => string;
  normalizeSortMode: (value?: string) => string;
  setQuery: (value: string) => void;
  setCategory: (value: string) => void;
  setUtilityFilter: (value: string) => void;
  setPlatformFilter: (value: string) => void;
  setSortMode: (value: string) => void;
};

export function useBrowseUrlSync(params: UseBrowseUrlSyncParams) {
  const {
    enabled,
    query,
    category,
    utilityFilter,
    platformFilter,
    sortMode,
    normalizeCategory,
    normalizeUtilityFilter,
    normalizePlatformFilter,
    normalizeSortMode,
    setQuery,
    setCategory,
    setUtilityFilter,
    setPlatformFilter,
    setSortMode,
  } = params;
  const hasHydratedUrlState = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const urlParams = new URLSearchParams(window.location.search);
    const nextQuery = urlParams.get("q");
    const nextCategory = normalizeCategory(
      urlParams.get("category") ?? undefined,
    );
    const nextUtility = normalizeUtilityFilter(
      urlParams.get("utility") ?? undefined,
    );
    const nextPlatform = normalizePlatformFilter(
      urlParams.get("platform") ?? undefined,
    );
    const nextSort = normalizeSortMode(urlParams.get("sort") ?? undefined);

    if (nextQuery !== null) setQuery(nextQuery);
    setCategory(nextCategory);
    setUtilityFilter(nextUtility);
    setPlatformFilter(nextPlatform);
    setSortMode(nextSort);
    hasHydratedUrlState.current = true;
  }, [
    enabled,
    normalizeCategory,
    normalizePlatformFilter,
    normalizeSortMode,
    normalizeUtilityFilter,
    setCategory,
    setPlatformFilter,
    setQuery,
    setSortMode,
    setUtilityFilter,
  ]);

  useEffect(() => {
    if (!enabled || !hasHydratedUrlState.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const normalized = query.trim();

    if (normalized) {
      urlParams.set("q", normalized);
    } else {
      urlParams.delete("q");
    }

    if (category !== "all") {
      urlParams.set("category", category);
    } else {
      urlParams.delete("category");
    }

    if (utilityFilter !== "all") {
      urlParams.set("utility", utilityFilter);
    } else {
      urlParams.delete("utility");
    }

    if (platformFilter !== "all") {
      urlParams.set("platform", platformFilter);
    } else {
      urlParams.delete("platform");
    }

    if (sortMode !== "popular") {
      urlParams.set("sort", sortMode);
    } else {
      urlParams.delete("sort");
    }

    const search = urlParams.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [category, enabled, platformFilter, query, sortMode, utilityFilter]);
}
