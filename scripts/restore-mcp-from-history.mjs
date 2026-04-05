import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

import { deriveCardDescription, orderFrontmatter } from "./content-schema.mjs";

const HISTORY_COMMIT = "063f265a96bec044bb7726ff9b751b98d3780784";
const repoRoot = process.cwd();
const mcpDir = path.join(repoRoot, "content", "mcp");

function gitShow(commit, filePath) {
  try {
    return execFileSync("git", ["show", `${commit}:${filePath}`], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024
    });
  } catch {
    return "";
  }
}

function renderList(items, ordered = false) {
  const clean = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (!clean.length) return "";

  return clean
    .map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${item}`)
    .join("\n");
}

function looksLikeCommand(value) {
  return /^(uvx|npx|npm|pnpm|yarn|pip|python|uv|docker|claude|brew|go|cargo)\b/.test(
    value
  );
}

function normalizeStepToCommand(step) {
  const trimmed = String(step || "").trim();
  if (!trimmed) return "";

  const colonIndex = trimmed.indexOf(":");
  const candidate =
    colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : trimmed;

  return looksLikeCommand(candidate) ? candidate : "";
}

function buildInstallCommand(steps) {
  const commands = steps.map(normalizeStepToCommand).filter(Boolean);
  if (!commands.length) return "";

  const combined = commands.slice(0, 2).join(" && ");
  return combined.length <= 160 ? combined : commands[0];
}

function getConfigSnippet(metadata) {
  if (metadata?.configuration?.claudeCode?.mcp) {
    return JSON.stringify(metadata.configuration.claudeCode.mcp, null, 2);
  }

  if (metadata?.configuration?.claudeDesktop?.mcp) {
    return JSON.stringify(metadata.configuration.claudeDesktop.mcp, null, 2);
  }

  const configExample = (metadata?.examples ?? []).find((example) =>
    /config|configuration|claude desktop/i.test(String(example.title || ""))
  );

  return configExample?.code?.trim() || "";
}

function stripMarkdownTitleAndIntro(markdown) {
  const normalized = String(markdown || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  const lines = normalized.split("\n");
  if (/^#\s+/.test(lines[0])) {
    lines.shift();
  }

  while (lines[0] !== undefined && lines[0].trim() === "") {
    lines.shift();
  }

  if (/^[A-Z][A-Za-z0-9\s,.'()/-]+$/.test(lines[0] || "")) {
    lines.shift();
  }

  while (lines[0] !== undefined && lines[0].trim() === "") {
    lines.shift();
  }

  return lines.join("\n").trim();
}

function buildMcpBody({ historicalMarkdown, metadata, configSnippet }) {
  const parts = [];
  const inherited = stripMarkdownTitleAndIntro(historicalMarkdown);

  if (inherited) {
    parts.push(inherited);
  }

  const installSteps = metadata?.installation?.claudeCode?.steps ?? [];
  const desktopSteps = metadata?.installation?.claudeDesktop?.steps ?? [];

  if (installSteps.length || desktopSteps.length) {
    const section = ["## Installation"];

    if (installSteps.length) {
      section.push("", "### Claude Code", "", renderList(installSteps, true));
    }

    if (desktopSteps.length) {
      section.push("", "### Claude Desktop", "", renderList(desktopSteps, true));
    }

    parts.push(section.join("\n").trim());
  }

  const requirements = metadata?.requirements ?? [];
  if (requirements.length) {
    parts.push(`## Requirements\n\n${renderList(requirements)}`);
  }

  if (configSnippet) {
    parts.push(`## Configuration\n\n\`\`\`json\n${configSnippet}\n\`\`\``);
  }

  const examples = (metadata?.examples ?? []).filter((example) =>
    String(example.code || "").trim()
  );

  if (examples.length) {
    parts.push(
      [
        "## Examples",
        ...examples.flatMap((example) => [
          `### ${String(example.title || "Example").trim()}`,
          "",
          example.description ? String(example.description).trim() : "",
          example.description ? "" : null,
          `\`\`\`${String(example.language || "text").trim() || "text"}`,
          String(example.code || "").trim(),
          "```"
        ].filter(Boolean))
      ].join("\n")
    );
  }

  const security = metadata?.security ?? [];
  if (security.length) {
    parts.push(`## Security\n\n${renderList(security)}`);
  }

  const troubleshooting = metadata?.troubleshooting ?? [];
  if (troubleshooting.length) {
    parts.push(
      [
        "## Troubleshooting",
        ...troubleshooting.flatMap((item) => [
          `### ${String(item.question || item.issue || "Issue").trim()}`,
          "",
          String(item.answer || item.solution || "").trim()
        ])
      ].join("\n")
    );
  }

  return parts.filter(Boolean).join("\n\n").trim();
}

let updated = 0;

for (const fileName of fs.readdirSync(mcpDir)) {
  if (!fileName.endsWith(".mdx")) continue;

  const slug = fileName.replace(/\.mdx$/, "");
  const filePath = path.join(mcpDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const historicalJson = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/mcp/${slug}/${slug}.json`
  );
  const historicalMarkdown = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/mcp/${slug}/${slug}.md`
  );

  if (!historicalJson.trim()) continue;

  const historical = JSON.parse(historicalJson);
  const metadata = historical.metadata ?? {};
  const installSteps = metadata?.installation?.claudeCode?.steps ?? [];
  const installCommand = buildInstallCommand(installSteps);
  const configSnippet = getConfigSnippet(metadata);
  const usageSnippet =
    installCommand ||
    (metadata?.examples ?? []).find((example) => String(example.code || "").trim())?.code?.trim() ||
    "";
  const copySnippet = configSnippet || usageSnippet;
  const repoUrl = parsed.data.repoUrl || historical.documentation_url || "";
  const body = buildMcpBody({ historicalMarkdown, metadata, configSnippet });
  const nextData = orderFrontmatter({
    ...parsed.data,
    category: "mcp",
    description: parsed.data.description || historical.description || "",
    cardDescription: deriveCardDescription(
      parsed.data.cardDescription || parsed.data.description || historical.description || ""
    ),
    documentationUrl: parsed.data.documentationUrl || historical.documentation_url || "",
    repoUrl,
    installable: true,
    installCommand,
    usageSnippet,
    copySnippet,
    configSnippet,
    estimatedSetupTime:
      parsed.data.estimatedSetupTime || metadata?.installation?.claudeCode?.timeEstimate || "",
    difficulty:
      parsed.data.difficulty || metadata?.installation?.claudeCode?.difficulty || "",
    prerequisites: Array.isArray(metadata.requirements)
      ? metadata.requirements.map(String)
      : parsed.data.prerequisites || [],
    hasTroubleshooting:
      parsed.data.hasTroubleshooting ??
      Boolean(Array.isArray(metadata.troubleshooting) && metadata.troubleshooting.length),
    hasPrerequisites:
      parsed.data.hasPrerequisites ??
      Boolean(Array.isArray(metadata.requirements) && metadata.requirements.length)
  });

  const nextSource = matter.stringify(body, nextData);
  if (nextSource !== source) {
    fs.writeFileSync(filePath, nextSource);
    updated += 1;
  }
}

console.log(`Restored ${updated} MCP files from ${HISTORY_COMMIT}`);
