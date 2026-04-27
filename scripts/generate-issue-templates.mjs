import fs from "node:fs";
import path from "node:path";

import { buildIssueTemplateSpec, categorySpec } from "@heyclaude/registry";

const repoRoot = process.cwd();
const templateDir = path.join(repoRoot, ".github", "ISSUE_TEMPLATE");
const checkOnly = process.argv.includes("--check");

const categoryExamples = {
  agents: "Agent Skills Framework Engineer",
  collections: "Claude Code starter kit",
  commands: "Review staged changes",
  guides: "Set up Claude Code hooks",
  hooks: "Block dangerous shell commands",
  mcp: "Airtable MCP Server",
  rules: "Security-first React components",
  skills: "Raycast extension engineer",
  statuslines: "Git branch and model statusline",
};

const fieldPlaceholders = {
  name: "Human-readable listing name",
  slug: "kebab-case-slug",
  category: "category key",
  github_url: "https://github.com/owner/repo",
  docs_url: "https://example.com/docs",
  author: "GitHub handle, company, or maintainer name",
  contact_email: "you@example.com",
  tags: "claude, mcp, automation",
  description: "Explain what this does, why it matters, and when to use it.",
  card_description: "Short browse-card preview text.",
  install_command: "npx -y @org/package",
  usage_snippet: "Show the exact command or config someone should run.",
  command_syntax: "/command [path] [options]",
  full_copyable_content:
    "Paste the complete usable prompt, config, script, or rule.",
  config_snippet: "JSON, TOML, or shell config example.",
  download_url: "https://github.com/owner/repo/releases/latest",
  retrieval_sources: "https://example.com/docs\nhttps://github.com/owner/repo",
  tested_platforms: "Claude Code, Claude Desktop, Codex",
  guide_content: "Paste the full guide content.",
  items: "mcp/example\nskills/example",
  script_language: "bash",
};

function quote(value) {
  return JSON.stringify(String(value ?? ""));
}

function linesForField(field, category) {
  const title = field.label || field.id.replaceAll("_", " ");
  const isTextArea = field.type === "textarea";
  const type =
    field.type === "select" ? "dropdown" : isTextArea ? "textarea" : "input";
  const lines = [
    `  - type: ${type}`,
    `    id: ${field.id}`,
    "    attributes:",
    `      label: ${quote(title)}`,
  ];

  const descriptionParts = [];
  if (field.required) descriptionParts.push("Required.");
  if (field.id === "download_url") {
    descriptionParts.push("Do not request local /downloads hosting.");
  }
  if (field.id === "github_url" || field.id === "docs_url") {
    descriptionParts.push("Do not use affiliate, referral, or tracking URLs.");
  }
  if (descriptionParts.length) {
    lines.push(`      description: ${quote(descriptionParts.join(" "))}`);
  }

  if (field.type === "select" && Array.isArray(field.options)) {
    lines.push("      options:");
    for (const option of field.options)
      lines.push(`        - ${quote(option)}`);
  } else if (field.id === "category") {
    lines.push(`      value: ${quote(category)}`);
  } else {
    const placeholder =
      fieldPlaceholders[field.id] ||
      (field.id === "name" ? categoryExamples[category] : "");
    if (placeholder) lines.push(`      placeholder: ${quote(placeholder)}`);
  }

  if (field.render) lines.push(`      render: ${quote(field.render)}`);
  lines.push(
    "    validations:",
    `      required: ${field.required ? "true" : "false"}`,
  );
  return lines;
}

function renderIssueTemplate(category) {
  const spec = buildIssueTemplateSpec(category);
  if (!spec) throw new Error(`Unknown category: ${category}`);
  const label = categorySpec.categories[category]?.label || category;
  const singularLabel = label.replace(/s$/, "");
  const lines = [
    `name: ${quote(`Submit ${singularLabel}`)}`,
    `description: ${quote(`Submit a ${label.toLowerCase()} entry for HeyClaude.`)}`,
    `title: ${quote(`Submit ${singularLabel}: `)}`,
    "labels:",
    ...spec.labels.map((labelName) => `  - ${quote(labelName)}`),
    "body:",
    "  - type: markdown",
    "    attributes:",
    "      value: |",
    `        Use this form for free, maintainer-reviewed ${label.toLowerCase()} submissions.`,
    "        Products, hosted apps, services, paid listings, sponsorships, claims, and jobs use the dedicated website lead forms.",
    "        Include official source/docs URLs only. Contributor affiliate, referral, tracking, or local package-hosting requests are rejected.",
    ...spec.fields.flatMap((field) => linesForField(field, category)),
    "  - type: checkboxes",
    "    id: acknowledgements",
    "    attributes:",
    "      label: Submission checks",
    "      options:",
    "        - label: I confirm this is a free content submission, not a paid listing, job, product promotion, or claim request.",
    "          required: true",
    "        - label: I confirm external links are official source/docs links and not affiliate, referral, or tracking URLs.",
    "          required: true",
    "        - label: I understand maintainers review and import accepted submissions manually.",
    "          required: true",
  ];
  return `${lines.join("\n")}\n`;
}

fs.mkdirSync(templateDir, { recursive: true });

const expectedFiles = new Map(
  categorySpec.submissionOrder.map((category) => [
    categorySpec.categories[category].template,
    renderIssueTemplate(category),
  ]),
);

let changed = false;
for (const [fileName, expected] of expectedFiles) {
  const filePath = path.join(templateDir, fileName);
  const current = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : "";
  if (current !== expected) {
    changed = true;
    if (checkOnly) {
      console.error(
        `Issue template is stale: ${path.relative(repoRoot, filePath)}`,
      );
    } else {
      fs.writeFileSync(filePath, expected);
      console.log(`Updated ${path.relative(repoRoot, filePath)}`);
    }
  }
}

if (checkOnly && changed) {
  console.error("Run pnpm generate:issue-templates.");
  process.exit(1);
}

if (checkOnly) {
  console.log(`Validated ${expectedFiles.size} generated issue templates.`);
}
