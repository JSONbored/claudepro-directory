import {
  Action,
  ActionPanel,
  Cache,
  Color,
  Icon,
  List,
  LocalStorage,
  Toast,
  showToast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";

const FEED_URL = "https://heyclau.de/data/raycast-index.json";
const CACHE_KEY = "heyclaude-raycast-index";
const FAVORITES_KEY = "favorite-entry-keys";

type DownloadTrust = "first-party" | "external" | null;

type RaycastEntry = {
  category: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  installCommand: string;
  configSnippet: string;
  copyText: string;
  detailMarkdown: string;
  webUrl: string;
  repoUrl: string;
  documentationUrl: string;
  downloadTrust: DownloadTrust;
  verificationStatus: string;
};

type CategoryOption = {
  value: string;
  title: string;
};

const cache = new Cache();

const categoryLabels: Record<string, string> = {
  agents: "Agents",
  mcp: "MCP Servers",
  skills: "Skills",
  rules: "Rules",
  commands: "Commands",
  hooks: "Hooks",
  guides: "Guides",
  collections: "Collections",
  statuslines: "Statuslines",
};

const categoryIcons: Record<string, Icon> = {
  agents: Icon.Person,
  mcp: Icon.Network,
  skills: Icon.Hammer,
  rules: Icon.TextDocument,
  commands: Icon.Terminal,
  hooks: Icon.Bolt,
  guides: Icon.Book,
  collections: Icon.Folder,
  statuslines: Icon.BarChart,
};

function entryKey(entry: RaycastEntry) {
  return `${entry.category}:${entry.slug}`;
}

function categoryLabel(category: string) {
  return categoryLabels[category] ?? category;
}

function parseEntries(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isRaycastEntry);
}

function isRaycastEntry(value: unknown): value is RaycastEntry {
  const entry = value as Partial<RaycastEntry>;
  return (
    Boolean(entry) &&
    typeof entry.category === "string" &&
    typeof entry.slug === "string" &&
    typeof entry.title === "string" &&
    typeof entry.description === "string" &&
    Array.isArray(entry.tags) &&
    typeof entry.copyText === "string" &&
    typeof entry.detailMarkdown === "string" &&
    typeof entry.webUrl === "string"
  );
}

function loadCachedEntries() {
  const cached = cache.get(CACHE_KEY);
  if (!cached) return [];

  try {
    return parseEntries(cached);
  } catch {
    cache.remove(CACHE_KEY);
    return [];
  }
}

function sortedCategoryOptions(entries: RaycastEntry[]): CategoryOption[] {
  const categories = [...new Set(entries.map((entry) => entry.category))].sort(
    (left, right) => categoryLabel(left).localeCompare(categoryLabel(right)),
  );

  return [
    { value: "all", title: "All Categories" },
    { value: "favorites", title: "Favorites" },
    ...categories.map((category) => ({
      value: category,
      title: categoryLabel(category),
    })),
  ];
}

async function loadFavorites() {
  const raw = await LocalStorage.getItem<string>(FAVORITES_KEY);
  if (!raw) return new Set<string>();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.map(String));
  } catch {
    await LocalStorage.removeItem(FAVORITES_KEY);
    return new Set<string>();
  }
}

async function persistFavorites(favorites: Set<string>) {
  await LocalStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify([...favorites].sort()),
  );
}

function metadataAccessories(entry: RaycastEntry, isFavorite: boolean) {
  const accessories: List.Item.Accessory[] = [
    { text: categoryLabel(entry.category) },
  ];

  if (isFavorite)
    accessories.unshift({
      icon: { source: Icon.Star, tintColor: Color.Yellow },
    });
  if (entry.verificationStatus)
    accessories.push({ text: entry.verificationStatus });
  if (entry.downloadTrust === "first-party") {
    accessories.push({
      icon: { source: Icon.CheckCircle, tintColor: Color.Green },
    });
  }

  return accessories;
}

