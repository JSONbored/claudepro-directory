import { describe, expect, it } from "vitest";

import { validateMcpConfigText } from "@/lib/mcp-config-validator";

describe("MCP config validator", () => {
  it("accepts a stdio MCP server and redacts secret-like env values", () => {
    const result = validateMcpConfigText(
      JSON.stringify({
        mcpServers: {
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: {
              GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_real_token_value",
              LOG_LEVEL: "debug",
            },
          },
        },
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.servers[0]).toMatchObject({
      name: "github",
      transport: "stdio",
      packageName: "@modelcontextprotocol/server-github",
    });
    expect(result.redactedSecretCount).toBe(1);
    expect(result.fixedConfigText).not.toContain("ghp_real_token_value");
    expect(result.fixedConfigText).toContain("${GITHUB_PERSONAL_ACCESS_TOKEN}");
    expect(result.reportText).toContain("Redacted secrets: 1");
  });

  it("blocks invalid JSON, missing packages, unsafe server names, and shell pipelines", () => {
    const result = validateMcpConfigText(`{
      "mcpServers": {
        "../bad": {
          "command": "npx && rm -rf /",
          "args": ["-y"]
        }
      }
    }`);

    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("Server name must be");
    expect(result.errors.join("\n")).toContain("not a shell pipeline");
  });

  it("reports non-string commands and detects package runners", () => {
    const result = validateMcpConfigText(
      JSON.stringify({
        mcpServers: {
          pnpmServer: {
            command: "pnpm",
            args: ["dlx", "@example/mcp-server"],
          },
          badCommand: {
            command: ["npx"],
          },
        },
      }),
    );

    expect(result.ok).toBe(false);
    expect(
      result.servers.find((server) => server.name === "pnpmServer"),
    ).toMatchObject({
      packageName: "@example/mcp-server",
    });
    expect(result.errors.join("\n")).toContain("command must be a string");
  });

  it("wraps bare server objects and warns on placeholders", () => {
    const result = validateMcpConfigText(
      JSON.stringify({
        linear: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-linear"],
          env: {
            LINEAR_API_KEY: "${LINEAR_API_KEY}",
          },
        },
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "Input looked like a bare servers object; output wraps it in mcpServers.",
        "linear: LINEAR_API_KEY is still a placeholder.",
      ]),
    );
    expect(JSON.parse(result.fixedConfigText)).toHaveProperty("mcpServers");
  });
});
