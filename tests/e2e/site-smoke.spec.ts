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
  { path: "/about", heading: /A useful Claude directory/i },
  { path: "/advertise", heading: /Promote|Advertise/i },
  { path: "/jobs", heading: /Hiring roles/i },
  { path: "/jobs/post", heading: /Post/i },
  { path: "/tools", heading: /Tools/i },
  { path: "/tools/submit", heading: /Submit|Promote/i },
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
      `/api/registry/entries/${entry.category}/${entry.slug}`,
      `/api/registry/entries/${entry.category}/${entry.slug}/llms`,
    ]) {
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
    }
  });
});
