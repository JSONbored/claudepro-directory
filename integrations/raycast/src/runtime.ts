import {
  CACHE_KEY,
  DETAIL_CACHE_PREFIX,
  FEED_URL,
  absoluteDataUrl,
  entryKey,
  fallbackDetail,
  isRaycastDetail,
  parseFeed,
  type ParsedFeed,
  type RaycastDetail,
  type RaycastEntry,
} from "./feed";

export type RaycastTextCache = {
  get: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
};

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function loadCachedFeed(cache: RaycastTextCache): ParsedFeed {
  const cached = cache.get(CACHE_KEY);
  if (!cached) return { entries: [], generatedAt: "" };

  try {
    return parseFeed(cached);
  } catch {
    cache.remove(CACHE_KEY);
    return { entries: [], generatedAt: "" };
  }
}

export async function fetchFreshFeed(options: {
  cache: RaycastTextCache;
  fetchFn?: FetchLike;
  feedUrl?: string;
}) {
  const fetchFn = options.fetchFn ?? fetch;
  const feedUrl = options.feedUrl ?? FEED_URL;
  const response = await fetchFn(feedUrl, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Feed responded with ${response.status}`);
  }

  const text = await response.text();
  const nextFeed = parseFeed(text);
  if (nextFeed.entries.length === 0) {
    throw new Error("Feed contained no entries");
  }

  options.cache.set(CACHE_KEY, text);
  return nextFeed;
}

export async function loadEntryDetail(options: {
  entry: RaycastEntry;
  cache: RaycastTextCache;
  fetchFn?: FetchLike;
  feedUrl?: string;
}): Promise<RaycastDetail> {
  const { entry, cache } = options;
  if (!entry.detailUrl) return fallbackDetail(entry);

  const cacheKey = `${DETAIL_CACHE_PREFIX}:${entryKey(entry)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as unknown;
      if (isRaycastDetail(parsed)) return parsed;
    } catch {
      cache.remove(cacheKey);
    }
  }

  const fetchFn = options.fetchFn ?? fetch;
  const response = await fetchFn(
    absoluteDataUrl(entry.detailUrl, options.feedUrl ?? FEED_URL),
    { headers: { accept: "application/json" } },
  );
  if (!response.ok) {
    throw new Error(`Detail responded with ${response.status}`);
  }

  const parsed = (await response.json()) as unknown;
  if (!isRaycastDetail(parsed)) {
    throw new Error("Detail payload was malformed");
  }

  cache.set(cacheKey, JSON.stringify(parsed));
  return parsed;
}
