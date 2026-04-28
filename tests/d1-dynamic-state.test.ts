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
import { queryActiveJobs } from "../apps/web/src/lib/jobs";
import {
  REQUIRED_JOB_COLUMNS,
  checkJobsSchema,
  getJobsHealth,
  updateAdminJobState,
  upsertAdminJob,
} from "../apps/web/src/lib/job-admin";
import { repoRoot } from "./helpers/registry-fixtures";
import { nextLeadStatus } from "@heyclaude/registry/commercial";

type QueryResult = Record<string, unknown>;

class FakeD1 implements D1DatabaseLike {
  voteCounts = new Map<string, number>();
  votesByClient = new Set<string>();
  jobRows: QueryResult[] = [];
  runCalls: Array<{ query: string; values: unknown[] }> = [];

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
    this.runCalls.push({ query, values });
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
    if (query.includes("PRAGMA table_info(jobs_listings)")) {
      return REQUIRED_JOB_COLUMNS.map((name) => ({ name })) as T[];
    }
    if (query.includes("COUNT(*) AS count FROM jobs_listings")) {
      const counts = new Map<string, number>();
      for (const row of this.jobRows) {
        const status = String(row.status || "unknown");
        counts.set(status, (counts.get(status) ?? 0) + 1);
      }
      return [...counts].map(([status, count]) => ({ status, count })) as T[];
    }
    if (query.includes("FROM jobs_listings")) {
      return this.jobRows as T[];
    }
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

  it("returns explicit empty jobs state unless active D1 rows exist", async () => {
    const db = new FakeD1();

    await expect(queryActiveJobs(db)).resolves.toEqual([]);

    db.jobRows = [
      {
        slug: "ai-systems-engineer",
        title: "AI Systems Engineer",
        company_name: "Example Co",
        company_url: "https://example.com",
        location_text: "Remote",
        summary: "Build Claude-native workflow systems.",
        description_md: null,
        employment_type: "Full-time",
        posted_at: "2026-04-26T00:00:00Z",
        compensation_summary: "$150k-$190k",
        responsibilities_json: JSON.stringify(["Ship integrations"]),
        requirements_json: JSON.stringify(["TypeScript"]),
        apply_url: "https://example.com/jobs/ai-systems-engineer",
        tier: "featured",
        status: "active",
        source: "manual",
        source_kind: "employer_submitted",
        source_url: "https://example.com/jobs/ai-systems-engineer",
        first_seen_at: "2026-04-26T00:00:00Z",
        last_checked_at: "2026-04-27T00:00:00Z",
        source_checked_at: "2026-04-27T00:00:00Z",
        stale_check_count: 0,
        curation_note: null,
        paid_placement_expires_at: "2026-05-26T00:00:00Z",
        claimed_employer: 1,
        posted_by_email: "jobs@example.com",
        expires_at: null,
        is_remote: 1,
        is_worldwide: 1,
      },
    ];

    await expect(queryActiveJobs(db)).resolves.toMatchObject([
      {
        slug: "ai-systems-engineer",
        title: "AI Systems Engineer",
        company: "Example Co",
        companyUrl: "https://example.com",
        featured: true,
        sponsored: false,
        sourceKind: "employer_submitted",
        claimedEmployer: true,
        paidPlacementExpiresAt: "2026-05-26T00:00:00Z",
        responsibilities: ["Ship integrations"],
        requirements: ["TypeScript"],
      },
    ]);
  });

  it("checks jobs schema and updates private reviewed job rows through admin helpers", async () => {
    const db = new FakeD1();
    await expect(checkJobsSchema(db)).resolves.toMatchObject({
      ok: true,
      missingColumns: [],
      requiredMigration: "0006_jobs_curation_and_claims.sql",
    });
    await expect(getJobsHealth(db)).resolves.toMatchObject({
      ok: true,
      counts: {},
    });

    await upsertAdminJob(db, {
      slug: "reviewed-ai-engineer",
      title: "Reviewed AI Engineer",
      companyName: "Example Co",
      companyUrl: "https://example.com",
      locationText: "Remote",
      summary:
        "Build reviewed Claude workflow systems with source verification, external apply links, and private D1-backed publication state.",
      applyUrl: "https://example.com/jobs/reviewed-ai-engineer",
      tier: "featured",
      status: "pending_review",
      source: "manual",
      sourceKind: "employer_submitted",
      sourceUrl: "https://example.com/jobs/reviewed-ai-engineer",
      responsibilities: ["Ship integrations"],
      requirements: ["TypeScript"],
      claimedEmployer: true,
      isRemote: true,
      isWorldwide: true,
    });
    expect(db.runCalls.at(-1)?.query).toContain("ON CONFLICT(slug)");
    expect(db.runCalls.at(-1)?.values).toContain("reviewed-ai-engineer");

    await updateAdminJobState(db, {
      slug: "reviewed-ai-engineer",
      action: "revalidate",
      checkedAt: "2026-04-28T00:00:00.000Z",
    });
    expect(db.runCalls.at(-1)?.query).toContain("stale_check_count = 0");
    expect(db.runCalls.at(-1)?.values).toContain("2026-04-28T00:00:00.000Z");

    await updateAdminJobState(db, {
      slug: "reviewed-ai-engineer",
      action: "stale",
      checkedAt: "2026-04-29T00:00:00.000Z",
    });
    expect(db.runCalls.at(-1)?.query).toContain("stale_pending_review");
  });

  it("keeps dynamic-state migrations aligned with votes, jobs, leads, intent events, and community signals", () => {
    const migrationsDir = path.join(repoRoot, "apps/web/migrations");
    const votes = fs.readFileSync(
      path.join(migrationsDir, "0001_votes.sql"),
      "utf8",
    );
    const jobs = fs.readFileSync(
      path.join(migrationsDir, "0002_jobs.sql"),
      "utf8",
    );
    const jobsCuration = fs.readFileSync(
      path.join(migrationsDir, "0006_jobs_curation_and_claims.sql"),
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
    expect(jobs).toContain("jobs_listings");
    expect(jobs).toContain("pending_review");
    expect(jobsCuration).toContain("stale_pending_review");
    expect(jobsCuration).toContain("official_ats");
    expect(jobsCuration).toContain("paid_placement_expires_at");
    expect(jobs).toContain("is_worldwide");
    expect(leads).toContain("listing_leads");
    expect(jobsCuration).toContain("'claim'");
    expect(leads).toContain("commercial_placements");
    expect(intents).toContain("intent_events");
    expect(intents).toContain("copy");
    expect(intents).toContain("open");
    expect(signals).toContain("community_signals");
    expect(signals).toContain("used");
    expect(signals).toContain("works");
    expect(signals).toContain("broken");
  });

  it("enforces lead status transitions used by D1-backed admin review", () => {
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
