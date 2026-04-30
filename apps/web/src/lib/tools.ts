import "server-only";

import type { DirectoryEntry, ToolListing } from "@heyclaude/registry";
import { compareToolListings } from "@heyclaude/registry/commercial";

import { getDirectoryEntriesByCategory } from "@/lib/content";
import { getSiteDb } from "@/lib/db";

type PlacementRow = {
  target_key: string;
  tier: string;
  disclosure: string;
  starts_at: string | null;
  expires_at: string | null;
};

function toToolListing(
  entry: DirectoryEntry,
  placement?: PlacementRow,
): ToolListing {
  const sponsored = placement?.tier === "sponsored";
  const featured = sponsored || placement?.tier === "featured";

  return {
    ...entry,
    featured,
    sponsored,
    disclosure: (placement?.disclosure ||
      entry.disclosure ||
      "editorial") as ToolListing["disclosure"],
    placement: placement
      ? {
          targetKind: "tool",
          targetKey: placement.target_key,
          tier: placement.tier as "standard" | "featured" | "sponsored",
          disclosure: placement.disclosure as
            | "editorial"
            | "affiliate"
            | "sponsored",
          startsAt: placement.starts_at || undefined,
          expiresAt: placement.expires_at || undefined,
        }
      : undefined,
  };
}

async function getActivePlacements() {
  const db = getSiteDb();
  if (!db) return new Map<string, PlacementRow>();

  try {
    const { results } = await db
      .prepare(
        `SELECT target_key, tier, disclosure, starts_at, expires_at
         FROM commercial_placements
         WHERE target_kind = 'tool'
           AND status = 'active'
           AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now'))
           AND (expires_at IS NULL OR datetime(expires_at) >= datetime('now'))`,
      )
      .bind()
      .all<PlacementRow>();

    return new Map(results.map((row) => [row.target_key, row]));
  } catch {
    return new Map<string, PlacementRow>();
  }
}

export async function getTools(): Promise<ToolListing[]> {
  const [entries, placements] = await Promise.all([
    getDirectoryEntriesByCategory("tools"),
    getActivePlacements(),
  ]);

  return entries
    .map((entry) =>
      toToolListing(
        entry,
        placements.get(`tools:${entry.slug}`) ?? placements.get(entry.slug),
      ),
    )
    .sort(compareToolListings);
}

export async function getToolBySlug(slug: string): Promise<ToolListing | null> {
  const tools = await getTools();
  return tools.find((tool) => tool.slug === slug) ?? null;
}
