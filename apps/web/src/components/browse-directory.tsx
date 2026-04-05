"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { ContentCard } from "@/components/content-card";
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
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"popular" | "newest" | "title">(
    "popular"
  );
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    const matched = entries.filter((entry) => {
      if (activeCategory !== "all" && entry.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        entry.title,
        entry.description,
        entry.author,
        categoryLabels[entry.category],
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
        return String(right.dateAdded ?? "").localeCompare(
          String(left.dateAdded ?? "")
        );
      }

      if (sortMode === "title") {
        return left.title.localeCompare(right.title);
      }

      return (right.popularityScore ?? 0) - (left.popularityScore ?? 0);
    });

    return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  }, [activeCategory, entries, limit, normalizedQuery, sortMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search tools, agents, skills, authors..."
          className="flex-1"
        />
        <select
          aria-label="Filter by category"
          value={activeCategory}
          onChange={(event) => setActiveCategory(event.target.value)}
          className="directory-select"
        >
          <option value="all">All Categories</option>
          {siteConfig.categoryOrder.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort entries by"
          value={sortMode}
          onChange={(event) =>
            setSortMode(event.target.value as "popular" | "newest" | "title")
          }
          className="directory-select"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="title">A-Z</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {filteredEntries.length} result{filteredEntries.length === 1 ? "" : "s"}
        </p>
        {normalizedQuery ? (
          <p className="text-sm text-[var(--muted)]">
            Filtering for <span className="text-[var(--ink)]">“{deferredQuery}”</span>
          </p>
        ) : activeCategory !== "all" ? (
          <p className="text-sm text-[var(--muted)]">
            Showing only{" "}
            <span className="text-[var(--ink)]">{categoryLabels[activeCategory]}</span>
          </p>
        ) : null}
      </div>
      <div className="space-y-4">
        {filteredEntries.length ? (
          filteredEntries.map((entry) => (
            <ContentCard key={`${entry.category}-${entry.slug}`} entry={entry} />
          ))
        ) : (
          <div className="panel rounded-[1.75rem] p-8 text-sm leading-7 text-[var(--muted)]">
            No entries matched that search. Try a category name, tag, author, or
            broader keyword.
          </div>
        )}
      </div>
    </div>
  );
}
