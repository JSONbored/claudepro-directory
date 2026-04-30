import fs from "node:fs";
import path from "node:path";

import { deriveSeoFields } from "@heyclaude/registry/content-schema";
import {
  normalizeValue,
  validateSubmission,
} from "@heyclaude/registry/submission";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return "";
  return process.argv[idx + 1] ?? "";
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function stripCodeFence(value) {
  const normalized = normalizeValue(value);
  const match = normalized.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
  return match?.[1]?.trim() ?? normalized;
}

function splitList(value) {
  return normalizeValue(value)
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeTag(value) {
  return normalizeValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeCommand(value) {
  const normalized = stripCodeFence(value);
  const match = normalized.match(/^([A-Za-z][A-Za-z0-9-]*)(\s|$)/);
  if (!match?.[1]) return normalized;

  const command = match[1];
  const lowerCommand = command.toLowerCase();
  const normalizedCommands = new Set([
    "bun",
    "claude",
    "npm",
    "npx",
    "pnpm",
    "uv",
    "uvx",
    "yarn",
  ]);

  if (!normalizedCommands.has(lowerCommand)) return normalized;
  return `${lowerCommand}${normalized.slice(command.length)}`;
}

function normalizeHttpsUrl(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeGitHubHandle(value) {
  const normalized = normalizeValue(value).replace(/^@/, "");
  if (
    normalized.length >= 1 &&
    normalized.length <= 39 &&
    !normalized.startsWith("-") &&
    !normalized.endsWith("-") &&
    [...normalized].every(
      (char) =>
        (char >= "A" && char <= "Z") ||
        (char >= "a" && char <= "z") ||
        (char >= "0" && char <= "9") ||
        char === "-",
    )
  ) {
    return normalized;
  }
  return "";
}

function githubHandleFromProfileUrl(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  try {
    const url = new URL(normalized);
    if (url.protocol !== "https:" || url.hostname !== "github.com") return "";
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length === 1 ? normalizeGitHubHandle(parts[0]) : "";
  } catch {
    return "";
  }
}

function githubProfileUrl(handle) {
  const normalized = normalizeGitHubHandle(handle);
  return normalized ? `https://github.com/${normalized}` : "";
}

function githubIdentityFromPublicContact(value) {
  const normalized = normalizeValue(value);
  if (
    !normalized ||
    (normalized.includes("@") && !normalized.startsWith("@"))
  ) {
    return null;
  }
  const handle =
    githubHandleFromProfileUrl(normalized) || normalizeGitHubHandle(normalized);
  if (!handle) return null;
  return { name: handle, url: githubProfileUrl(handle) };
}

function githubIdentityFromIssueAuthor(issue) {
  const login = normalizeGitHubHandle(
    issue.user?.login || issue.author?.login || issue.author?.name || "",
  );
  if (!login) return null;
  return {
    name: login,
    url: normalizeHttpsUrl(issue.user?.html_url) || githubProfileUrl(login),
  };
}

function submissionIdentity(issue, fields) {
  const submittedVia = normalizeValue(fields.submitted_via).toLowerCase();
  const contactIdentity = githubIdentityFromPublicContact(fields.contact_email);
  if (submittedVia === "website") return contactIdentity;
  return githubIdentityFromIssueAuthor(issue) || contactIdentity;
}

function authorProfileUrlFromFields(fields) {
  return (
    normalizeHttpsUrl(fields.author_profile_url) ||
    githubProfileUrl(
      githubHandleFromProfileUrl(fields.author) ||
        normalizeGitHubHandle(fields.author),
    )
  );
}

function issueCreatedAt(issue) {
  return normalizeValue(issue.created_at || issue.createdAt);
}

function issueHtmlUrl(issue) {
  return normalizeHttpsUrl(issue.html_url || issue.url);
}

function issueNumber(issue) {
  const parsed = Number(issue.number);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : "";
}

function yamlScalar(value) {
  const normalized = normalizeValue(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return JSON.stringify(normalized);
  }
  if (
    !normalized.includes("\n") &&
    /^[a-zA-Z0-9][a-zA-Z0-9 ._/@#?=&+%(),'"!-]*$/.test(normalized)
  ) {
    return normalized;
  }
  if (!normalized.includes("\n")) {
    return JSON.stringify(normalized);
  }
  const indented = normalized
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  return `|-\n${indented}`;
}

function yamlArray(values) {
  const items = values.map(
    (value) => `  - ${yamlScalar(value).replace(/\n/g, "\n  ")}`,
  );
  return items.length ? `\n${items.join("\n")}` : "[]";
}

function frontmatter(data) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}:${yamlArray(value)}`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value ? "true" : "false"}`);
    } else {
      lines.push(`${key}: ${yamlScalar(value)}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function buildBody(fields, category) {
  const description = normalizeValue(fields.description);
  const usage = stripCodeFence(fields.usage_snippet || fields.install_or_usage);
  const fullCopyable = stripCodeFence(fields.full_copyable_content);
  const verification = normalizeValue(fields.verification_steps);
  const auth = normalizeValue(fields.auth_requirements);
  const guideContent = normalizeValue(fields.guide_content);

  if (category === "guides" && guideContent) {
    return guideContent;
  }

  const lines = ["## Overview", "", description];

  if (usage) {
    lines.push("", "## Usage", "", usage);
  }

  if (fullCopyable && fullCopyable !== usage) {
    lines.push("", "## Asset", "", fullCopyable);
  }

  if (auth) {
    lines.push("", "## Auth Requirements", "", auth);
  }

  if (verification) {
    lines.push("", "## Verification", "", verification);
  }

  return lines.join("\n").trim();
}

function buildContent(issue, report) {
  const fields = report.fields;
  const category = report.category;
  const slug = fields.slug;
  const createdAt = issueCreatedAt(issue);
  const submitted = submissionIdentity(issue, fields);
  const reviewedBy = normalizeGitHubHandle(
    process.env.SUBMISSION_REVIEWED_BY || "",
  );
  const reviewedAt = normalizeValue(process.env.SUBMISSION_REVIEWED_AT);
  const dateAdded = createdAt
    ? String(createdAt).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const installCommand = normalizeCommand(
    fields.install_command || fields.install_or_usage,
  );
  const usageSnippet = stripCodeFence(
    fields.usage_snippet || fields.install_or_usage || installCommand,
  );
  const configSnippet = stripCodeFence(fields.config_snippet);
  const copySnippet = stripCodeFence(fields.full_copyable_content);
  const tags = unique(splitList(fields.tags).map(normalizeTag).filter(Boolean));
  const retrievalSources = unique(splitList(fields.retrieval_sources));
  const testedPlatforms = unique(splitList(fields.tested_platforms));
  const downloadUrl = normalizeValue(fields.download_url);
  const seo = deriveSeoFields(
    {
      title: fields.name,
      description: fields.description,
      cardDescription: fields.card_description,
      tags,
    },
    category,
  );
  const isDraftSkill =
    category === "skills" &&
    normalizeValue(fields.verification_status).toLowerCase() === "draft";

  const data = {
    title: fields.name,
    slug,
    category,
    description: fields.description,
    cardDescription: fields.card_description,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    author: fields.author,
    authorProfileUrl: authorProfileUrlFromFields(fields),
    dateAdded,
    submittedBy: submitted?.name,
    submittedByUrl: submitted?.url,
    submittedAt: createdAt,
    submissionIssueNumber: issueNumber(issue),
    submissionIssueUrl: issueHtmlUrl(issue),
    reviewedBy,
    reviewedAt,
    claimStatus: "unclaimed",
    brandName: fields.brand_name,
    brandDomain: fields.brand_domain,
    brandAssetSource: fields.brand_domain ? "brandfetch" : "",
    repoUrl: fields.github_url,
    documentationUrl: fields.docs_url,
    downloadUrl,
    installable: Boolean(installCommand || downloadUrl),
    installCommand,
    usageSnippet,
    copySnippet,
    configSnippet,
    commandSyntax: fields.command_syntax,
    trigger: fields.trigger,
    scriptLanguage: fields.script_language,
    skillType: fields.skill_type,
    skillLevel: fields.skill_level,
    verificationStatus: fields.verification_status,
    verifiedAt: fields.verified_at,
    retrievalSources,
    testedPlatforms,
    tags,
    keywords: seo.keywords,
    robotsIndex: !isDraftSkill,
    robotsFollow: true,
  };

  return `${frontmatter(data)}\n${buildBody(fields, category)}\n`;
}

const issuePath = argValue("--issue-json");
const outputRoot = argValue("--output-root") || contentRoot;
const dryRun = hasFlag("--dry-run");
const force = hasFlag("--force");

if (!issuePath) {
  console.error(
    "Usage: node scripts/import-submission-issue.mjs --issue-json <path> [--output-root content] [--dry-run] [--force]",
  );
  process.exit(1);
}

const issue = JSON.parse(fs.readFileSync(issuePath, "utf8"));
const report = validateSubmission(issue);

if (report.skipped) {
  console.error(
    `Cannot import skipped submission: ${report.reason || "unknown"}`,
  );
  process.exit(1);
}

if (!report.ok) {
  console.error("Cannot import invalid submission:");
  for (const error of report.errors) console.error(`- ${error}`);
  process.exit(1);
}

const content = buildContent(issue, report);
const outputPath = path.join(
  outputRoot,
  report.category,
  `${report.fields.slug}.mdx`,
);

if (dryRun) {
  console.log(`Would write ${path.relative(repoRoot, outputPath)}`);
  console.log(content);
  process.exit(0);
}

if (fs.existsSync(outputPath) && !force) {
  console.error(
    `Refusing to overwrite existing file: ${path.relative(repoRoot, outputPath)}`,
  );
  console.error("Pass --force to overwrite.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
