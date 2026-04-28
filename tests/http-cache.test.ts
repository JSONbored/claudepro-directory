import { describe, expect, it } from "vitest";

import { cachedJsonResponse } from "@/lib/http-cache";

describe("HTTP cache helpers", () => {
  it("accepts Cloudflare weak ETag revalidation headers", async () => {
    const first = await cachedJsonResponse(
      new Request("https://heyclau.de/api/registry/feed"),
      { ok: true },
    );
    const etag = first.headers.get("etag");
    expect(etag).toBeTruthy();

    const second = await cachedJsonResponse(
      new Request("https://heyclau.de/api/registry/feed", {
        headers: {
          "if-none-match": `W/${etag}`,
        },
      }),
      { ok: true },
    );

    expect(second.status).toBe(304);
  });

  it("attaches security headers to cacheable registry responses", async () => {
    const response = await cachedJsonResponse(
      new Request("https://heyclau.de/api/registry/feed"),
      { ok: true },
    );

    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(response.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(response.headers.get("permissions-policy")).toContain(
      "geolocation=()",
    );
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age=63072000",
    );
  });
});
