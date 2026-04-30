import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  callRegistryTool,
  READ_ONLY_TOOL_NAMES,
  TOOL_DEFINITIONS,
} from "../packages/mcp/src/registry.js";
import {
  jsonSchemaForTool,
  parseToolArguments,
  TOOL_INPUT_SCHEMAS,
} from "../packages/mcp/src/schemas.js";
import { repoRoot } from "./helpers/registry-fixtures";

const dataDir = path.join(repoRoot, "apps/web/public/data");

function firstSkill() {
  const payload = JSON.parse(
    fs.readFileSync(path.join(dataDir, "directory-index.json"), "utf8"),
  ) as {
    entries: Array<{ category: string; slug: string; title: string }>;
  };
  const entry = payload.entries.find(
    (candidate) => candidate.category === "skills",
  );
  if (!entry) throw new Error("Expected at least one skill entry.");
  return entry;
}

const skill = firstSkill();

describe("HeyClaude read-only MCP helpers", () => {
  it("keeps the MCP package publishable without private workspace dependencies", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "packages/mcp/package.json"), "utf8"),
    ) as {
      private?: boolean;
      bin?: Record<string, string>;
      dependencies?: Record<string, string>;
      exports?: Record<string, unknown>;
    };

    expect(packageJson.private).not.toBe(true);
    expect(packageJson.bin).toHaveProperty("heyclaude-mcp", "./src/cli.js");
    expect(packageJson.dependencies).not.toHaveProperty("@heyclaude/registry");
    expect(packageJson.dependencies).toHaveProperty("zod", "4.3.6");
    expect(Object.values(packageJson.dependencies ?? {})).not.toContain(
      "workspace:*",
    );
    expect(packageJson.exports).toHaveProperty("./server");
  });

  it("exposes only read-only registry tools", () => {
    expect(TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual(
      READ_ONLY_TOOL_NAMES,
    );
    expect(Object.keys(TOOL_INPUT_SCHEMAS)).toEqual(READ_ONLY_TOOL_NAMES);
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).not.toMatch(/create|submit|publish|write|delete|pr/i);
      expect(tool.description).toMatch(/read-only|fetch|search|list/i);
      expect(tool.inputSchema).toEqual(jsonSchemaForTool(tool.name));
      expect(tool.inputSchema).toMatchObject({
        type: "object",
        additionalProperties: false,
      });
      expect(JSON.stringify(tool.inputSchema)).not.toContain("$schema");
    }
  });

  it("validates MCP tool arguments from shared Zod schemas", async () => {
    expect(
      parseToolArguments("search_registry", {
        query: "discord",
        category: "mcp",
        platform: "cursor-rules",
        limit: 3,
      }),
    ).toEqual({
      query: "discord",
      category: "mcp",
      platform: "cursor-rules",
      limit: 3,
    });

    await expect(
      callRegistryTool(
        "get_entry_detail",
        { category: "../mcp", slug: "bad" },
        { dataDir },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "invalid_request",
        details: [
          expect.objectContaining({
            path: "category",
            code: "invalid_format",
          }),
        ],
      },
    });

    await expect(
      callRegistryTool(
        "search_registry",
        { limit: 100, unexpected: true },
        { dataDir },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "invalid_request",
        details: expect.arrayContaining([
          expect.objectContaining({ path: "limit", code: "too_big" }),
          expect.objectContaining({ path: "", code: "unrecognized_keys" }),
        ]),
      },
    });
  });

  it("searches registry artifacts with category and platform filters", async () => {
    const result = await callRegistryTool(
      "search_registry",
      {
        query: "skill",
        category: "skills",
        platform: "cursor-rules",
        limit: 5,
      },
      { dataDir },
    );
    expect(result).toMatchObject({
      ok: true,
      category: "skills",
      count: expect.any(Number),
    });
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.entries.length).toBeLessThanOrEqual(5);
    expect(result.entries[0].platforms).toContain("Cursor");
  });

  it("fetches entry detail and install guidance without write capabilities", async () => {
    const detail = await callRegistryTool(
      "get_entry_detail",
      { category: skill.category, slug: skill.slug },
      { dataDir },
    );
    expect(detail).toMatchObject({
      ok: true,
      key: `${skill.category}:${skill.slug}`,
      canonicalUrl: `https://heyclau.de/${skill.category}/${skill.slug}`,
    });

    const guidance = await callRegistryTool(
      "get_install_guidance",
      { category: skill.category, slug: skill.slug, platform: "claude" },
      { dataDir },
    );
    expect(guidance).toMatchObject({
      ok: true,
      key: `${skill.category}:${skill.slug}`,
      platform: "Claude",
    });
    expect(guidance).not.toHaveProperty("writePath");
  });

  it("returns compatibility and generated Cursor adapter content", async () => {
    const compatibility = await callRegistryTool(
      "get_compatibility",
      { slug: skill.slug },
      { dataDir },
    );
    expect(compatibility).toMatchObject({ ok: true, slug: skill.slug });
    expect(
      compatibility.platformCompatibility.map((item: any) => item.platform),
    ).toEqual(
      expect.arrayContaining([
        "Claude",
        "Codex",
        "Windsurf",
        "Gemini",
        "Cursor",
      ]),
    );

    const adapter = await callRegistryTool(
      "get_platform_adapter",
      { slug: skill.slug, platform: "cursor-rules" },
      { dataDir },
    );
    expect(adapter).toMatchObject({
      ok: true,
      platform: "Cursor",
      adapterAvailable: true,
      adapterPath: `/data/skill-adapters/cursor/${skill.slug}.mdc`,
    });
    expect(adapter.content).toContain(
      "Cursor does not natively install Agent Skills",
    );
  });

  it("lists distribution feeds from the manifest and feed index", async () => {
    const feeds = await callRegistryTool(
      "list_distribution_feeds",
      {},
      { dataDir },
    );
    expect(feeds).toMatchObject({
      ok: true,
      artifacts: {
        directory: "/data/directory-index.json",
        distributionFeeds: "/data/feeds",
      },
    });
    expect(feeds.categories.length).toBeGreaterThan(0);
    expect(feeds.platforms.map((item: any) => item.feedSlug)).toEqual(
      expect.arrayContaining(["claude", "cursor"]),
    );
  });

  it("handles malformed or missing requests without exposing mutations", async () => {
    await expect(
      callRegistryTool("unknown_write_tool", {}, { dataDir }),
    ).resolves.toMatchObject({ ok: false, error: { code: "invalid_request" } });

    await expect(
      callRegistryTool(
        "get_entry_detail",
        { category: "mcp", slug: "does-not-exist" },
        { dataDir },
      ),
    ).resolves.toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});
