import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const directoryEntriesMock = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: envMock.value }),
}));

vi.mock("@/lib/content", () => ({
  getDirectoryEntries: directoryEntriesMock,
}));

function validFields(overrides: Record<string, string> = {}) {
  return {
    name: "Direct Submit API Asset",
    slug: "direct-submit-api-asset",
    category: "mcp",
    contact_email: "dev@example.com",
    docs_url: "https://example.com/docs",
    description:
      "MCP server that exercises the direct website submission path.",
    card_description: "Exercises direct website submission.",
    install_command: "npx -y direct-submit-api-asset",
    usage_snippet:
      "claude mcp add direct-submit-api-asset -- npx -y direct-submit-api-asset",
    ...overrides,
  };
}

function request(
  body: Record<string, unknown>,
  ip = "203.0.113.10",
  headers: Record<string, string> = {},
) {
  return new Request("https://heyclau.de/api/submissions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://heyclau.de",
      "cf-connecting-ip": ip,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function githubIssueResponse(number = 42) {
  return new Response(
    JSON.stringify({
      number,
      html_url: `https://github.com/JSONbored/claudepro-directory/issues/${number}`,
    }),
    {
      status: 201,
      headers: { "content-type": "application/json" },
    },
  );
}

describe("website submission API", () => {
  beforeEach(() => {
    directoryEntriesMock.mockReset();
    directoryEntriesMock.mockResolvedValue([]);
    envMock.value = {
      GITHUB_SUBMISSIONS_TOKEN: "test-token",
      GITHUB_SUBMISSIONS_REPO: "JSONbored/claudepro-directory",
    };
    process.env.GITHUB_SUBMISSIONS_TOKEN = "test-token";
    process.env.GITHUB_SUBMISSION_TOKEN = "";
    process.env.GITHUB_TOKEN = "";
    process.env.GITHUB_SUBMISSIONS_REPO = "JSONbored/claudepro-directory";
    process.env.GITHUB_SUBMISSION_REPO = "";
    process.env.GITHUB_REPOSITORY = "";
    process.env.TURNSTILE_SECRET_KEY = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(githubIssueResponse())),
    );
  });

  it("creates a reviewable GitHub issue without writing content directly", async () => {
    const { POST } = await import("@/app/api/submissions/route");
    const response = await POST(
      request({ fields: validFields() }, "203.0.113.11"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      category: "mcp",
      slug: "direct-submit-api-asset",
      issueUrl: "https://github.com/JSONbored/claudepro-directory/issues/42",
      issueNumber: 42,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchMock = fetch as unknown as {
      mock: { calls: Array<[RequestInfo | URL, RequestInit]> };
    };
    const [, init] = fetchMock.mock.calls[0];
    const issuePayload = JSON.parse(String(init.body));
    expect(issuePayload.title).toBe(
      "Submit MCP Server: Direct Submit API Asset",
    );
    expect(issuePayload.body).toContain("### Name");
    expect(issuePayload.body).toContain("Direct Submit API Asset");
    expect(issuePayload.labels).toEqual([
      "content-submission",
      "needs-review",
      "community-mcp",
    ]);
  });

  it("rejects invalid submission fields before GitHub issue creation", async () => {
    const { POST } = await import("@/app/api/submissions/route");
    const response = await POST(
      request({ fields: { name: "Incomplete" } }, "203.0.113.12"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "invalid_submission",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects duplicate slugs before GitHub issue creation", async () => {
    directoryEntriesMock.mockResolvedValue([
      { category: "mcp", slug: "direct-submit-api-asset" },
    ]);
    const { POST } = await import("@/app/api/submissions/route");
    const response = await POST(
      request({ fields: validFields() }, "203.0.113.13"),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "duplicate_slug",
      category: "mcp",
      slug: "direct-submit-api-asset",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("silently discards honeypot submissions", async () => {
    const { POST } = await import("@/app/api/submissions/route");
    const response = await POST(
      request(
        { fields: validFields(), honeypot: "https://spam.example" },
        "203.0.113.14",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      queued: false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires Turnstile when the secret is configured", async () => {
    envMock.value = {
      ...envMock.value,
      TURNSTILE_SECRET_KEY: "turnstile-secret",
    };
    process.env.TURNSTILE_SECRET_KEY = "turnstile-secret";
    const { POST } = await import("@/app/api/submissions/route");
    const response = await POST(
      request({ fields: validFields() }, "203.0.113.15"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "turnstile_failed",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a GitHub fallback when issue creation is not configured", async () => {
    envMock.value = {};
    process.env.GITHUB_SUBMISSIONS_TOKEN = "";
    process.env.GITHUB_SUBMISSION_TOKEN = "";
    process.env.GITHUB_TOKEN = "";
    const { POST } = await import("@/app/api/submissions/route");
    const response = await POST(
      request({ fields: validFields() }, "203.0.113.16"),
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toMatchObject({ error: "submissions_not_configured" });
    expect(String(body.fallbackUrl)).toContain(
      "https://github.com/JSONbored/claudepro-directory/issues/new",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rate limits repeated direct submissions by client IP", async () => {
    const { POST } = await import("@/app/api/submissions/route");
    for (let index = 0; index < 8; index += 1) {
      const response = await POST(
        request(
          {
            fields: validFields({
              slug: `direct-submit-api-asset-${index}`,
            }),
          },
          "203.0.113.17",
        ),
      );
      expect(response.status).toBe(200);
    }

    const limited = await POST(
      request(
        {
          fields: validFields({
            slug: "direct-submit-api-asset-limited",
          }),
        },
        "203.0.113.17",
      ),
    );
    expect(limited.status).toBe(429);
    await expect(limited.json()).resolves.toEqual({ error: "rate_limited" });
  });
});
