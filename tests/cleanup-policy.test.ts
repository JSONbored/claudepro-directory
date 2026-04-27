import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { repoRoot } from "./helpers/registry-fixtures";

const forbiddenPaths = [
  "apps/web/public/data/content-index.json",
  "apps/web/src/generated/content-category-spec.json",
  "apps/web/src/lib/entry-presentation.ts",
  "apps/web/src/lib/llms-export.ts",
  "apps/web/src/generated/legacy-vote-seed.json",
  "content/archive/legacy-data",
  "content/data/legacy-vote-seed.json",
  "scripts/content-schema.mjs",
  "scripts/export-legacy-vote-seed.mjs",
  "scripts/migrate-content.mjs",
  "scripts/normalize-skills-cross-platform.mjs",
  "scripts/remove-legacy-counters.mjs",
  "scripts/restore-collections-from-history.mjs",
  "scripts/restore-hooks-from-history.mjs",
  "scripts/restore-mcp-from-history.mjs",
  "scripts/restore-skills-from-history.mjs",
  "scripts/restore-statuslines-from-history.mjs",
  "scripts/submission-issue-lib.mjs",
  "scripts/test-all.mjs",
  "scripts/test-commercial-intake.mjs",
  "scripts/test-registry-artifacts.mjs",
  "scripts/test-seo-jsonld.mjs",
  "scripts/test-submission-intake.mjs",
];

const requiredTaskSections = [
  "Current Gate",
  "V2.1 Hardening",
  "Registry/API",
  "SEO + Content Quality",
  "UGC Growth",
  "Raycast",
  "Commercial Surfaces",
  "Testing/CI/Trunk",
  "Future Moat",
];

const forbiddenBenchmarkNames = [
  String.fromCharCode(
    99,
    117,
    114,
    115,
    111,
    114,
    46,
    100,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
  ),
  String.fromCharCode(
    67,
    117,
    114,
    115,
    111,
    114,
    32,
    68,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
  ),
];

describe("cleanup policy", () => {
  it("keeps retired generated truth and one-shot scripts out of active code", () => {
    for (const relativePath of forbiddenPaths) {
      expect(
        fs.existsSync(path.join(repoRoot, relativePath)),
        relativePath,
      ).toBe(false);
    }
  });

  it("keeps app code on canonical registry imports", () => {
    const sourceFiles = [
      "apps/web/src/lib/site.ts",
      "apps/web/src/components/submit-form.tsx",
      "apps/web/src/components/directory-entry-card.tsx",
      "apps/web/src/app/[category]/[slug]/page.tsx",
    ];

    for (const relativePath of sourceFiles) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source).not.toContain("@/generated/content-category-spec.json");
      expect(source).not.toContain("@/lib/entry-presentation");
      expect(source).not.toContain("@/lib/llms-export");
    }
  });

  it("keeps branch-era array artifact fallbacks out of active readers", () => {
    const retiredFallbacks = [
      {
        file: "apps/web/src/components/browse-directory.tsx",
        snippets: [
          "type DirectoryEntriesPayload =\n  | DirectoryEntry[]",
          "if (Array.isArray(payload)) return payload;",
        ],
      },
      {
        file: "scripts/validate-deployment-artifacts.mjs",
        snippets: ["if (Array.isArray(payload)) return payload;"],
      },
      {
        file: "integrations/raycast/src/feed.ts",
        snippets: [
          "if (Array.isArray(parsed))",
          "parsed.filter(isRaycastEntry)",
        ],
      },
    ];

    for (const { file, snippets } of retiredFallbacks) {
      const source = fs.readFileSync(path.join(repoRoot, file), "utf8");
      for (const snippet of snippets) {
        expect(source).not.toContain(snippet);
      }
    }
  });

  it("requires SITE_DB as the only dynamic-state D1 binding", () => {
    const wranglerConfig = fs.readFileSync(
      path.join(repoRoot, "apps/web/wrangler.jsonc"),
      "utf8",
    );
    const dbLib = fs.readFileSync(
      path.join(repoRoot, "apps/web/src/lib/db.ts"),
      "utf8",
    );
    expect(wranglerConfig).toContain('"binding": "SITE_DB"');
    expect(wranglerConfig).not.toContain("VOTES_DB");
    expect(dbLib).not.toContain("VOTES_DB");
  });

  it("tracks Trunk config and documents every migration", () => {
    expect(fs.existsSync(path.join(repoRoot, ".trunk/trunk.yaml"))).toBe(true);
    const docs = fs.readFileSync(
      path.join(repoRoot, "apps/web/DEPLOYMENT.md"),
      "utf8",
    );
    const migrations = fs
      .readdirSync(path.join(repoRoot, "apps/web/migrations"))
      .filter((fileName) => fileName.endsWith(".sql"));
    for (const migration of migrations) {
      expect(docs).toContain(migration);
    }
  });

  it("keeps TASKS.md as a verified active tracker", () => {
    const tasksPath = path.join(repoRoot, "TASKS.md");
    expect(fs.existsSync(tasksPath)).toBe(true);

    const tasks = fs.readFileSync(tasksPath, "utf8");
    for (const section of requiredTaskSections) {
      expect(tasks).toContain(`## ${section}`);
    }
    for (const forbiddenName of forbiddenBenchmarkNames) {
      expect(tasks.toLowerCase()).not.toContain(forbiddenName.toLowerCase());
    }

    const completedLines = tasks
      .split("\n")
      .filter((line) => line.trim().startsWith("- [x]"));
    expect(completedLines.length).toBeGreaterThan(0);
    for (const line of completedLines) {
      expect(line).toContain("Evidence:");
      expect(line).toContain("`");
    }

    const rootPackage = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    for (const scriptName of [
      "validate:clean",
      "validate:content:strict",
      "validate:category-spec",
      "validate:packages",
      "validate:raycast-feed",
      "test",
      "test:e2e",
      "validate:tasks",
      "type-check",
      "build",
    ]) {
      expect(rootPackage.scripts[scriptName]).toBeTruthy();
      expect(tasks).toContain(`pnpm ${scriptName}`);
    }
  });
});
