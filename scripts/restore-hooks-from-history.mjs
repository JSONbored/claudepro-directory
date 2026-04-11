import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

import { deriveCardDescription, orderFrontmatter } from "./content-schema.mjs";

const HISTORY_COMMIT = "063f265a96bec044bb7726ff9b751b98d3780784";
const repoRoot = process.cwd();
const hooksDir = path.join(repoRoot, "content", "hooks");

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

function looksLikeShellCommand(value) {
  return /^(mkdir|touch|chmod|cp|mv|cat|echo|npm|npx|pnpm|yarn|pip|python|uv|node|jq|curl|claude|go|cargo|docker|git|find|sed|awk|bash|sh)\b/.test(
    value
  ) || value.startsWith("./");
}

function normalizeStepToCommand(step) {
  const trimmed = String(step || "").trim();
  if (!trimmed) return "";

  const colonIndex = trimmed.indexOf(":");
  const candidate =
    colonIndex >= 0 ? trimmed.slice(colonIndex + 1).trim() : trimmed;

  return looksLikeShellCommand(candidate) ? candidate : "";
}

function buildInstallCommand(steps) {
  const commands = steps.map(normalizeStepToCommand).filter(Boolean);
  if (!commands.length) return "";

  const combined = commands.slice(0, 3).join(" && ");
  if (combined.length <= 160) return combined;
  return commands[0];
}

function getConfigSnippet(metadata) {
  if (metadata?.configuration?.hookConfig) {
    return JSON.stringify(metadata.configuration.hookConfig, null, 2);
  }

  const configExample = (metadata?.examples ?? []).find((example) =>
    /configuration/i.test(String(example.title || ""))
  );

  return configExample?.code?.trim() || "";
}

