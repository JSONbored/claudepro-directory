import { describe, expect, it } from "vitest";

import {
  evaluateCheckedJob,
  summarizeResults,
} from "../scripts/check-d1-job-sources.mjs";
import { formatJobSourceCheckSummary } from "../scripts/summarize-job-source-check.mjs";

const sourceOk = {
  ok: true,
  reason: "source_available",
  titleMatched: true,
  companyMatched: true,
  closureDetected: false,
  applyDetected: true,
};

const richJob = {
  slug: "verified-claude-role",
  title: "Claude Infrastructure Engineer",
  company: "Example Co",
  status: "stale_pending_review",
  staleCheckCount: 1,
  summary:
    "Own Claude-native infrastructure integrations for a reviewed jobs board listing with source verification, production workflows, and developer-facing automation.",
  descriptionMd:
    "This reviewed role detail explains the employer product surface, team context, infrastructure ownership, source verification expectations, and why the opening matters to candidates building Claude and MCP workflow systems.",
  responsibilities: [
    "Build Claude and MCP workflow integrations.",
    "Maintain source-verified role details.",
  ],
  requirements: [
    "Professional TypeScript or infrastructure experience.",
    "Comfort working with LLM developer tooling.",
  ],
  applyUrl: "https://example.com/jobs/verified-claude-role",
  sourceUrl: "https://example.com/jobs/verified-claude-role",
  source: "curated",
  sourceKind: "official_ats",
  sourceCheckedAt: "2026-04-28T00:00:00Z",
};

describe("jobs source checker planning", () => {
  it("reactivates healthy stale jobs that still clear the exposure gate", () => {
    expect(
      evaluateCheckedJob(richJob, sourceOk, "2026-04-29T00:00:00.000Z"),
    ).toMatchObject({
      slug: "verified-claude-role",
      ok: true,
      action: "reactivate",
      nextStatus: "active",
      lifecycleReason: "source_verified",
    });
  });

  it("keeps shallow active jobs out of public exposure even when the source is live", () => {
    const result = evaluateCheckedJob(
      {
        ...richJob,
        status: "active",
        staleCheckCount: 0,
        descriptionMd: "Too thin.",
        responsibilities: [],
        requirements: [],
      },
      sourceOk,
      "2026-04-29T00:00:00.000Z",
    );

    expect(result).toMatchObject({
      ok: false,
      reason: "public_exposure_gate_failed",
      action: "stale",
      nextStatus: "stale_pending_review",
    });
    expect(result.qualityErrors).toEqual(
      expect.arrayContaining([expect.stringContaining("reviewed detail")]),
    );
  });

  it("summarizes operator-visible source-check output", () => {
    const summary = summarizeResults([
      { reason: "source_available", action: "revalidate", ok: true },
      {
        reason: "public_exposure_gate_failed",
        action: "stale",
        ok: false,
      },
    ]);

    expect(summary).toMatchObject({
      sourceAvailable: 1,
      revalidated: 1,
      stale: 1,
      blockedByPublicExposureGate: 1,
    });

    expect(
      formatJobSourceCheckSummary({
        apply: true,
        baseUrl: "https://heyclau.de",
        checkedAt: "2026-04-29T00:00:00.000Z",
        summary,
        results: [
          {
            slug: "verified-claude-role",
            status: "active",
            action: "revalidate",
            nextStatus: "active",
            ok: true,
            reason: "source_available",
          },
        ],
      }),
    ).toContain(
      "| verified-claude-role | active | revalidate | active | ok | source_available |",
    );
  });
});
