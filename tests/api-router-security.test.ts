import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { apiRouteDefinitions } from "../apps/web/src/lib/api/contracts";
import { repoRoot } from "./helpers/registry-fixtures";

const envMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: envMock.value }),
}));

function submissionRequest(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request("https://heyclau.de/api/submissions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://heyclau.de",
      "cf-connecting-ip": "198.51.100.99",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("central API router security", () => {
  beforeEach(() => {
    vi.resetModules();
    envMock.value = {};
  });

  it("normalizes forbidden-origin errors and attaches security headers", async () => {
    const { createApiHandler, apiJson } = await import("@/lib/api/router");
    const POST = createApiHandler("submissions.create", async () =>
      apiJson({ ok: true }),
    );

    const response = await POST(
      submissionRequest({ fields: {} }, { origin: "https://attacker.example" }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "forbidden_origin",
        message: "Forbidden origin",
      },
    });
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("rejects oversized JSON requests before body parsing", async () => {
    const { createApiHandler, apiJson } = await import("@/lib/api/router");
    const POST = createApiHandler("submissions.create", async () =>
      apiJson({ ok: true }),
    );

    const response = await POST(
      submissionRequest(
        { fields: {} },
        { "content-length": String(65 * 1024) },
      ),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "payload_too_large" },
    });
  });

  it("rejects invalid JSON content type for body-backed endpoints", async () => {
    const { createApiHandler, apiJson } = await import("@/lib/api/router");
    const POST = createApiHandler("submissions.create", async () =>
      apiJson({ ok: true }),
    );

    const response = await POST(
      new Request("https://heyclau.de/api/submissions", {
        method: "POST",
        headers: {
          "content-type": "text/plain",
          origin: "https://heyclau.de",
          "cf-connecting-ip": "198.51.100.100",
        },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_content_type" },
    });
  });

  it("returns Zod issue details for malformed query input", async () => {
    const { createApiHandler, apiJson } = await import("@/lib/api/router");
    const GET = createApiHandler("registry.search", async () =>
      apiJson({ ok: true }),
    );

    const response = await GET(
      new Request("https://heyclau.de/api/registry/search?limit=999", {
        headers: { origin: "https://heyclau.de" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "invalid_payload",
        details: [expect.objectContaining({ path: "limit" })],
      },
    });
  });

  it("rejects unknown listing lead fields before route code runs", async () => {
    const { createApiHandler, apiJson } = await import("@/lib/api/router");
    const POST = createApiHandler("listingLeads.create", async () =>
      apiJson({ ok: true }),
    );

    const response = await POST(
      new Request("https://heyclau.de/api/listing-leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://heyclau.de",
          "cf-connecting-ip": "198.51.100.101",
        },
        body: JSON.stringify({
          kind: "claim",
          tierInterest: "free",
          contactName: "Jane",
          contactEmail: "jane@example.com",
          companyName: "Example Co",
          listingTitle: "Example Listing",
          websiteUrl: "https://example.com/proof",
          message: "Claiming a listing.",
          unexpectedWriteFlag: true,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_payload" },
    });
  });

  it("accepts claim listing leads in the central contract", async () => {
    const parsed = apiRouteDefinitions["listingLeads.create"].bodySchema?.parse(
      {
        kind: "claim",
        tierInterest: "free",
        contactName: "Jane",
        contactEmail: "jane@example.com",
        companyName: "Example Co",
        listingTitle: "Example Listing",
        websiteUrl: "https://example.com/proof",
        message: "Claiming a listing.",
      },
    );

    expect(parsed).toMatchObject({
      kind: "claim",
      tierInterest: "free",
      websiteUrl: "https://example.com/proof",
    });
  });

  it("requires HTTPS apply URLs for job listing leads", async () => {
    expect(() =>
      apiRouteDefinitions["listingLeads.create"].bodySchema?.parse({
        kind: "job",
        tierInterest: "free",
        contactName: "Jane",
        contactEmail: "jane@example.com",
        companyName: "Example Co",
        listingTitle: "AI Engineer",
        applyUrl: "http://example.com/jobs/ai-engineer",
      }),
    ).not.toThrow();

    const { validateListingLeadPayload } =
      await import("@heyclaude/registry/commercial");
    const report = validateListingLeadPayload({
      kind: "job",
      tierInterest: "free",
      contactName: "Jane",
      contactEmail: "jane@example.com",
      companyName: "Example Co",
      listingTitle: "AI Engineer",
      applyUrl: "http://example.com/jobs/ai-engineer",
    });
    expect(report.ok).toBe(false);
    expect(report.errors).toContain("job leads require an https applyUrl");
  });

  it("configures Cloudflare-native rate-limit bindings for protected routes", () => {
    const wranglerConfig = fs.readFileSync(
      path.join(repoRoot, "apps/web/wrangler.jsonc"),
      "utf8",
    );
    const routerSource = fs.readFileSync(
      path.join(repoRoot, "apps/web/src/lib/api/router.ts"),
      "utf8",
    );

    expect(wranglerConfig).toContain('"ratelimits"');
    expect(wranglerConfig).not.toContain('"type": "ratelimit"');
    expect(wranglerConfig).toContain('"name": "API_REGISTRY_RATE_LIMIT"');
    expect(wranglerConfig).toContain('"name": "API_DYNAMIC_RATE_LIMIT"');
    expect(wranglerConfig).toContain('"name": "API_STRICT_RATE_LIMIT"');
    expect(apiRouteDefinitions["submissions.create"].rateLimit?.binding).toBe(
      "API_STRICT_RATE_LIMIT",
    );
    expect(apiRouteDefinitions["registry.search"].rateLimit?.binding).toBe(
      "API_REGISTRY_RATE_LIMIT",
    );
    expect(routerSource).toContain("binding.limit({ key })");
  });

  it("requires admin tokens for reviewed D1 jobs endpoints", async () => {
    const { GET } = await import("@/app/api/admin/jobs/health/route");
    const response = await GET(
      new Request("https://heyclau.de/api/admin/jobs/health", {
        headers: { origin: "https://heyclau.de" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "unauthorized" },
    });
  });

  it("validates reviewed D1 job payloads before admin route code runs", () => {
    expect(() =>
      apiRouteDefinitions["adminJobs.upsert"].bodySchema?.parse({
        slug: "reviewed-ai-engineer",
        title: "Reviewed AI Engineer",
        companyName: "Example Co",
        summary:
          "Build reviewed Claude workflow systems with source verification, external apply links, and private D1-backed publication state.",
        applyUrl: "http://example.com/jobs/reviewed-ai-engineer",
      }),
    ).toThrow(/URL must be HTTPS/);

    expect(
      apiRouteDefinitions["adminJobs.upsert"].bodySchema?.parse({
        slug: "reviewed-ai-engineer",
        title: "Reviewed AI Engineer",
        companyName: "Example Co",
        summary:
          "Build reviewed Claude workflow systems with source verification, external apply links, and private D1-backed publication state.",
        applyUrl: "https://example.com/jobs/reviewed-ai-engineer",
      }),
    ).toMatchObject({
      slug: "reviewed-ai-engineer",
      status: "pending_review",
      tier: "free",
      sourceKind: "employer_submitted",
    });
  });
});
