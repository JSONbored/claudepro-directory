import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import type { D1DatabaseLike, D1RunResult } from "../apps/web/src/lib/db";
import {
  getFallbackClientVotes,
  getFallbackVoteCounts,
  isValidEntryKey,
  queryVoteCounts,
  queryVotesByClient,
  toggleVote,
} from "../apps/web/src/lib/votes";
import { repoRoot } from "./helpers/registry-fixtures";
import { nextLeadStatus } from "@heyclaude/registry/commercial";

type QueryResult = Record<string, unknown>;

class FakeD1 implements D1DatabaseLike {
  voteCounts = new Map<string, number>();
  votesByClient = new Set<string>();

  prepare(query: string) {
    return {
      bind: (...values: unknown[]) => ({
        first: async <T = QueryResult>() => this.first<T>(query, values),
        run: async () => this.run(query, values),
        all: async <T = QueryResult>() => ({
          results: this.all<T>(query, values),
        }),
      }),
    };
  }

  private first<T>(query: string, values: unknown[]) {
    if (query.includes("SELECT upvote_count FROM votes_entries")) {
      const key = String(values[0]);
      return {
        upvote_count: this.voteCounts.get(key) ?? 0,
      } as T;
    }
    if (query.includes("SELECT 1 AS voted FROM votes_by_client")) {
      const [key, clientId] = values.map(String);
      return this.votesByClient.has(`${key}:${clientId}`)
        ? ({ voted: 1 } as T)
        : null;
    }
    return null;
  }

  private run(query: string, values: unknown[]): D1RunResult {
    if (query.includes("INSERT OR IGNORE INTO votes_entries")) {
      const key = String(values[0]);
      if (!this.voteCounts.has(key)) this.voteCounts.set(key, 0);
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes("INSERT OR IGNORE INTO votes_by_client")) {
      const [key, clientId] = values.map(String);
      const voteKey = `${key}:${clientId}`;
      const existed = this.votesByClient.has(voteKey);
      this.votesByClient.add(voteKey);
      return { success: true, meta: { changes: existed ? 0 : 1 } };
    }
    if (
      query.includes("UPDATE votes_entries SET upvote_count = upvote_count + 1")
    ) {
      const key = String(values[0]);
      this.voteCounts.set(key, (this.voteCounts.get(key) ?? 0) + 1);
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes("DELETE FROM votes_by_client")) {
      const [key, clientId] = values.map(String);
      const voteKey = `${key}:${clientId}`;
      const existed = this.votesByClient.delete(voteKey);
      return { success: true, meta: { changes: existed ? 1 : 0 } };
    }
    if (query.includes("CASE WHEN upvote_count > 0")) {
      const key = String(values[0]);
      this.voteCounts.set(
        key,
        Math.max(0, (this.voteCounts.get(key) ?? 0) - 1),
      );
      return { success: true, meta: { changes: 1 } };
    }
    return { success: true, meta: { changes: 0 } };
  }

  private all<T>(query: string, values: unknown[]) {
    if (query.includes("FROM votes_entries")) {
      const keys = values.map(String);
      return keys
        .filter((key) => this.voteCounts.has(key))
        .map((key) => ({
          entry_key: key,
          upvote_count: this.voteCounts.get(key) ?? 0,
        })) as T[];
    }
    if (query.includes("FROM votes_by_client")) {
      const [clientId, ...keys] = values.map(String);
      return keys
        .filter((key) => this.votesByClient.has(`${key}:${clientId}`))
        .map((key) => ({ entry_key: key })) as T[];
    }
    return [];
  }
}

describe("D1 dynamic state helpers", () => {
  it("validates entry keys and provides zero-count fallback state", () => {
    expect(isValidEntryKey("agents:example-agent")).toBe(true);
    expect(isValidEntryKey("../bad")).toBe(false);
    expect(getFallbackVoteCounts(["agents:example-agent"])).toEqual({
      "agents:example-agent": 0,
    });
    expect(getFallbackClientVotes(["agents:example-agent"])).toEqual({
      "agents:example-agent": false,
    });
  });

  it("toggles votes without relying on historical seed data", async () => {
    const db = new FakeD1();
    const key = "agents:example-agent";
    const clientId = "client-12345";

    await expect(queryVoteCounts(db, [key])).resolves.toEqual({ [key]: 0 });
    await expect(queryVotesByClient(db, [key], clientId)).resolves.toEqual({
      [key]: false,
    });

    await expect(
      toggleVote({ db, entryKey: key, clientId, vote: true }),
    ).resolves.toEqual({
      count: 1,
      voted: true,
    });
    await expect(queryVoteCounts(db, [key])).resolves.toEqual({ [key]: 1 });
    await expect(queryVotesByClient(db, [key], clientId)).resolves.toEqual({
      [key]: true,
    });

    await expect(
      toggleVote({ db, entryKey: key, clientId, vote: false }),
    ).resolves.toEqual({
      count: 0,
      voted: false,
    });
  });

  it("keeps dynamic-state migrations aligned with votes, leads, intent events, and community signals", () => {
    const migrationsDir = path.join(repoRoot, "apps/web/migrations");
    const votes = fs.readFileSync(
      path.join(migrationsDir, "0001_votes.sql"),
      "utf8",
    );
    const leads = fs.readFileSync(
      path.join(migrationsDir, "0003_commercial_leads.sql"),
      "utf8",
    );
    const intents = fs.readFileSync(
      path.join(migrationsDir, "0004_intent_events.sql"),
      "utf8",
    );
    const signals = fs.readFileSync(
      path.join(migrationsDir, "0005_community_signals.sql"),
      "utf8",
    );

    expect(votes).toContain("votes_entries");
    expect(leads).toContain("listing_leads");
    expect(leads).toContain("commercial_placements");
    expect(intents).toContain("intent_events");
    expect(intents).toContain("copy");
    expect(intents).toContain("open");
    expect(signals).toContain("community_signals");
    expect(signals).toContain("used");
    expect(signals).toContain("works");
    expect(signals).toContain("broken");
  });

  it("smokes lead transitions used by D1-backed admin review", () => {
    let status = "new";
    status = nextLeadStatus(status, "review");
    expect(status).toBe("pending_review");
    status = nextLeadStatus(status, "approve");
    expect(status).toBe("approved");
    status = nextLeadStatus(status, "activate");
    expect(status).toBe("active");
    status = nextLeadStatus(status, "expire");
    expect(status).toBe("expired");
  });
});