function getScriptBody(metadata) {
  const configured = metadata?.configuration?.scriptContent;
  if (configured && String(configured).trim()) {
    return String(configured).trim();
  }

  const scriptExample = (metadata?.examples ?? []).find((example) => {
    const title = String(example.title || "");
    const language = String(example.language || "");
    return /hook script/i.test(title) || /^(bash|sh|shell)$/i.test(language);
  });

  return scriptExample?.code?.trim() || "";
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

  const firstSectionIndex = lines.findIndex((line) => /^##\s+/.test(line));
  if (firstSectionIndex >= 0) {
    return lines.slice(firstSectionIndex).join("\n").trim();
  }

  return "";
}

function renderList(items, ordered = false) {
  const clean = items.map((item) => String(item || "").trim()).filter(Boolean);
  if (!clean.length) return "";

  return clean
    .map((item, index) => `${ordered ? `${index + 1}.` : "-"} ${item}`)
    .join("\n");
}

function buildHookBody({ historicalMarkdown, metadata, configSnippet, scriptBody }) {
  const parts = [];
  const inheritedSections = stripMarkdownTitleAndIntro(historicalMarkdown);

  if (inheritedSections) {
    parts.push(inheritedSections);
  }

  const installSteps = metadata?.installation?.claudeCode?.steps ?? [];
  const configPaths = metadata?.installation?.claudeCode?.configPath ?? {};
  if (installSteps.length || Object.keys(configPaths).length) {
    let section = "## Installation\n\n";

    if (installSteps.length) {
      section += `${renderList(installSteps, true)}\n`;
    }

    const pathEntries = Object.entries(configPaths);
    if (pathEntries.length) {
      section += "\n### Config paths\n\n";
      section += renderList(
        pathEntries.map(([label, value]) => `${label}: \`${value}\``)
      );
      section += "\n";
    }

    parts.push(section.trim());
  }

  const requirements = metadata?.requirements ?? [];
  if (requirements.length) {
    parts.push(`## Requirements\n\n${renderList(requirements)}`);
  }

  if (configSnippet) {
    parts.push(`## Hook Configuration\n\n\`\`\`json\n${configSnippet}\n\`\`\``);
  }

  if (scriptBody) {
    parts.push(`## Hook Script\n\n\`\`\`bash\n${scriptBody}\n\`\`\``);
  }

  const extraExamples = (metadata?.examples ?? []).filter((example) => {
    const title = String(example.title || "");
    const code = String(example.code || "").trim();

    if (!code) return false;
    if (/configuration/i.test(title) && code === configSnippet.trim()) return false;
    if (/hook script/i.test(title) && code === scriptBody.trim()) return false;

    return true;
  });

  if (extraExamples.length) {
    const section = [
      "## Examples",
      ...extraExamples.flatMap((example) => {
        const lines = [];
        lines.push(`### ${String(example.title || "Example").trim()}`);

        if (example.description) {
          lines.push("", String(example.description).trim());
        }

        lines.push(
          "",
          `\`\`\`${String(example.language || "text").trim() || "text"}`,
          String(example.code || "").trim(),
          "```"
        );

        return lines;
      })
    ].join("\n");

    parts.push(section);
  }

  const troubleshooting = metadata?.troubleshooting ?? [];
  if (troubleshooting.length) {
    const section = [
      "## Troubleshooting",
      ...troubleshooting.flatMap((item) => [
        `### ${String(item.question || "Issue").trim()}`,
        "",
        String(item.answer || "").trim()
      ])
    ].join("\n");

    parts.push(section);
  }

  return parts.filter(Boolean).join("\n\n").trim();
}

let updated = 0;
let skipped = 0;

for (const fileName of fs.readdirSync(hooksDir)) {
  if (!fileName.endsWith(".mdx")) continue;

  const filePath = path.join(hooksDir, fileName);
  const slug = fileName.replace(/\.mdx$/, "");
  const historicalJsonPath = `apps/frontend/public/hooks/${slug}/${slug}.json`;
  const historicalMdPath = `apps/frontend/public/hooks/${slug}/${slug}.md`;
  const historicalJson = gitShow(HISTORY_COMMIT, historicalJsonPath);
  const historicalMarkdown = gitShow(HISTORY_COMMIT, historicalMdPath);

  if (!historicalJson.trim()) {
    console.warn(`Missing historical JSON for ${slug}`);
    skipped += 1;
    continue;
  }

  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const historical = JSON.parse(historicalJson);
  const metadata = historical.metadata ?? {};
  const installSteps = metadata?.installation?.claudeCode?.steps ?? [];
  const installCommand = buildInstallCommand(installSteps);
  const configSnippet = getConfigSnippet(metadata);
  const scriptBody = getScriptBody(metadata);
  const usageSnippet =
    installCommand ||
    normalizeStepToCommand(installSteps[0]) ||
    configSnippet ||
    scriptBody;
  const copySnippet = configSnippet || scriptBody || usageSnippet;
  const body = buildHookBody({
    historicalMarkdown,
    metadata,
    configSnippet,
    scriptBody
  });

  const nextData = orderFrontmatter({
    ...parsed.data,
    category: "hooks",
    description: parsed.data.description || historical.description || "",
    cardDescription: deriveCardDescription(
      parsed.data.cardDescription || parsed.data.description || historical.description || ""
    ),
    documentationUrl:
      parsed.data.documentationUrl || historical.documentation_url || "",
    installable: true,
    installCommand,
    usageSnippet,
    copySnippet,
    configSnippet,
    scriptLanguage: "bash",
    scriptBody,
    trigger: parsed.data.trigger || metadata.hook_type || "",
    hasTroubleshooting:
      parsed.data.hasTroubleshooting ??
      Boolean(Array.isArray(metadata.troubleshooting) && metadata.troubleshooting.length)
  });

  const nextSource = matter.stringify(body, nextData);

  if (nextSource !== source) {
    fs.writeFileSync(filePath, nextSource);
    updated += 1;
  }
}

console.log(`Restored ${updated} hook files from ${HISTORY_COMMIT}`);
if (skipped > 0) {
  console.log(`Skipped ${skipped} hook files without historical artifacts`);
}
