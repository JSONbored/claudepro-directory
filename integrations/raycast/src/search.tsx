import {
  Action,
  ActionPanel,
  Cache,
  Clipboard,
  Color,
  Icon,
  List,
  LocalStorage,
  Toast,
  showToast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import {
  FAVORITES_KEY,
  FEED_URL,
  buildContributeEntryUrl,
  buildSuggestChangeUrl,
  categoryLabel,
  entryKey,
  filterEntriesByCategory,
  parseFavoriteKeys,
  serializeFavoriteKeys,
  sortedCategoryOptions,
  type RaycastEntry,
} from "./feed";
import {
  fetchFreshFeed,
  loadCachedFeed as loadCachedFeedFromRuntime,
  loadEntryDetail,
} from "./runtime";

const cache = new Cache();

const categoryIcons: Record<string, Icon> = {
  agents: Icon.Person,
  mcp: Icon.Network,
  tools: Icon.AppWindow,
  skills: Icon.Hammer,
  rules: Icon.TextDocument,
  commands: Icon.Terminal,
  hooks: Icon.Bolt,
  guides: Icon.Book,
  collections: Icon.Folder,
  statuslines: Icon.BarChart,
};

function loadCachedFeed() {
  return loadCachedFeedFromRuntime(cache);
}

async function loadFavorites() {
  const raw = await LocalStorage.getItem<string>(FAVORITES_KEY);
  if (!raw) return new Set<string>();

  try {
    return new Set(parseFavoriteKeys(raw));
  } catch {
    await LocalStorage.removeItem(FAVORITES_KEY);
    return new Set<string>();
  }
}

async function persistFavorites(favorites: Set<string>) {
  await LocalStorage.setItem(FAVORITES_KEY, serializeFavoriteKeys(favorites));
}

function metadataAccessories(entry: RaycastEntry, isFavorite: boolean) {
  const accessories: List.Item.Accessory[] = [
    { text: categoryLabel(entry.category) },
  ];

  if (isFavorite) {
    accessories.unshift({
      icon: { source: Icon.Star, tintColor: Color.Yellow },
    });
  }
  if (entry.verificationStatus) {
    accessories.push({ text: entry.verificationStatus });
  }
  if (entry.downloadTrust === "first-party") {
    accessories.push({
      icon: { source: Icon.CheckCircle, tintColor: Color.Green },
    });
  }
  if (entry.copyTextTruncated) {
    accessories.push({ text: "Full on demand" });
  }

  return accessories;
}

export default function Command() {
  const cachedFeed = loadCachedFeed();
  const [entries, setEntries] = useState<RaycastEntry[]>(cachedFeed.entries);
  const [generatedAt, setGeneratedAt] = useState(cachedFeed.generatedAt);
  const [isLoading, setIsLoading] = useState(entries.length === 0);
  const [category, setCategory] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  async function refreshEntries(showSuccess = false) {
    setIsLoading(true);
    try {
      const nextFeed = await fetchFreshFeed({ cache, feedUrl: FEED_URL });
      setEntries(nextFeed.entries);
      setGeneratedAt(nextFeed.generatedAt);
      if (showSuccess) {
        await showToast({
          style: Toast.Style.Success,
          title: "HeyClaude feed refreshed",
          message: `${nextFeed.entries.length} entries`,
        });
      }
    } catch (error) {
      if (entries.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Could not load HeyClaude",
          message:
            error instanceof Error ? error.message : "Unknown feed error",
        });
      } else if (showSuccess) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Could not refresh feed",
          message:
            error instanceof Error ? error.message : "Unknown feed error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshEntries(false);
    // Run only once on command open. Manual refresh is exposed as an action.
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
  const displayedEntries = useMemo(
    () => filterEntriesByCategory(entries, category, favorites),
    [category, entries, favorites],
  );

  async function copyFullAsset(entry: RaycastEntry) {
    try {
      const detail = await loadEntryDetail({ entry, cache });
      await Clipboard.copy(detail.copyText || entry.copyText);
      await showToast({
        style: Toast.Style.Success,
        title: "Copied full asset",
        message: entry.title,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not copy full asset",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async function pasteFullAsset(entry: RaycastEntry) {
    try {
      const detail = await loadEntryDetail({ entry, cache });
      await Clipboard.paste(detail.copyText || entry.copyText);
      await showToast({
        style: Toast.Style.Success,
        title: "Pasted full asset",
        message: entry.title,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not paste full asset",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

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
        const detailMarkdown = generatedAt
          ? `${entry.detailMarkdown}\n\n---\nFeed updated: ${generatedAt.slice(0, 10)}`
          : entry.detailMarkdown;

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
            detail={<List.Item.Detail markdown={detailMarkdown} />}
            actions={
              <ActionPanel>
                <Action
                  title="Copy Full Asset"
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                  onAction={() => void copyFullAsset(entry)}
                />
                <Action
                  title="Paste Full Asset"
                  icon={Icon.TextCursor}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "v" }}
                  onAction={() => void pasteFullAsset(entry)}
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
                <Action.OpenInBrowser
                  title="Contribute Entry"
                  url={buildContributeEntryUrl(entry)}
                  icon={Icon.Plus}
                />
                <Action.OpenInBrowser
                  title="Suggest Change"
                  url={buildSuggestChangeUrl(entry)}
                  icon={Icon.Pencil}
                />
                <Action
                  title={isFavorite ? "Remove Favorite" : "Add Favorite"}
                  icon={isFavorite ? Icon.StarDisabled : Icon.Star}
                  shortcut={{ modifiers: ["cmd"], key: "f" }}
                  onAction={() => void toggleFavorite(entry)}
                />
                <ActionPanel.Section>
                  <Action
                    title="Refresh Feed"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={() => void refreshEntries(true)}
                  />
                </ActionPanel.Section>
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
          actions={
            <ActionPanel>
              <Action
                title="Refresh Feed"
                icon={Icon.ArrowClockwise}
                onAction={() => void refreshEntries(true)}
              />
              <Action.OpenInBrowser
                title="Contribute Entry"
                url={buildContributeEntryUrl()}
                icon={Icon.Plus}
              />
            </ActionPanel>
          }
        />
      ) : null}
    </List>
  );
}
