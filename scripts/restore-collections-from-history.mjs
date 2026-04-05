import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

import { deriveCardDescription, orderFrontmatter } from "./content-schema.mjs";

const HISTORY_COMMIT = "063f265a96bec044bb7726ff9b751b98d3780784";
const repoRoot = process.cwd();
const collectionsDir = path.join(repoRoot, "content", "collections");

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
  return items
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${item}`)
    .join("\n");
}

function stripMarkdownTitle(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").trim().split("\n");
  if (lines[0] && /^#\s+/.test(lines[0])) lines.shift();
  while (lines[0] && !lines[0].trim()) lines.shift();
  return lines.join("\n").trim();
}

function renderSection(section) {
  const type = String(section?.type || "");

  if (type === "tldr") {
    const parts = ["## TL;DR", "", String(section.content || "").trim()];
    if (Array.isArray(section.keyPoints) && section.keyPoints.length) {
      parts.push("", renderList(section.keyPoints));
    }
    return parts.join("\n");
  }

  if (type === "text") {
    return String(section.content || "").trim();
  }

  if (type === "callout") {
    return [
      `## ${String(section.title || "Overview").trim()}`,
      "",
      String(section.content || "").trim()
    ].join("\n");
  }

  if (type === "feature_grid") {
    const parts = [`## ${String(section.title || "Included").trim()}`];
    if (section.description) {
      parts.push("", String(section.description).trim());
    }
    if (Array.isArray(section.features) && section.features.length) {
      parts.push(
        "",
        ...section.features.map((feature) =>
          `- **${String(feature.title || "").trim()}**${feature.badge ? ` (${String(feature.badge).trim()})` : ""}: ${String(feature.description || "").trim()}`
        )
      );
    }
    return parts.join("\n");
  }

  if (type === "heading") {
    return `## ${String(section.content || "").trim()}`;
  }

  return "";
}

function buildCollectionBody({ historicalMarkdown, metadata }) {
  const parts = [];
  const base = stripMarkdownTitle(historicalMarkdown);
  if (base) parts.push(base);

  const sections = Array.isArray(metadata.sections) ? metadata.sections : [];
  const renderedSections = sections
    .map(renderSection)
    .filter(Boolean)
    .filter((section) => !/##\s*related content/i.test(section));
  if (renderedSections.length) {
    parts.push(...renderedSections);
  }

  if (Array.isArray(metadata.prerequisites) && metadata.prerequisites.length) {
    parts.push(`## Prerequisites\n\n${renderList(metadata.prerequisites)}`);
  }

  if (Array.isArray(metadata.installation_order) && metadata.installation_order.length) {
    parts.push(
      `## Recommended Order\n\n${renderList(
        metadata.installation_order.map((slug) => `\`${slug}\``),
        true
      )}`
    );
  }

  if (Array.isArray(metadata.troubleshooting) && metadata.troubleshooting.length) {
    parts.push(
      [
        "## Troubleshooting",
        ...metadata.troubleshooting.flatMap((item) => [
          `### ${String(item.issue || "Issue").trim()}`,
          "",
          String(item.solution || "").trim()
        ])
      ].join("\n")
    );
  }

  return parts.filter(Boolean).join("\n\n").trim();
}

let updated = 0;

for (const fileName of fs.readdirSync(collectionsDir)) {
  if (!fileName.endsWith(".mdx")) continue;

  const slug = fileName.replace(/\.mdx$/, "");
  const filePath = path.join(collectionsDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);

  const historicalJson = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/collections/${slug}/${slug}.json`
  );
  const historicalMarkdown = gitShow(
    HISTORY_COMMIT,
    `apps/frontend/public/collections/${slug}/${slug}.md`
  );

  if (!historicalJson.trim()) continue;

  const historical = JSON.parse(historicalJson);
  const metadata = historical.metadata ?? {};
  const items = Array.isArray(metadata.items)
    ? metadata.items.map((item) => ({
        slug: String(item.slug),
        category: String(item.category)
      }))
    : [];
  const installationOrder = Array.isArray(metadata.installation_order)
    ? metadata.installation_order.map(String)
    : [];
  const prerequisites = Array.isArray(metadata.prerequisites)
    ? metadata.prerequisites.map(String)
    : [];
  const useCases = Array.isArray(metadata.use_cases) ? metadata.use_cases : [];
  const usageSnippet =
    installationOrder.length > 0
      ? `Start with ${installationOrder.slice(0, 3).map((item) => `\`${item}\``).join(" → ")}`
      : useCases[0] || "";

  const body = buildCollectionBody({ historicalMarkdown, metadata });
  const nextData = orderFrontmatter({
    ...parsed.data,
    category: "collections",
    description: parsed.data.description || historical.description || "",
    cardDescription: deriveCardDescription(
      parsed.data.cardDescription || parsed.data.description || historical.description || ""
    ),
    installable: false,
    usageSnippet,
    copySnippet: usageSnippet,
    items,
    installationOrder,
    estimatedSetupTime: metadata.estimated_setup_time || "",
    difficulty: metadata.difficulty || "",
    prerequisites,
    hasTroubleshooting:
      parsed.data.hasTroubleshooting ??
      Boolean(Array.isArray(metadata.troubleshooting) && metadata.troubleshooting.length),
    hasPrerequisites:
      parsed.data.hasPrerequisites ??
      Boolean(Array.isArray(metadata.prerequisites) && metadata.prerequisites.length)
  });

  const nextSource = matter.stringify(body, nextData);
  if (nextSource !== source) {
    fs.writeFileSync(filePath, nextSource);
    updated += 1;
  }
}

console.log(`Restored ${updated} collection files from ${HISTORY_COMMIT}`);
