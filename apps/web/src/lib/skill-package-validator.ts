import {
  buildSubmissionIssueDraft,
  normalizeSubmissionPayloadFields,
} from "@heyclaude/registry/submission";
import { buildSubmissionFieldModel } from "@heyclaude/registry/submission-spec";

export type SkillPackageFile = {
  path: string;
  text?: string;
  size: number;
};

export type SkillPackageValidation = {
  ok: boolean;
  entrypoint: string;
  skillName: string;
  description: string;
  slug: string;
  errors: string[];
  warnings: string[];
  facts: Array<{ label: string; value: string }>;
  submissionFields: Record<string, string>;
  submissionUrl: string;
  issueTitle: string;
  issueBody: string;
  issueUrl: string;
};

const TEXT_REFERENCE_PATTERN =
  /\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)|`((?:scripts|references|assets|templates)\/[^`]+)`/gi;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizePackagePath(value: string) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .join("/");
}

function parseFrontmatter(markdown: string) {
  const match = String(markdown || "").match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter((item): item is RegExpMatchArray => Boolean(item))
      .map((item) => [item[1], item[2].trim().replace(/^["']|["']$/g, "")]),
  ) as Record<string, string>;
}

function firstMeaningfulParagraph(markdown: string) {
  return String(markdown || "")
    .replace(/^---\n[\s\S]*?\n---/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length >= 20 && !line.startsWith("#"));
}

function findSkillEntrypoint(files: SkillPackageFile[]) {
  const candidates = files
    .map((file) => normalizePackagePath(file.path))
    .filter((filePath) => filePath.endsWith("SKILL.md"))
    .sort((left, right) => left.split("/").length - right.split("/").length);

  return candidates.find((filePath) => {
    const depth = filePath.split("/").length;
    return filePath === "SKILL.md" || depth === 2;
  });
}

function resolveRelativeReference(entrypoint: string, reference: string) {
  const cleanReference = reference.split("#")[0]?.trim();
  if (!cleanReference) return "";
  const base = entrypoint.includes("/")
    ? entrypoint.split("/").slice(0, -1).join("/")
    : "";
  return normalizePackagePath(`${base}/${cleanReference}`);
}

function clampText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function normalizedChoice(
  value: string | undefined,
  allowed: string[],
  fallback: string,
) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function buildSubmissionUrl(siteUrl: string, fields: Record<string, string>) {
  const params = new URLSearchParams();
  const model = buildSubmissionFieldModel("skills");
  for (const field of model?.fields ?? []) {
    const value = fields[field.id];
    if (value) params.set(field.id, value);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value && !params.has(key)) params.set(key, value);
  }
  return `${siteUrl.replace(/\/$/, "")}/submit?${params.toString()}`;
}

function buildIssueDraftUrl(githubUrl: string, fields: Record<string, string>) {
  const draft = buildSubmissionIssueDraft(fields);
  const issueUrl = new URL(`${githubUrl}/issues/new`);
  const model = buildSubmissionFieldModel("skills");
  issueUrl.searchParams.set("template", "submit-skill.yml");
  issueUrl.searchParams.set("title", draft.title);
  for (const field of model?.fields ?? []) {
    const value = fields[field.id];
    if (value) issueUrl.searchParams.set(field.id, value);
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value && !issueUrl.searchParams.has(key)) {
      issueUrl.searchParams.set(key, value);
    }
  }
  return {
    issueUrl: issueUrl.toString(),
    issueTitle: draft.title,
    issueBody: draft.body,
  };
}

function buildSkillSubmissionFields(params: {
  skillName: string;
  description: string;
  entrypoint: string;
  slug: string;
  skillText: string;
  frontmatter: Record<string, string>;
  fileCount: number;
  packageSha256?: string;
}) {
  const title = params.skillName || params.slug || "Validated Agent Skill";
  const description =
    params.description ||
    firstMeaningfulParagraph(params.skillText) ||
    "Validated Agent Skill package submitted for maintainer review.";
  const usageSnippet = [
    params.frontmatter.usage_snippet ||
      `Install the validated Agent Skill package into your AI client skill directory and use ${params.entrypoint || "SKILL.md"} as the entrypoint.`,
    `Package files: ${params.fileCount}.`,
    params.packageSha256 ? `Package SHA256: ${params.packageSha256}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return normalizeSubmissionPayloadFields({
    name: title,
    slug: params.slug || slugify(title),
    category: "skills",
    description,
    card_description:
      params.frontmatter.card_description || clampText(description, 140),
    author: params.frontmatter.author || "",
    tags:
      params.frontmatter.tags || "skills, agent-skill, claude, codex, cursor",
    install_command:
      params.frontmatter.install_command ||
      "Install the zip package into your AI client skill directory.",
    usage_snippet: usageSnippet,
    skill_type: normalizedChoice(
      params.frontmatter.skill_type,
      ["general", "capability-pack"],
      "general",
    ),
    skill_level: normalizedChoice(
      params.frontmatter.skill_level,
      ["foundational", "advanced", "expert"],
      "advanced",
    ),
    verification_status: normalizedChoice(
      params.frontmatter.verification_status,
      ["draft", "validated", "production"],
      "validated",
    ),
    retrieval_sources: params.frontmatter.retrieval_sources || "",
    tested_platforms:
      params.frontmatter.tested_platforms ||
      "Claude, Codex, Windsurf, Gemini, Cursor, Generic AGENTS",
  }) as Record<string, string>;
}

