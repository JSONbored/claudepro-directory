import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

import { deriveCardDescription, orderFrontmatter } from "./content-schema.mjs";

const HISTORY_COMMIT = "063f265a96bec044bb7726ff9b751b98d3780784";
const repoRoot = process.cwd();
const skillsDir = path.join(repoRoot, "content", "skills");

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

function looksLikeCommand(value) {
  return /^(pip|python|uv|npm|npx|pnpm|yarn|claude|curl|git|docker)\b/.test(
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
  return commands[0];
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
  }

  if (/^#\s+/.test(lines[0] || "")) {
    lines.shift();
    while (lines[0] !== undefined && lines[0].trim() === "") lines.shift();
  }

  return lines.join("\n").trim();
}

function getUsageSnippet(metadata) {
  const promptExample = (metadata?.examples ?? []).find((example) => {
    const code = String(example.code || "").trim();
    return code.startsWith("\"") || code.startsWith("Create ") || code.startsWith("Build ");
  });

  if (promptExample?.code) return String(promptExample.code).trim();
  return "";
}

let updated = 0;

for (const fileName of fs.readdirSync(skillsDir)) {
  if (!fileName.endsWith(".mdx")) continue;

  const slug = fileName.replace(/\.mdx$/, "");
  const filePath = path.join(skillsDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const historicalJson = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/skills/${slug}/${slug}.json`
  );
  const historicalMarkdown = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/skills/${slug}/${slug}.md`
  );

  if (!historicalJson.trim()) continue;

  const historical = JSON.parse(historicalJson);
  const metadata = historical.metadata ?? {};
  const installSteps = metadata?.installation?.claudeCode?.steps ?? [];
  const installCommand = buildInstallCommand(installSteps);
  const usageSnippet = getUsageSnippet(metadata) || installCommand || "";
  const copySnippet =
    (metadata?.examples ?? []).find((example) => String(example.code || "").trim())?.code?.trim() ||
    usageSnippet;
  const body =
    stripMarkdownTitleAndIntro(historicalMarkdown) ||
    String(historical.content || "").trim() ||
    parsed.content.trim();
  const nextData = orderFrontmatter({
    ...parsed.data,
    category: "skills",
    description: parsed.data.description || historical.description || "",
    cardDescription: deriveCardDescription(
      parsed.data.cardDescription || parsed.data.description || historical.description || ""
    ),
    documentationUrl: parsed.data.documentationUrl || historical.documentation_url || "",
    repoUrl: parsed.data.repoUrl || historical.documentation_url || "",
    downloadUrl: parsed.data.downloadUrl || historical.download_url || "",
    installable: true,
    installCommand,
    usageSnippet,
    copySnippet,
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

console.log(`Restored ${updated} skill files from ${HISTORY_COMMIT}`);