export default function Command() {
  const [entries, setEntries] = useState<RaycastEntry[]>(() =>
    loadCachedEntries(),
  );
  const [isLoading, setIsLoading] = useState(entries.length === 0);
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function refreshEntries() {
      try {
        const response = await fetch(FEED_URL, {
          headers: {
            accept: "application/json",
          },
        });
        if (!response.ok)
          throw new Error(`Feed responded with ${response.status}`);

        const text = await response.text();
        const nextEntries = parseEntries(text);
        if (nextEntries.length === 0)
          throw new Error("Feed contained no entries");

        cache.set(CACHE_KEY, JSON.stringify(nextEntries));
        if (!cancelled) setEntries(nextEntries);
      } catch (error) {
        if (cancelled || entries.length > 0) return;
        await showToast({
          style: Toast.Style.Failure,
          title: "Could not load HeyClaude",
          message:
            error instanceof Error ? error.message : "Unknown feed error",
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void refreshEntries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeFavorites() {
      const loaded = await loadFavorites();
      if (!cancelled) setFavorites(loaded);
    }

    void initializeFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () => sortedCategoryOptions(entries),
    [entries],
  );
  const displayedEntries = useMemo(() => {
    if (category === "favorites") {
      return entries.filter((entry) => favorites.has(entryKey(entry)));
    }
    if (category === "all") return entries;
    return entries.filter((entry) => entry.category === category);
  }, [category, entries, favorites]);

  async function toggleFavorite(entry: RaycastEntry) {
    const key = entryKey(entry);
    const next = new Set(favorites);
    const isFavorite = next.has(key);

    if (isFavorite) {
      next.delete(key);
    } else {
      next.add(key);
    }

    setFavorites(next);
    await persistFavorites(next);
    await showToast({
      style: Toast.Style.Success,
      title: isFavorite ? "Removed favorite" : "Added favorite",
      message: entry.title,
    });
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Search Claude agents, MCP servers, skills, hooks..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter by category"
          value={category}
          onChange={setCategory}
        >
          {categoryOptions.map((option) => (
            <List.Dropdown.Item
              key={option.value}
              value={option.value}
              title={option.title}
            />
          ))}
        </List.Dropdown>
      }
    >
      {displayedEntries.map((entry) => {
        const isFavorite = favorites.has(entryKey(entry));
        const hasInstallCommand = Boolean(entry.installCommand.trim());
        const hasConfig = Boolean(entry.configSnippet.trim());
        const sourceUrl = entry.repoUrl || entry.documentationUrl;

        return (
          <List.Item
            key={entryKey(entry)}
            title={entry.title}
            subtitle={entry.description}
            keywords={[
              entry.category,
              categoryLabel(entry.category),
              ...entry.tags,
            ]}
            icon={categoryIcons[entry.category] ?? Icon.Document}
            accessories={metadataAccessories(entry, isFavorite)}
            detail={<List.Item.Detail markdown={entry.detailMarkdown} />}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title="Copy Full Asset"
                  content={entry.copyText}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action.Paste
                  title="Paste Full Asset"
                  content={entry.copyText}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
                />
                {hasInstallCommand ? (
                  <Action.CopyToClipboard
                    title="Copy Install Command"
                    content={entry.installCommand}
                    shortcut={{ modifiers: ["cmd"], key: "i" }}
                  />
                ) : null}
                {hasConfig ? (
                  <Action.CopyToClipboard
                    title="Copy Config"
                    content={entry.configSnippet}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                  />
                ) : null}
                <Action.OpenInBrowser
                  title="Open on HeyClaude"
                  url={entry.webUrl}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
                {entry.documentationUrl ? (
                  <Action.OpenInBrowser
                    title="Open Documentation"
                    url={entry.documentationUrl}
                  />
                ) : null}
                {sourceUrl ? (
                  <Action.OpenInBrowser title="Open Source" url={sourceUrl} />
                ) : null}
                <Action
                  title={isFavorite ? "Remove Favorite" : "Add Favorite"}
                  icon={isFavorite ? Icon.StarDisabled : Icon.Star}
                  shortcut={{ modifiers: ["cmd"], key: "f" }}
                  onAction={() => void toggleFavorite(entry)}
                />
              </ActionPanel>
            }
          />
        );
      })}
      {!isLoading && displayedEntries.length === 0 ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title={
            category === "favorites" ? "No favorites yet" : "No entries found"
          }
          description={
            category === "favorites"
              ? "Add favorites from any category to keep them here."
              : "Try another query or category."
          }
        />
      ) : null}
    </List>
  );
}
