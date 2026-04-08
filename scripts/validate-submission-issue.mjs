import fs from "node:fs";
import path from "node:path";

const CORE_CATEGORIES = [
  "agents",
  "rules",
  "mcp",
  "skills",
  "hooks",
  "commands",
  "statuslines"
];

const CATEGORY_REQUIREMENTS = {
  agents: ["full_copyable_content"],
  commands: ["command_syntax", "usage_snippet", "full_copyable_content"],
  hooks: ["trigger", "usage_snippet", "full_copyable_content"],
  mcp: ["install_command", "usage_snippet"],
  rules: ["full_copyable_content"],
  skills: ["usage_snippet"],
  statuslines: ["script_language", "usage_snippet", "full_copyable_content"]
};

const COMMON_REQUIRED_FIELDS = [
  "name",
  "slug",
  "category",
  "contact_email",
  "description",
  "card_description"
];

const HEADING_KEY_MAP = {
  name: "name",
  slug: "slug",
  category: "category",
  "git-hub-url": "github_url",
  "github-url": "github_url",
  "docs-url": "docs_url",
  author: "author",
  "contact-email": "contact_email",
  tags: "tags",
  description: "description",
  "card-description": "card_description",
  "full-copyable-agent-prompt-config": "full_copyable_content",
  "full-copyable-command-content": "full_copyable_content",
  "full-copyable-hook-script-config": "full_copyable_content",
  "copy-snippet-full-usable-asset": "full_copyable_content",
  "full-copyable-rule-content": "full_copyable_content",
  "copy-snippet-full-usable-asset-optional": "full_copyable_content",
  "full-copyable-statusline-script-config": "full_copyable_content",
  "install-usage-optional": "install_or_usage",
  "command-syntax": "command_syntax",
  "usage-snippet": "usage_snippet",
  trigger: "trigger",
  "config-snippet-optional": "config_snippet",
  "script-language-optional": "script_language",
  "install-command": "install_command",
  "auth-requirements-env-vars-optional": "auth_requirements",
  "verification-steps-optional": "verification_steps",
  "download-url-optional": "download_url",
  "install-command-required-unless-download-url-is-provided": "install_command",
  "script-language": "script_language"
};

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return "";
  return process.argv[idx + 1] ?? "";
}

function normalizeHeading(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-");
}

function normalizeValue(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "_No response_") return "";
  return text;
}

function parseIssueFormBody(body) {
  const sections = {};
  const chunks = String(body || "")
    .split(/\n(?=###\s+)/g)
    .filter((chunk) => chunk.trim().startsWith("### "));

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const firstLine = lines.shift() ?? "";
    const rawLabel = firstLine.replace(/^###\s+/, "").trim();
    const rawValue = lines.join("\n");
    const normalized = normalizeHeading(rawLabel);
    const key =
      HEADING_KEY_MAP[normalized] ??
      (normalized.startsWith("download-url") ? "download_url" : normalized);
    sections[key] = normalizeValue(rawValue);
  }
  return sections;
}

function validateSubmission(issue) {
  const body = String(issue.body ?? "");
  const labels = Array.isArray(issue.labels)
    ? issue.labels
        .map((label) => {
          if (typeof label === "string") return label.trim().toLowerCase();
          return String(label?.name ?? "").trim().toLowerCase();
        })
        .filter(Boolean)
    : [];

  const fields = parseIssueFormBody(body);
  const categoryFromField = String(fields.category ?? "").trim().toLowerCase();
  const categoryFromLabels = CORE_CATEGORIES.find((category) => labels.includes(category)) ?? "";
  const category = categoryFromLabels || categoryFromField;

  if (!category || !CORE_CATEGORIES.includes(category)) {
    return {
      ok: true,
      skipped: true,
      reason: "non_core_category_submission",
      category,
      errors: [],
      warnings: [],
      fields
    };
  }

  const errors = [];
  const warnings = [];
  const requiredFields = [...COMMON_REQUIRED_FIELDS, ...(CATEGORY_REQUIREMENTS[category] ?? [])];

  for (const field of requiredFields) {
    if (!normalizeValue(fields[field])) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (fields.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) {
    errors.push("Invalid slug format: expected kebab-case");
  }

  if (fields.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contact_email)) {
    errors.push("Invalid contact email format");
  }

  if (fields.category && fields.category.trim().toLowerCase() !== category) {
    errors.push(`Category mismatch: expected "${category}" but got "${fields.category}"`);
  }

  if (String(fields.download_url ?? "").trim().startsWith("/downloads/")) {
    errors.push("Community submissions cannot request local /downloads hosting");
  }

  if (category === "skills" && !normalizeValue(fields.install_command) && !normalizeValue(fields.download_url)) {
    errors.push("Skills submissions require install_command or download_url");
  }

  const fullCopyable = String(fields.full_copyable_content ?? "");
  const forbiddenCounterPattern = /\b(viewCount|copyCount|popularityScore)\b/;
  if (forbiddenCounterPattern.test(fullCopyable)) {
    errors.push("Forbidden counters detected in full_copyable_content");
  }

  if (!fields.github_url && !fields.docs_url) {
    warnings.push("No github_url/docs_url provided");
  }

  return {
    ok: errors.length === 0,
    skipped: false,
    reason: "",
    category,
    errors,
    warnings,
    fields
  };
}

const issuePath = argValue("--issue-json");
const outputPath = argValue("--output");

if (!issuePath || !outputPath) {
  console.error("Usage: node scripts/validate-submission-issue.mjs --issue-json <path> --output <path>");
  process.exit(1);
}

const issue = JSON.parse(fs.readFileSync(issuePath, "utf8"));
const report = validateSubmission(issue);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

if (!report.ok) {
  process.exit(1);
}
