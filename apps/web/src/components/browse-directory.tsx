"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { DirectoryEntryCard } from "@/components/directory-entry-card";
import { SearchBar } from "@/components/search-bar";
import type { ContentEntry } from "@/lib/content";
import { categoryLabels, siteConfig } from "@/lib/site";

type BrowseDirectoryProps = {
  entries: ContentEntry[];
  initialQuery?: string;
  limit?: number;
};

export function BrowseDirectory({
  entries,
  initialQuery = "",
  limit
}: BrowseDirectoryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(limit ?? entries.length);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    const matched = entries.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        entry.title,
        entry.description,
        entry.author,
        ...entry.tags,
        ...entry.keywords
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    const sorted = [...matched].sort((left, right) => {
      if (sortMode === "newest") {
        return String(right.dateAdded ?? "").localeCompare(String(left.dateAdded ?? ""));
      }
      if (sortMode === "title") {
        return left.title.localeCompare(right.title);
      }
      return (right.popularityScore ?? 0) - (left.popularityScore ?? 0);
    });

    return sorted;
  }, [category, entries, limit, normalizedQuery, sortMode]);

  useEffect(() => {
    setVisibleCount(limit ?? filteredEntries.length);
  }, [category, deferredQuery, filteredEntries.length, limit, sortMode]);

  useEffect(() => {
    if (!limit) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + limit, filteredEntries.length));
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filteredEntries.length, limit]);

  const displayedEntries = useMemo(() => {
    if (!limit) return filteredEntries;
    return filteredEntries.slice(0, visibleCount);
  }, [filteredEntries, limit, visibleCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search tools, agents, skills, authors..."
        />
        <div className="directory-select-wrap">
          <select
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="directory-select"
          >
            <option value="all">All Categories</option>
            {siteConfig.categoryOrder.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </select>
          <span className="directory-select-icon-wrap">
            <ChevronDown className="directory-select-icon" />
          </span>
        </div>
        <div className="directory-select-wrap">
          <select
            aria-label="Sort"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
            className="directory-select"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="title">A-Z</option>
          </select>
          <span className="directory-select-icon-wrap">
            <ChevronDown className="directory-select-icon" />
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>{filteredEntries.length} results found</p>
        {normalizedQuery ? <p>Filtering for “{deferredQuery}”</p> : null}
      </div>

      <div className="space-y-4">
        {displayedEntries.map((entry) => (
          <DirectoryEntryCard key={`${entry.category}-${entry.slug}`} entry={entry} />
        ))}

        {filteredEntries.length === 0 ? (
          <div className="surface-panel p-8 text-sm text-muted-foreground">
            No entries matched that search.
          </div>
        ) : null}

        {limit && displayedEntries.length < filteredEntries.length ? (
          <div ref={loadMoreRef} className="py-4 text-center text-sm text-muted-foreground">
            Loading more entries...
          </div>
        ) : null}
      </div>
    </div>
  );
}
