import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { repoRoot } from "./helpers/registry-fixtures";

describe("crawler and AI citation policy", () => {
  it("keeps legitimate search and AI citation crawlers explicitly allowed", () => {
    const policy = robots();
    const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
    const userAgents = rules.flatMap((rule) =>
      Array.isArray(rule.userAgent)
        ? rule.userAgent
        : rule.userAgent
          ? [rule.userAgent]
          : [],
    );

    expect(userAgents).toEqual(
      expect.arrayContaining([
        "*",
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-SearchBot",
        "Google-Extended",
      ]),
    );
    expect(policy.sitemap).toBe("https://heyclau.de/sitemap.xml");
  });

  it("keeps llms.txt and corpus exports as cacheable security-headered discovery surfaces", () => {
    const routeSource = fs.readFileSync(
      path.join(repoRoot, "apps/web/src/app/llms.txt/route.ts"),
      "utf8",
    );
    const fullCorpus = fs.readFileSync(
      path.join(repoRoot, "apps/web/public/data/llms-full.txt"),
      "utf8",
    );

    expect(routeSource).toContain("applySecurityHeaders");
    expect(routeSource).toContain("content-type");
    expect(routeSource).toContain("cache-control");
    expect(fullCorpus).toContain("Base URL: https://heyclau.de");
    expect(fullCorpus).toContain("## Citation Facts");
    expect(fullCorpus).toContain("Canonical URL: https://heyclau.de/");
    expect(fullCorpus).toContain(
      "Platform compatibility: Claude (native-skill)",
    );
  });
});
