import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

type DirectoryEnvelope = {
  entries: Array<{
    category: string;
    slug: string;
    title: string;
  }>;
};

function getSmokeEntry() {
  const payload = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "apps/web/public/data/directory-index.json"),
      "utf8",
    ),
  ) as DirectoryEnvelope;
  const entry = payload.entries.find(
    (candidate) => candidate.category !== "tools",
  );
  if (!entry) throw new Error("No registry entry available for smoke test");
  return entry;
}

const entry = getSmokeEntry();

const htmlRoutes = [
  { path: "/", heading: /Discover the best Claude tools/i },
  { path: "/browse", heading: /Browse/i },
  { path: `/${entry.category}`, heading: new RegExp(entry.category, "i") },
  { path: `/${entry.category}/${entry.slug}`, heading: entry.title },
  { path: "/submit", heading: /Submit/i },
  { path: "/submissions", heading: /Submission queue/i },
  { path: "/about", heading: /A useful Claude directory/i },
  { path: "/advertise", heading: /Promote|Advertise/i },
  { path: "/jobs", heading: /Hiring roles/i },
  { path: "/jobs/post", heading: /Post/i },
  { path: "/tools", heading: /Tools/i },
  { path: "/tools/submit", heading: /Submit|Promote/i },
  { path: "/api-docs", heading: /Registry API/i },
  { path: "/claim", heading: /Claim|update/i },
  { path: "/contributors", heading: /Accepted contributor profiles/i },
  { path: "/trending", heading: /Popular|trending/i },
  { path: "/ecosystem", heading: /Ecosystem/i },
  { path: "/best/claude-native-tools", heading: /Tools for Claude-native/i },
];

test.describe("site smoke", () => {
  for (const route of htmlRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.ok(), route.path).toBe(true);
      await expect(
        page.getByRole("heading", { name: route.heading }).first(),
      ).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
    });
  }

  test("serves registry and LLM text exports", async ({ page }) => {
    for (const route of [
      "/llms.txt",
      "/llms-full.txt",
      `/${entry.category}/${entry.slug}/llms.txt`,
      "/api/registry/manifest",
      "/api/registry/categories",
      "/api/registry/search?q=claude&limit=5",
      "/api/registry/diff?since=2026-01-01&limit=5",
      `/api/registry/entries/${entry.category}/${entry.slug}`,
      `/api/registry/entries/${entry.category}/${entry.slug}/llms`,
      "/api/registry/feed",
    ]) {
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
    }
  });

  test("renders JSON-LD and canonical metadata that matches visible page content", async ({
    page,
  }) => {
    await page.goto(`/${entry.category}/${entry.slug}`);
    await expect(
      page.getByRole("heading", { name: entry.title }),
    ).toBeVisible();

    const jsonLdDocuments = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((scripts) =>
        scripts.flatMap((script) => {
          const parsed = JSON.parse(script.textContent || "null");
          return Array.isArray(parsed) ? parsed : [parsed];
        }),
      );
    expect(
      jsonLdDocuments.some(
        (document: any) => document?.["@type"] === "BreadcrumbList",
      ),
    ).toBe(true);
    expect(
      jsonLdDocuments.some(
        (document: any) => document?.["@type"] === "WebPage",
      ),
    ).toBe(true);
    expect(
      jsonLdDocuments.some(
        (document: any) =>
          document?.name === entry.title || document?.headline === entry.title,
      ),
    ).toBe(true);

    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical).toBe(
      `https://heyclau.de/${entry.category}/${entry.slug}`,
    );
  });

  test("keeps sitemap coverage for canonical public routes", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    const sitemap = await response.text();
    for (const route of [
      "https://heyclau.de/",
      "https://heyclau.de/browse",
      "https://heyclau.de/api-docs",
      "https://heyclau.de/claim",
      "https://heyclau.de/contributors",
      "https://heyclau.de/trending",
      "https://heyclau.de/best/claude-native-tools",
      `https://heyclau.de/${entry.category}/${entry.slug}`,
    ]) {
      expect(sitemap).toContain(route);
    }
  });

  test("registry API supports ETag revalidation", async ({ request }) => {
    const first = await request.get("/api/registry/manifest");
    expect(first.ok()).toBe(true);
    const etag = first.headers()["etag"];
    expect(etag).toBeTruthy();

    const second = await request.get("/api/registry/manifest", {
      headers: { "if-none-match": etag },
    });
    expect(second.status()).toBe(304);
  });

  test("intent metrics fail open when SITE_DB is unavailable", async ({
    request,
  }) => {
    const response = await request.post("/api/intent-events", {
      data: {
        type: "copy",
        entryKey: `${entry.category}:${entry.slug}`,
        sessionId: "smoke-session",
      },
    });
    expect(response.ok()).toBe(true);
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, stored: false });
  });

  test("community signals expose counts and fail open without SITE_DB", async ({
    request,
  }) => {
    const query =
      "/api/community-signals?targetKind=tool&targetKey=tool:cursor";
    const readResponse = await request.get(query);
    expect(readResponse.ok()).toBe(true);
    await expect(readResponse.json()).resolves.toMatchObject({
      ok: true,
      counts: { used: expect.any(Number), works: expect.any(Number) },
    });

    const writeResponse = await request.post("/api/community-signals", {
      data: {
        targetKind: "tool",
        targetKey: "tool:cursor",
        signalType: "used",
        clientId: "smoke-community-client",
        active: true,
      },
    });
    expect(writeResponse.ok()).toBe(true);
    await expect(writeResponse.json()).resolves.toMatchObject({
      ok: true,
      stored: false,
    });
  });
});
