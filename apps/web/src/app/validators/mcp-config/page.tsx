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
  path: "/validators/mcp-config",
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
      { name: "Validators", url: `${siteConfig.url}/validators` },
      {
        name: "MCP config validator",
        url: `${siteConfig.url}/validators/mcp-config`,
      },
    ]),
    buildWebPageJsonLd({
      siteUrl: siteConfig.url,
      path: "/validators/mcp-config",
      name: "MCP config validator",
      description:
        "Browser-side MCP JSON validation with redacted output and copyable fixed snippets.",
      breadcrumbId: `${siteConfig.url}/validators/mcp-config#breadcrumb`,
    }),
  ];

  return (
    <div className="container-shell space-y-8 py-12">
      <JsonLd data={jsonLd} />
      <div className="space-y-4 border-b border-border/80 pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Validators", href: "/validators" },
            { label: "MCP config validator" },
          ]}
        />
        <span className="eyebrow">Validator</span>
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
