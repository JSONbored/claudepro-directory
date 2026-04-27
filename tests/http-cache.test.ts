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
});
