import assert from "node:assert/strict";

import {
  normalizeCommercialTier,
  normalizeDisclosure,
  normalizeLeadKind,
  isPlacementActive,
  linkRelForDisclosure,
  nextLeadStatus,
  validateListingLeadPayload,
} from "@heyclaude/registry/commercial";

assert.equal(normalizeLeadKind("job"), "job");
assert.equal(normalizeLeadKind("app"), "tool");
assert.equal(normalizeCommercialTier("sponsored"), "sponsored");
assert.equal(normalizeCommercialTier("unknown"), "free");
assert.equal(normalizeDisclosure("affiliate"), "affiliate");
assert.equal(normalizeDisclosure(""), "editorial");
assert.equal(
  linkRelForDisclosure("sponsored"),
  "sponsored nofollow noreferrer",
);
assert.equal(linkRelForDisclosure("editorial"), "noreferrer");
assert.equal(nextLeadStatus("new", "review"), "pending_review");
assert.equal(nextLeadStatus("pending_review", "approve"), "approved");
assert.equal(nextLeadStatus("active", "expire"), "expired");
assert.equal(
  isPlacementActive(
    {
      status: "active",
      startsAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-12-31T23:59:59Z",
    },
    new Date("2026-04-26T00:00:00Z"),
  ),
  true,
);
assert.equal(
  isPlacementActive(
    {
      status: "active",
      expiresAt: "2026-01-01T00:00:00Z",
    },
    new Date("2026-04-26T00:00:00Z"),
  ),
  false,
);

{
  const report = validateListingLeadPayload({
    kind: "tool",
    tierInterest: "featured",
    contactName: "Jane",
    contactEmail: "jane@example.com",
    companyName: "Example Co",
    listingTitle: "Example Tool",
    websiteUrl: "https://example.com",
    message: "Free listing with possible sponsorship.",
  });
  assert.equal(report.ok, true);
  assert.equal(report.data.kind, "tool");
  assert.equal(report.data.tierInterest, "featured");
}

{
  const report = validateListingLeadPayload({
    kind: "tool",
    contactName: "Jane",
    contactEmail: "jane@example.com",
    companyName: "Example Co",
    listingTitle: "Example Tool",
    websiteUrl: "http://example.com",
  });
  assert.equal(report.ok, false);
  assert.ok(report.errors.includes("tool leads require an https websiteUrl"));
}

{
  const report = validateListingLeadPayload({
    kind: "job",
    tierInterest: "sponsored",
    contactName: "Jane",
    contactEmail: "jane@example.com",
    companyName: "Example Co",
    listingTitle: "AI Engineer",
    applyUrl: "https://example.com/jobs/ai-engineer",
  });
  assert.equal(report.ok, true);
  assert.equal(report.data.kind, "job");
}

console.log("Commercial intake tests passed.");
