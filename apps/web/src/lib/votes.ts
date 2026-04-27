import { getSiteDb, type D1DatabaseLike } from "@/lib/db";

const D1_SAFE_VARIABLE_BATCH_SIZE = 25;

export function isValidEntryKey(key: string) {
  return /^[a-z0-9-]+:[a-z0-9-]+$/.test(key);
}

export function getVotesDb(): D1DatabaseLike | null {
  return getSiteDb();
}

export function getFallbackVoteCounts(keys: string[]) {
  const counts: Record<string, number> = {};
  for (const key of keys) counts[key] = 0;
  return counts;
}

export function getFallbackClientVotes(keys: string[]) {
  const voted: Record<string, boolean> = {};
  for (const key of keys) voted[key] = false;
  return voted;
}

async function ensureEntry(db: D1DatabaseLike, entryKey: string) {
  await db
    .prepare(
      "INSERT OR IGNORE INTO votes_entries (entry_key, upvote_count, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
    )
    .bind(entryKey, 0)
    .run();
}

export async function queryVoteCounts(db: D1DatabaseLike, keys: string[]) {
  if (!keys.length) return {};

  const counts: Record<string, number> = {};
  for (const key of keys) counts[key] = 0;

  for (
    let index = 0;
    index < keys.length;
    index += D1_SAFE_VARIABLE_BATCH_SIZE
  ) {
    const batch = keys.slice(index, index + D1_SAFE_VARIABLE_BATCH_SIZE);
    const placeholders = batch.map(() => "?").join(", ");
    const { results } = await db
      .prepare(
        `SELECT entry_key, upvote_count FROM votes_entries WHERE entry_key IN (${placeholders})`,
      )
      .bind(...batch)
      .all<{ entry_key: string; upvote_count: number }>();

    for (const row of results)
      counts[row.entry_key] = Number(row.upvote_count ?? 0);
  }

  return counts;
}

export async function queryVotesByClient(
  db: D1DatabaseLike,
  keys: string[],
  clientId: string,
) {
  if (!keys.length || !clientId) return {};

  const voted: Record<string, boolean> = {};
  for (const key of keys) voted[key] = false;

  for (
    let index = 0;
    index < keys.length;
    index += D1_SAFE_VARIABLE_BATCH_SIZE
  ) {
    const batch = keys.slice(index, index + D1_SAFE_VARIABLE_BATCH_SIZE);
    const placeholders = batch.map(() => "?").join(", ");
    const { results } = await db
      .prepare(
        `SELECT entry_key FROM votes_by_client WHERE client_id = ? AND entry_key IN (${placeholders})`,
      )
      .bind(clientId, ...batch)
      .all<{ entry_key: string }>();

    for (const row of results) voted[row.entry_key] = true;
  }

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
      .prepare(
        "INSERT OR IGNORE INTO votes_by_client (entry_key, client_id) VALUES (?, ?)",
      )
      .bind(entryKey, clientId)
      .run();
    const changes = Number(insert.meta?.changes ?? 0);

    if (changes > 0) {
      await db
        .prepare(
          "UPDATE votes_entries SET upvote_count = upvote_count + 1, updated_at = CURRENT_TIMESTAMP WHERE entry_key = ?",
        )
        .bind(entryKey)
        .run();
    }
  } else {
    const del = await db
      .prepare(
        "DELETE FROM votes_by_client WHERE entry_key = ? AND client_id = ?",
      )
      .bind(entryKey, clientId)
      .run();
    const changes = Number(del.meta?.changes ?? 0);

    if (changes > 0) {
      await db
        .prepare(
          "UPDATE votes_entries SET upvote_count = CASE WHEN upvote_count > 0 THEN upvote_count - 1 ELSE 0 END, updated_at = CURRENT_TIMESTAMP WHERE entry_key = ?",
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
    .prepare(
      "SELECT 1 AS voted FROM votes_by_client WHERE entry_key = ? AND client_id = ? LIMIT 1",
    )
    .bind(entryKey, clientId)
    .first<{ voted: number }>();

  return {
    count: Number(countRow?.upvote_count ?? 0),
    voted: Boolean(votedRow?.voted),
  };
}