export function validateSkillPackageFiles(params: {
  files: SkillPackageFile[];
  githubUrl: string;
  siteUrl?: string;
  packageSha256?: string;
}): SkillPackageValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedFiles = params.files.map((file) => ({
    ...file,
    path: normalizePackagePath(file.path),
  }));
  const pathSet = new Set(normalizedFiles.map((file) => file.path));

  for (const file of normalizedFiles) {
    if (!file.path || file.path.includes("..")) {
      errors.push(`Unsafe package path: ${file.path || "(blank)"}`);
    }
    if (file.size > 2_000_000) {
      warnings.push(`Large package file: ${file.path}`);
    }
  }

  const entrypoint = findSkillEntrypoint(normalizedFiles) || "";
  if (!entrypoint) {
    errors.push(
      "Package must include SKILL.md at the root or one folder deep.",
    );
  }

  const skillFile = normalizedFiles.find((file) => file.path === entrypoint);
  const skillText = skillFile?.text || "";
  const frontmatter = parseFrontmatter(skillText);
  const skillName = frontmatter.name || "";
  const description = frontmatter.description || "";

  if (!skillText.trim()) {
    errors.push("SKILL.md must be readable text.");
  }
  if (!skillText.startsWith("---\n")) {
    errors.push("SKILL.md must start with frontmatter.");
  }
  if (!skillName) {
    errors.push("SKILL.md frontmatter must include name.");
  }
  if (description.length < 40 || description.length > 240) {
    errors.push("SKILL.md frontmatter description must be 40-240 characters.");
  }
  if (!/^#[\s\S]+/m.test(skillText.replace(/^---\n[\s\S]*?\n---/, ""))) {
    warnings.push("Add a visible Markdown heading after frontmatter.");
  }

  const referencedResources = [
    ...skillText.matchAll(TEXT_REFERENCE_PATTERN),
  ].map((match) => match[1] || match[2]);
  for (const reference of referencedResources) {
    const resolved = resolveRelativeReference(entrypoint, reference);
    if (resolved && !pathSet.has(resolved)) {
      errors.push(`Referenced resource is missing: ${reference}`);
    }
  }

  const hasScripts = normalizedFiles.some(
    (file) =>
      file.path.includes("/scripts/") || file.path.startsWith("scripts/"),
  );
  const hasReferences = normalizedFiles.some(
    (file) =>
      file.path.includes("/references/") || file.path.startsWith("references/"),
  );
  const hasAssets = normalizedFiles.some(
    (file) => file.path.includes("/assets/") || file.path.startsWith("assets/"),
  );
  const slug = slugify(skillName || entrypoint.replace(/\/?SKILL\.md$/, ""));
  const submissionFields = buildSkillSubmissionFields({
    skillName,
    description,
    entrypoint,
    slug: slug || "validated-skill",
    skillText,
    frontmatter,
    fileCount: normalizedFiles.length,
    packageSha256: params.packageSha256,
  });
  const submissionUrl = buildSubmissionUrl(
    params.siteUrl || "https://heyclau.de",
    submissionFields,
  );
  const issueDraft = buildIssueDraftUrl(params.githubUrl, submissionFields);

  return {
    ok: errors.length === 0,
    entrypoint,
    skillName,
    description,
    slug,
    errors,
    warnings,
    facts: [
      { label: "Entrypoint", value: entrypoint || "Missing" },
      { label: "Files", value: String(normalizedFiles.length) },
      { label: "Scripts", value: hasScripts ? "Present" : "None" },
      { label: "References", value: hasReferences ? "Present" : "None" },
      { label: "Assets", value: hasAssets ? "Present" : "None" },
      { label: "Cursor adapter", value: slug ? "Can be generated" : "Blocked" },
    ],
    submissionFields,
    submissionUrl,
    issueTitle: issueDraft.issueTitle,
    issueBody: issueDraft.issueBody,
    issueUrl: issueDraft.issueUrl,
  };
}
