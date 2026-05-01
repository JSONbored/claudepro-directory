import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { McpConfigValidatorClient } from "@/components/mcp-config-validator-client";
import { buildPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@heyclaude/registry/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "MCP config validator",
  description:
    "Validate MCP server configuration JSON for Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, and other AI tools with safe redacted output.",
  path: "/tools/mcp-config-validator",
  keywords: [
    "mcp config validator",
    "claude desktop mcp",
    "cursor mcp",
    "model context protocol config",
  ],
});

export default function McpConfigValidatorPage() {
  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: "Home", url: siteConfig.url },
      { name: "Tools", url: `${siteConfig.url}/tools` },
      {
        name: "MCP config validator",
        url: `${siteConfig.url}/tools/mcp-config-validator`,
      },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/tools/mcp-config-validator",
      name: "MCP config validator",
      description:
        "Browser-side MCP JSON validation with redacted output and copyable fixed snippets.",
      breadcrumbId: `${siteConfig.url}/tools/mcp-config-validator#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Tools", href: "/tools" },
            { label: "MCP config validator" },
          ]}
        />
        <span className="eyebrow">Free tool</span>
        <h1 className="section-title">MCP config validator</h1>
        <p className="max-w-3xl text-base leading-8 text-muted-foreground">
          Paste MCP configuration JSON for Claude Desktop, Claude Code, Cursor,
          VS Code, Windsurf, or other clients. The validator checks shape,
          package targets, placeholders, risky shell syntax, remote URLs, and
          secret-like values without uploading or storing the config.
        </p>
      </div>
      <McpConfigValidatorClient />
    </div>
  );
}
