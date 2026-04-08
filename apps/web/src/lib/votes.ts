import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1RunResult = {
  success?: boolean;
  meta?: {
    changes?: number;
  };
};

type D1PreparedStatement = {
  bind: (...values: unknown[]) => {
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    run: () => Promise<D1RunResult>;
    all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  };
};

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatement;
};

export function isValidEntryKey(key: string) {
  return /^[a-z0-9-]+:[a-z0-9-]+$/.test(key);
}

export function getVotesDb(): D1DatabaseLike | null {
  try {
    const { env } = getCloudflareContext();
    return (env.VOTES_DB as D1DatabaseLike | undefined) ?? null;
  } catch {
    return null;
  }
}

async function ensureEntry(db: D1DatabaseLike, entryKey: string) {
  await db
    .prepare(
      "INSERT OR IGNORE INTO votes_entries (entry_key, upvote_count, updated_at) VALUES (?, 0, CURRENT_TIMESTAMP)"
    )
    .bind(entryKey)
    .run();
}

export async function queryVoteCounts(db: D1DatabaseLike, keys: string[]) {
  if (!keys.length) return {};

  const placeholders = keys.map(() => "?").join(", ");
  const { results } = await db
    .prepare(`SELECT entry_key, upvote_count FROM votes_entries WHERE entry_key IN (${placeholders})`)
    .bind(...keys)
    .all<{ entry_key: string; upvote_count: number }>();

  const counts: Record<string, number> = {};
  for (const key of keys) counts[key] = 0;
  for (const row of results) counts[row.entry_key] = Number(row.upvote_count ?? 0);
  return counts;
}

export async function queryVotesByClient(db: D1DatabaseLike, keys: string[], clientId: string) {
  if (!keys.length || !clientId) return {};

  const placeholders = keys.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT entry_key FROM votes_by_client WHERE client_id = ? AND entry_key IN (${placeholders})`
    )
    .bind(clientId, ...keys)
    .all<{ entry_key: string }>();

  const voted: Record<string, boolean> = {};
  for (const key of keys) voted[key] = false;
  for (const row of results) voted[row.entry_key] = true;
  return voted;
}

export async function toggleVote(params: {
  db: D1DatabaseLike;
  entryKey: string;
  clientId: string;
  vote: boolean;
}) {
  const { db, entryKey, clientId, vote } = params;
  await ensureEntry(db, entryKey);

  if (vote) {
    const insert = await db
      .prepare("INSERT OR IGNORE INTO votes_by_client (entry_key, client_id) VALUES (?, ?)")
      .bind(entryKey, clientId)
      .run();
    const changes = Number(insert.meta?.changes ?? 0);

    if (changes > 0) {
      await db
        .prepare(
          "UPDATE votes_entries SET upvote_count = upvote_count + 1, updated_at = CURRENT_TIMESTAMP WHERE entry_key = ?"
        )
        .bind(entryKey)
        .run();
    }
  } else {
    const del = await db
      .prepare("DELETE FROM votes_by_client WHERE entry_key = ? AND client_id = ?")
      .bind(entryKey, clientId)
      .run();
    const changes = Number(del.meta?.changes ?? 0);

    if (changes > 0) {
      await db
        .prepare(
          "UPDATE votes_entries SET upvote_count = CASE WHEN upvote_count > 0 THEN upvote_count - 1 ELSE 0 END, updated_at = CURRENT_TIMESTAMP WHERE entry_key = ?"
        )
        .bind(entryKey)
        .run();
    }
  }

  const countRow = await db
    .prepare("SELECT upvote_count FROM votes_entries WHERE entry_key = ?")
    .bind(entryKey)
    .first<{ upvote_count: number }>();

  const votedRow = await db
    .prepare("SELECT 1 AS voted FROM votes_by_client WHERE entry_key = ? AND client_id = ? LIMIT 1")
    .bind(entryKey, clientId)
    .first<{ voted: number }>();

  return {
    count: Number(countRow?.upvote_count ?? 0),
    voted: Boolean(votedRow?.voted)
  };
}
