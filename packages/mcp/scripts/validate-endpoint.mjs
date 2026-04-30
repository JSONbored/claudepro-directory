#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { READ_ONLY_TOOL_NAMES } from "../src/registry.js";

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") continue;
    if (!value.startsWith("--")) continue;
    args.set(value.slice(2), argv[index + 1] ?? "");
    index += 1;
  }
  return args;
}

function normalizeEndpointUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const url = new URL(raw);
  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (url.protocol !== "https:" && !localHosts.has(url.hostname)) {
    throw new Error(
      "MCP endpoint validation requires HTTPS outside localhost.",
    );
  }
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/api/mcp";
  }
  return url;
}

function parseToolResult(result) {
  const text = result?.content?.find((item) => item?.type === "text")?.text;
  if (!text) throw new Error("MCP tool response did not include text content.");
  return JSON.parse(text);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function validateHttpGuards(endpointUrl) {
  const options = await fetch(endpointUrl, { method: "OPTIONS" });
  assert(options.status === 204, `OPTIONS returned ${options.status}`);
  assert(
    String(options.headers.get("access-control-allow-methods") || "").includes(
      "POST",
    ),
    "OPTIONS did not expose POST in access-control-allow-methods.",
  );
  assert(
    options.headers.get("cache-control") === "no-store",
    "OPTIONS did not return cache-control: no-store.",
  );

  const invalidContentType = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "text/plain",
    },
    body: "{}",
  });
  assert(
    invalidContentType.status === 415,
    `text/plain POST returned ${invalidContentType.status}`,
  );

  const forbiddenOrigin = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      origin: "https://example.invalid",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "forbidden-origin",
      method: "tools/list",
      params: {},
    }),
  });
  assert(
    forbiddenOrigin.status === 403,
    `forbidden origin POST returned ${forbiddenOrigin.status}`,
  );
}

async function validateMcpTools(endpointUrl) {
  const client = new Client({
    name: "heyclaude-endpoint-validator",
    version: "0.1.0",
  });
  const transport = new StreamableHTTPClientTransport(endpointUrl);

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name);
    assert(
      JSON.stringify(toolNames) === JSON.stringify(READ_ONLY_TOOL_NAMES),
      `Unexpected tool list: ${toolNames.join(", ")}`,
    );

    const search = parseToolResult(
      await client.callTool({
        name: "search_registry",
        arguments: { query: "mcp", limit: 2 },
      }),
    );
    assert(search.ok === true, "search_registry did not return ok: true.");
    assert(
      Array.isArray(search.entries) && search.entries.length > 0,
      "search_registry did not return entries.",
    );

    const first = search.entries[0];
    const detail = parseToolResult(
      await client.callTool({
        name: "get_entry_detail",
        arguments: { category: first.category, slug: first.slug },
      }),
    );
    assert(detail.ok === true, "get_entry_detail did not return ok: true.");
    assert(
      detail.key === `${first.category}:${first.slug}`,
      "get_entry_detail returned the wrong entry.",
    );

    const feeds = parseToolResult(
      await client.callTool({
        name: "list_distribution_feeds",
        arguments: {},
      }),
    );
    assert(feeds.ok === true, "list_distribution_feeds did not return ok.");
    assert(
      feeds.artifacts?.directory === "/data/directory-index.json",
      "list_distribution_feeds did not expose the directory artifact.",
    );

    const schema = parseToolResult(
      await client.callTool({
        name: "get_submission_schema",
        arguments: { category: "mcp" },
      }),
    );
    assert(schema.ok === true, "get_submission_schema did not return ok.");
    assert(
      schema.issueTemplate?.template === "submit-mcp.yml",
      "get_submission_schema did not return the MCP issue template.",
    );

    const urls = parseToolResult(
      await client.callTool({
        name: "build_submission_urls",
        arguments: {
          fields: {
            category: "mcp",
            name: "Endpoint Validation MCP",
            docs_url: "https://example.com/docs",
            description:
              "Endpoint validation draft for the HeyClaude MCP submission helpers.",
            install_command: "npx -y endpoint-validation-mcp",
            usage_snippet: "Use this draft to validate MCP route behavior.",
          },
        },
      }),
    );
    assert(urls.ok === true, "build_submission_urls did not return ok.");
    assert(
      String(urls.githubIssueUrl || "").includes("template=submit-mcp.yml"),
      "build_submission_urls did not return an MCP issue URL.",
    );

    const invalid = parseToolResult(
      await client.callTool({
        name: "search_registry",
        arguments: { limit: 100, unexpected: true },
      }),
    );
    assert(invalid.ok === false, "Invalid search_registry call did not fail.");
    assert(
      invalid.error?.code === "invalid_request",
      "Invalid search_registry call did not return invalid_request.",
    );
  } finally {
    await client.close();
  }
}

const args = parseArgs(process.argv.slice(2));
const endpointUrl = normalizeEndpointUrl(
  args.get("url") || process.env.MCP_ENDPOINT_URL,
);

if (!endpointUrl) {
  console.error(
    "Missing --url or MCP_ENDPOINT_URL for MCP endpoint validation.",
  );
  process.exit(1);
}

try {
  await validateHttpGuards(endpointUrl);
  await validateMcpTools(endpointUrl);
  console.log(`Validated HeyClaude MCP endpoint at ${endpointUrl.toString()}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
