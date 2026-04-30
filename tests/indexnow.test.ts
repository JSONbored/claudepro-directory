import { describe, expect, it } from "vitest";

import {
  DEFAULT_INDEXNOW_KEY,
  buildIndexNowPayload,
  chunkUrls,
  extractSitemapUrls,
  hostFromSiteUrl,
  isProductionIndexNowHost,
  keyLocationFor,
  normalizeSubmittedUrls,
} from "../scripts/lib/indexnow.mjs";

describe("IndexNow submission helpers", () => {
  it("builds the production key location from the public key file", () => {
    expect(hostFromSiteUrl("https://heyclau.de")).toBe("heyclau.de");
    expect(isProductionIndexNowHost("heyclau.de")).toBe(true);
    expect(keyLocationFor("https://heyclau.de", DEFAULT_INDEXNOW_KEY)).toBe(
      `https://heyclau.de/${DEFAULT_INDEXNOW_KEY}.txt`,
    );
  });

  it("extracts and normalizes same-host HTTPS sitemap URLs", () => {
    const urls = extractSitemapUrls(`
      <urlset>
        <url><loc>https://heyclau.de/agents</loc></url>
        <url><loc>https://heyclau.de/mcp#ignored</loc></url>
        <url><loc>https://dev.heyclau.de/preview</loc></url>
        <url><loc>http://heyclau.de/insecure</loc></url>
      </urlset>
    `);

    expect(normalizeSubmittedUrls(urls, "heyclau.de")).toEqual([
      "https://heyclau.de/agents",
      "https://heyclau.de/mcp",
    ]);
  });

  it("validates IndexNow payload shape before submission", () => {
    expect(
      buildIndexNowPayload({
        host: "heyclau.de",
        key: DEFAULT_INDEXNOW_KEY,
        keyLocation: keyLocationFor("https://heyclau.de"),
        urlList: ["https://heyclau.de/skills"],
      }),
    ).toMatchObject({
      host: "heyclau.de",
      key: DEFAULT_INDEXNOW_KEY,
      urlList: ["https://heyclau.de/skills"],
    });

    expect(() =>
      buildIndexNowPayload({
        host: "heyclau.de",
        key: "not-a-key",
        keyLocation: "https://heyclau.de/not-a-key.txt",
        urlList: ["https://heyclau.de/skills"],
      }),
    ).toThrow(/32-character/);
  });

  it("chunks URL batches deterministically", () => {
    expect(chunkUrls(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e"],
    ]);
  });
});
