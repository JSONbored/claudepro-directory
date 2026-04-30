import { describe, expect, it } from "vitest";

import { OPTIONS, POST } from "../apps/web/src/app/api/mcp/route";

function mcpRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://heyclau.de/api/mcp", {
    method: "POST",
    headers: {
      host: "heyclau.de",
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function json(response: Response) {
  return JSON.parse(await response.text());
}

describe("HeyClaude remote MCP route", () => {
  it("exposes CORS and no-store headers for MCP clients", () => {
    const response = OPTIONS(
      new Request("https://heyclau.de/api/mcp", {
        method: "OPTIONS",
        headers: { host: "heyclau.de" },
      }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "POST",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects browser origins outside the HeyClaude allowlist", async () => {
    const response = await POST(
      mcpRequest(
        { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
        { origin: "https://example.invalid" },
      ),
    );
    expect(response.status).toBe(403);
    expect(await json(response)).toMatchObject({
      ok: false,
      error: { code: "forbidden_origin" },
    });
  });

  it("lists read-only tools over Streamable HTTP", async () => {
    const response = await POST(
      mcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    );
    expect(response.status).toBe(200);

    const payload = await json(response);
    const toolNames = payload.result.tools.map(
      (tool: { name: string }) => tool.name,
    );
    expect(toolNames).toEqual([
      "search_registry",
      "get_entry_detail",
      "get_compatibility",
      "get_install_guidance",
      "get_platform_adapter",
      "list_distribution_feeds",
    ]);
    expect(toolNames.join(" ")).not.toMatch(/create|publish|write|delete/i);
  });

  it("searches public registry artifacts without write capabilities", async () => {
    const response = await POST(
      mcpRequest({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "search_registry",
          arguments: { query: "discord", limit: 2 },
        },
      }),
    );
    expect(response.status).toBe(200);

    const payload = await json(response);
    const result = JSON.parse(payload.result.content[0].text);
    expect(result).toMatchObject({ ok: true, count: 2 });
    expect(result.entries[0]).toHaveProperty("canonicalUrl");
    expect(JSON.stringify(result)).not.toMatch(/admin|token|secret/i);
  });

  it("returns schema validation errors for malformed MCP tool arguments", async () => {
    const response = await POST(
      mcpRequest({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "search_registry",
          arguments: { limit: 100, writePath: "/tmp/unsafe" },
        },
      }),
    );
    expect(response.status).toBe(200);

    const payload = await json(response);
    expect(payload.result.isError).toBe(true);
    const result = JSON.parse(payload.result.content[0].text);
    expect(result).toMatchObject({
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
});
