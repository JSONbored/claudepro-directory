import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

import { deriveCardDescription, orderFrontmatter } from "./content-schema.mjs";

const HISTORY_COMMIT = "063f265a96bec044bb7726ff9b751b98d3780784";
const repoRoot = process.cwd();
const statuslinesDir = path.join(repoRoot, "content", "statuslines");

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

function getConfigSnippet(metadata) {
  const example = (metadata?.examples ?? []).find((item) =>
    /config|configuration/i.test(String(item.title || ""))
  );
  return example?.code?.trim() || "";
}

function getScriptBody(historical, metadata) {
  if (String(historical.content || "").trim().startsWith("#!/")) {
    return String(historical.content).trim();
  }

  const scriptExample = (metadata?.examples ?? []).find((item) =>
    /script/i.test(String(item.title || ""))
  );
  return scriptExample?.code?.trim() || "";
}

function stripMarkdownTitleAndIntro(markdown) {
  const normalized = String(markdown || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  const lines = normalized.split("\n");
  if (/^#\s+/.test(lines[0])) lines.shift();
  while (lines[0] !== undefined && lines[0].trim() === "") lines.shift();
  if (/^[A-Z][A-Za-z0-9\s,.'()/-]+$/.test(lines[0] || "")) {
    lines.shift();
  }
  while (lines[0] !== undefined && lines[0].trim() === "") lines.shift();

  if ((lines[0] || "").trim() === "## Content") {
    lines.shift();
    while (lines[0] !== undefined && lines[0].trim() === "") lines.shift();

    while (lines[0] !== undefined && !/^##\s+/.test(lines[0])) {
      lines.shift();
    }
  }

  return lines.join("\n").trim();
}

function buildStatuslineBody({ historicalMarkdown, metadata, configSnippet }) {
  const parts = [];
  const inherited = stripMarkdownTitleAndIntro(historicalMarkdown);

  if (inherited) {
    parts.push(inherited);
  }

  const requirements = metadata?.requirements ?? [];
  if (requirements.length) {
    parts.push(`## Requirements\n\n${renderList(requirements)}`);
  }

  if (configSnippet) {
    parts.push(`## Configuration\n\n\`\`\`json\n${configSnippet}\n\`\`\``);
  }

  const extraExamples = (metadata?.examples ?? []).filter((example) => {
    const title = String(example.title || "");
    return !/config|configuration|script/i.test(title) && String(example.code || "").trim();
  });

  if (extraExamples.length) {
    parts.push(
      [
        "## Examples",
        ...extraExamples.flatMap((example) => [
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

for (const fileName of fs.readdirSync(statuslinesDir)) {
  if (!fileName.endsWith(".mdx")) continue;

  const slug = fileName.replace(/\.mdx$/, "");
  const filePath = path.join(statuslinesDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const historicalJson = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/statuslines/${slug}/${slug}.json`
  );
  const historicalMarkdown = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/statuslines/${slug}/${slug}.md`
  );

  if (!historicalJson.trim()) continue;

  const historical = JSON.parse(historicalJson);
  const metadata = historical.metadata ?? {};
  const scriptBody = getScriptBody(historical, metadata);
  const configSnippet = getConfigSnippet(metadata);
  const usageSnippet =
    metadata?.preview ||
    (metadata?.examples ?? []).find((example) => String(example.code || "").trim())?.code?.trim() ||
    "";
  const copySnippet = configSnippet || scriptBody || usageSnippet;
  const body = buildStatuslineBody({ historicalMarkdown, metadata, configSnippet });
  const nextData = orderFrontmatter({
    ...parsed.data,
    category: "statuslines",
    description: parsed.data.description || historical.description || "",
    cardDescription: deriveCardDescription(
      parsed.data.cardDescription || parsed.data.description || historical.description || ""
    ),
    documentationUrl: parsed.data.documentationUrl || historical.documentation_url || "",
    repoUrl: parsed.data.repoUrl || historical.documentation_url || "",
    installable: true,
    usageSnippet,
    copySnippet,
    configSnippet,
    scriptLanguage: "bash",
    scriptBody,
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

console.log(`Restored ${updated} statusline files from ${HISTORY_COMMIT}`);
