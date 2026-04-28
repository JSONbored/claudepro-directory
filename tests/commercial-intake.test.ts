import { describe, expect, it } from "vitest";

import {
  buildPlacementRenewalReminder,
  compareToolListings,
  evaluateJobSourceLifecycle,
  isPlacementActive,
  linkRelForDisclosure,
  nextLeadStatus,
  normalizeCommercialTier,
  normalizeDisclosure,
  normalizeLeadKind,
  summarizePlacementExpiry,
  validateJobPublicationQuality,
  validateListingLeadPayload,
} from "@heyclaude/registry/commercial";
import { loadContentEntries } from "./helpers/registry-fixtures";

describe("commercial intake contracts", () => {
  it("normalizes commercial listing fields", () => {
    expect(normalizeLeadKind("job")).toBe("job");
    expect(normalizeLeadKind("app")).toBe("tool");
    expect(normalizeCommercialTier("sponsored")).toBe("sponsored");
    expect(normalizeCommercialTier("unknown")).toBe("free");
    expect(normalizeDisclosure("affiliate")).toBe("affiliate");
    expect(normalizeDisclosure("heyclaude_pick")).toBe("heyclaude_pick");
    expect(normalizeDisclosure("claimed")).toBe("claimed");
    expect(normalizeDisclosure("")).toBe("editorial");
    expect(linkRelForDisclosure("sponsored")).toBe(
      "sponsored nofollow noreferrer",
    );
    expect(linkRelForDisclosure("editorial")).toBe("noreferrer");
  });

  it("enforces lead review status transitions", () => {
    expect(nextLeadStatus("new", "review")).toBe("pending_review");
    expect(nextLeadStatus("pending_review", "approve")).toBe("approved");
    expect(nextLeadStatus("active", "expire")).toBe("expired");
    expect(nextLeadStatus("archived", "approve")).toBe("archived");
  });

  it("detects active placement windows", () => {
    expect(
      isPlacementActive(
        {
          status: "active",
          startsAt: "2026-01-01T00:00:00Z",
          expiresAt: "2026-12-31T23:59:59Z",
        },
        new Date("2026-04-26T00:00:00Z"),
      ),
    ).toBe(true);
    expect(
      isPlacementActive(
        {
          status: "active",
          expiresAt: "2026-01-01T00:00:00Z",
        },
        new Date("2026-04-26T00:00:00Z"),
      ),
    ).toBe(false);
  });

  it("validates tool and job leads separately", () => {
    const tool = validateListingLeadPayload({
      kind: "tool",
      tierInterest: "featured",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      companyName: "Example Co",
      listingTitle: "Example Tool",
      websiteUrl: "https://example.com",
      message: "Free listing with possible sponsorship.",
    });
    expect(tool.ok).toBe(true);
    expect(tool.data.kind).toBe("tool");
    expect(tool.data.tierInterest).toBe("featured");

    const insecureTool = validateListingLeadPayload({
      kind: "tool",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      companyName: "Example Co",
      listingTitle: "Example Tool",
      websiteUrl: "http://example.com",
    });
    expect(insecureTool.ok).toBe(false);
    expect(insecureTool.errors).toContain(
      "tool leads require an https websiteUrl",
    );

    const job = validateListingLeadPayload({
      kind: "job",
      tierInterest: "sponsored",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      companyName: "Example Co",
      listingTitle: "AI Engineer",
      applyUrl: "https://example.com/jobs/ai-engineer",
    });
    expect(job.ok).toBe(true);
    expect(job.data.kind).toBe("job");

    const claim = validateListingLeadPayload({
      kind: "claim",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      companyName: "Example Co",
      listingTitle: "Example MCP",
      websiteUrl: "https://example.com/proof",
      message: "Claiming an existing listing with source proof.",
    });
    expect(claim.ok).toBe(true);
    expect(claim.data.kind).toBe("claim");

    const missingApplyUrl = validateListingLeadPayload({
      kind: "job",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      companyName: "Example Co",
      listingTitle: "AI Engineer",
    });
    expect(missingApplyUrl.ok).toBe(false);
    expect(missingApplyUrl.errors).toContain(
      "job leads require an https applyUrl",
    );
  });

  it("enforces a higher content bar before paid jobs can publish", () => {
    expect(
      validateJobPublicationQuality({
        tier: "free",
        status: "pending_review",
        summary: "A short draft can still enter maintainer review.",
      }),
    ).toMatchObject({ ok: true, required: false });

    const shallowPaidJob = validateJobPublicationQuality({
      tier: "sponsored",
      status: "active",
      summary: "Too short.",
      applyUrl: "https://example.com/jobs/ai-engineer",
    });
    expect(shallowPaidJob.ok).toBe(false);
    expect(shallowPaidJob.required).toBe(true);
    expect(shallowPaidJob.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("120+ character original summary"),
        expect.stringContaining("300+ characters of original role detail"),
        expect.stringContaining("at least 3 responsibilities"),
        expect.stringContaining("at least 3 requirements"),
        expect.stringContaining("salary or compensation range"),
      ]),
    );

    expect(
      validateJobPublicationQuality({
        tier: "featured",
        status: "active",
        summary:
          "Build Claude-native developer workflow infrastructure for teams shipping production AI systems, with strong ownership over integrations and customer-facing product quality.",
        descriptionMd:
          "Own the public-facing role detail for a paid HeyClaude listing. This description explains the team context, product surface, AI workflow responsibilities, developer tooling expectations, source verification, and why the role matters to the Claude and MCP ecosystem. It is intentionally long enough to support useful search snippets and truthful JobPosting structured data.",
        employmentType: "Full-time",
        compensationSummary: "$150K – $190K",
        benefits: ["Health benefits", "Remote work"],
        responsibilities: [
          "Build production integrations for Claude and MCP developer workflows.",
          "Partner with product and customer teams to prioritize high-signal automation work.",
          "Maintain source-verified listing details as the role evolves.",
        ],
        requirements: [
          "Professional TypeScript or backend engineering experience.",
          "Comfort working with LLM applications and developer tooling.",
          "Strong written communication for technical product surfaces.",
        ],
        applyUrl: "https://example.com/jobs/ai-engineer",
        sourceUrl: "https://example.com/jobs/ai-engineer",
        postedAt: "2026-04-28",
        expiresAt: "2026-05-28",
        sourceCheckedAt: "2026-04-28",
      }),
    ).toMatchObject({ ok: true, required: true, errors: [] });
  });

  it("transitions curated job sources through verified, stale, and closed states", () => {
    expect(
      evaluateJobSourceLifecycle({
        currentStatus: "active",
        staleCheckCount: 1,
        expiresAt: "2026-05-28T00:00:00Z",
        sourceOk: true,
        titleMatched: true,
        companyMatched: true,
        closureDetected: false,
        applyDetected: true,
      }),
    ).toMatchObject({
      status: "active",
      staleCheckCount: 0,
      indexable: true,
      reason: "source_verified",
    });

    expect(
      evaluateJobSourceLifecycle({
        currentStatus: "active",
        staleCheckCount: 0,
        sourceOk: false,
        titleMatched: false,
        companyMatched: true,
        closureDetected: false,
        applyDetected: false,
      }),
    ).toMatchObject({
      status: "stale_pending_review",
      staleCheckCount: 1,
      indexable: false,
    });

    expect(
      evaluateJobSourceLifecycle({
        currentStatus: "active",
        staleCheckCount: 1,
        sourceOk: false,
        titleMatched: false,
        companyMatched: false,
        closureDetected: true,
        applyDetected: false,
      }),
    ).toMatchObject({
      status: "closed",
      staleCheckCount: 2,
      indexable: false,
    });

    expect(
      evaluateJobSourceLifecycle(
        {
          currentStatus: "active",
          staleCheckCount: 0,
          expiresAt: "2026-04-01T00:00:00Z",
          sourceOk: true,
          titleMatched: true,
          companyMatched: true,
          closureDetected: false,
          applyDetected: true,
          paidPlacementExpiresAt: "2026-12-01T00:00:00Z",
        } as any,
        new Date("2026-04-28T00:00:00Z"),
      ),
    ).toMatchObject({
      status: "closed",
      reason: "expired",
      indexable: false,
    });
  });

  it("summarizes placement expiry and renewal reminders", () => {
    const [summary] = summarizePlacementExpiry(
      [
        {
          targetKind: "tool",
          targetKey: "tools:example",
          tier: "sponsored",
          status: "active",
          expiresAt: "2026-05-03T00:00:00Z",
        },
      ],
      new Date("2026-04-26T00:00:00Z"),
      14,
    );

    expect(summary).toMatchObject({
      targetKey: "tools:example",
      needsRenewalReminder: true,
      daysUntilExpiry: 7,
    });
    expect(buildPlacementRenewalReminder(summary)).toContain(
      "expires in 7 days",
    );
  });

  it("keeps seeded tools editorial and free of hidden affiliate ranking", () => {
    const tools = loadContentEntries().filter(
      (entry) => entry.category === "tools",
    );
    expect(tools.length).toBeGreaterThanOrEqual(50);

    for (const tool of tools) {
      expect(tool.websiteUrl).toMatch(/^https:\/\//);
      expect(tool.disclosure).toMatch(
        /^(editorial|heyclaude_pick|affiliate|sponsored|claimed)$/,
      );
      if (tool.disclosure !== "affiliate") {
        expect(tool.affiliateUrl || "").toBe("");
      }
      expect(linkRelForDisclosure(tool.disclosure || "editorial")).toContain(
        "noreferrer",
      );
    }
  });

  it("does not use affiliate disclosure or affiliate URLs as ranking inputs", () => {
    const base = {
      slug: "alpha",
      title: "Alpha",
      dateAdded: "2026-04-01",
      featured: false,
      sponsored: false,
    };
    const affiliate = {
      ...base,
      disclosure: "affiliate",
      affiliateUrl: "https://example.com/?via=heyclaude",
    };
    const editorial = {
      ...base,
      disclosure: "editorial",
      affiliateUrl: "",
    };

    expect(compareToolListings(affiliate, editorial)).toBe(0);
    expect(compareToolListings(editorial, affiliate)).toBe(0);

    const sponsored = {
      ...base,
      slug: "sponsored",
      title: "Sponsored",
      sponsored: true,
      disclosure: "sponsored",
    };
    expect(compareToolListings(sponsored, affiliate)).toBeLessThan(0);
  });
});
