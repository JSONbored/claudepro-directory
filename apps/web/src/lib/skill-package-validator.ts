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

export function validateSkillPackageFiles(params: {
  files: SkillPackageFile[];
  githubUrl: string;
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
  const issueUrl = new URL(`${params.githubUrl}/issues/new`);
  issueUrl.searchParams.set("template", "submit-skill.yml");
  issueUrl.searchParams.set(
    "title",
    `Submit Skill: ${skillName || "Validated skill package"}`,
  );
  issueUrl.searchParams.set("name", skillName || slug || "Validated skill");
  issueUrl.searchParams.set("slug", slug || "validated-skill");
  issueUrl.searchParams.set("category", "skills");
  issueUrl.searchParams.set("description", description);
  issueUrl.searchParams.set(
    "card_description",
    description.length > 150 ? `${description.slice(0, 147)}...` : description,
  );
  issueUrl.searchParams.set("skill_type", "general");
  issueUrl.searchParams.set("skill_level", "advanced");
  issueUrl.searchParams.set("verification_status", "validated");
  issueUrl.searchParams.set(
    "tested_platforms",
    "Claude, Codex, Windsurf, Gemini, Cursor, Generic AGENTS",
  );

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
    issueUrl: issueUrl.toString(),
  };
}
