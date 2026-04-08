"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { DirectoryEntryCard } from "@/components/directory-entry-card";
import { SearchBar } from "@/components/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
  const getEntryKey = (entry: ContentEntry) => `${entry.category}:${entry.slug}`;
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(limit ?? entries.length);
  const [clientId, setClientId] = useState("");
  const [votesAvailable, setVotesAvailable] = useState(true);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [popularSortSnapshot, setPopularSortSnapshot] = useState<Record<string, number>>({});
  const [votedByMe, setVotedByMe] = useState<Record<string, boolean>>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  useEffect(() => {
    const storageKey = "heyclaude-client-id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      setClientId(existing);
      return;
    }

    const generated = crypto.randomUUID();
    window.localStorage.setItem(storageKey, generated);
    setClientId(generated);
  }, []);

  useEffect(() => {
    const baseScores: Record<string, number> = {};
    for (const entry of entries) {
      const key = getEntryKey(entry);
      baseScores[key] = 0;
    }
    setPopularSortSnapshot(baseScores);
  }, [entries]);

  useEffect(() => {
    if (!clientId || !entries.length) return;
    const keys = entries.map(getEntryKey);
    let cancelled = false;

    const loadVotes = async () => {
      try {
        const response = await fetch("/api/votes/query", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            keys,
            clientId
          })
        });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          counts?: Record<string, number>;
          voted?: Record<string, boolean>;
          available?: boolean;
        };
        if (cancelled) return;

        setVotesAvailable(Boolean(payload.available));
        setVoteCounts(payload.counts ?? {});
        setVotedByMe(payload.voted ?? {});
        if (payload.available) {
          setPopularSortSnapshot(payload.counts ?? {});
        }
      } catch {
        setVotesAvailable(false);
      }
    };

    void loadVotes();
    return () => {
      cancelled = true;
    };
  }, [clientId, entries]);

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
      const rightKey = getEntryKey(right);
      const leftKey = getEntryKey(left);
      const rightVotes =
        popularSortSnapshot[rightKey] ?? 0;
      const leftVotes =
        popularSortSnapshot[leftKey] ?? 0;

      if (sortMode === "newest") {
        return String(right.dateAdded ?? "").localeCompare(String(left.dateAdded ?? ""));
      }
      if (sortMode === "title") {
        return left.title.localeCompare(right.title);
      }
      return rightVotes - leftVotes;
    });

    return sorted;
  }, [category, entries, limit, normalizedQuery, popularSortSnapshot, sortMode]);

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

  const handleToggleVote = async (entry: ContentEntry, nextVote: boolean) => {
    const key = getEntryKey(entry);
    let effectiveClientId = clientId;
    if (!effectiveClientId) {
      effectiveClientId = window.localStorage.getItem("heyclaude-client-id") ?? crypto.randomUUID();
      window.localStorage.setItem("heyclaude-client-id", effectiveClientId);
      setClientId(effectiveClientId);
    }

    const previousCount = votesAvailable ? (voteCounts[key] ?? 0) : 0;
    const previousVoted = votedByMe[key] ?? false;
    const optimisticCount = Math.max(0, previousCount + (nextVote ? 1 : -1));

    setVoteCounts((current) => ({ ...current, [key]: optimisticCount }));
    setVotedByMe((current) => ({ ...current, [key]: nextVote }));

    try {
      const response = await fetch("/api/votes/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key,
          clientId: effectiveClientId,
          vote: nextVote
        })
      });

      if (!response.ok) {
        throw new Error(`toggle failed with ${response.status}`);
      }

      const payload = (await response.json()) as {
        count: number;
        voted: boolean;
      };

      setVoteCounts((current) => ({ ...current, [key]: Number(payload.count ?? 0) }));
      setVotedByMe((current) => ({ ...current, [key]: Boolean(payload.voted) }));
      window.dispatchEvent(new CustomEvent("heyclaude:intent", { detail: { type: "vote" } }));

      return {
        count: Number(payload.count ?? 0),
        voted: Boolean(payload.voted)
      };
    } catch {
      setVoteCounts((current) => ({ ...current, [key]: previousCount }));
      setVotedByMe((current) => ({ ...current, [key]: previousVoted }));
      return {
        count: previousCount,
        voted: previousVoted
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="hero-search">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search tools, agents, skills, authors..."
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger
            aria-label="Category"
            className="directory-select-trigger"
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="directory-select-content">
            <SelectItem value="all">All Categories</SelectItem>
            {siteConfig.categoryOrder.map((item) => (
              <SelectItem key={item} value={item}>
                {categoryLabels[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortMode} onValueChange={setSortMode}>
          <SelectTrigger
            aria-label="Sort"
            className="directory-select-trigger"
          >
            <SelectValue placeholder="Most Popular" />
          </SelectTrigger>
          <SelectContent className="directory-select-content">
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="title">A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>{filteredEntries.length} results found</p>
        {normalizedQuery ? <p>Filtering for “{deferredQuery}”</p> : null}
      </div>

      <div className="space-y-4">
        {displayedEntries.map((entry) => (
          <DirectoryEntryCard
            key={`${entry.category}-${entry.slug}`}
            entry={entry}
            voteCount={
              votesAvailable ? (voteCounts[getEntryKey(entry)] ?? 0) : 0
            }
            hasVoted={votedByMe[getEntryKey(entry)] ?? false}
            onToggleVote={handleToggleVote}
          />
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
