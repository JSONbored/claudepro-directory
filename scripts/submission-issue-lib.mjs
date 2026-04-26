export const CORE_CATEGORIES = [
  "agents",
  "rules",
  "mcp",
  "skills",
  "hooks",
  "commands",
  "statuslines",
  "collections",
  "guides",
];

export const CATEGORY_REQUIREMENTS = {
  agents: ["full_copyable_content"],
  commands: ["command_syntax", "usage_snippet", "full_copyable_content"],
  collections: ["items"],
  guides: ["guide_content"],
  hooks: ["trigger", "usage_snippet", "full_copyable_content"],
  mcp: ["install_command", "usage_snippet"],
  rules: ["full_copyable_content"],
  skills: ["usage_snippet", "skill_type", "skill_level", "verification_status"],
  statuslines: ["script_language", "usage_snippet", "full_copyable_content"],
};

export const COMMON_REQUIRED_FIELDS = [
  "name",
  "slug",
  "category",
  "contact_email",
  "description",
  "card_description",
];

export const HEADING_KEY_MAP = {
  name: "name",
  title: "name",
  slug: "slug",
  category: "category",
  "content-type": "category",
  "git-hub-url": "github_url",
  "github-url": "github_url",
  github: "github_url",
  "source-url": "github_url",
  website: "docs_url",
  "docs-url": "docs_url",
  documentation: "docs_url",
  "documentation-url": "docs_url",
  author: "author",
  "contact-email": "contact_email",
  email: "contact_email",
  tags: "tags",
  description: "description",
  "what-it-does": "description",
  "description-1-3-sentences": "description",
  "card-description": "card_description",
  "card-description-short-preview": "card_description",
  "full-copyable-agent-prompt-config": "full_copyable_content",
  "full-copyable-command-content": "full_copyable_content",
  "full-copyable-hook-script-config": "full_copyable_content",
  "copy-snippet-full-usable-asset": "full_copyable_content",
  "full-copyable-rule-content": "full_copyable_content",
  "copy-snippet-full-usable-asset-optional": "full_copyable_content",
  "full-copyable-statusline-script-config": "full_copyable_content",
  "required-content": "required_content",
  "install-usage-optional": "install_or_usage",
  "install-usage": "install_or_usage",
  install: "install_command",
  package: "package_name",
  npm: "download_url",
  "command-syntax": "command_syntax",
  "usage-snippet": "usage_snippet",
  usage: "usage_snippet",
  configuration: "config_snippet",
  config: "config_snippet",
  trigger: "trigger",
  "config-snippet-optional": "config_snippet",
  "script-language-optional": "script_language",
  "install-command": "install_command",
  "auth-requirements-env-vars-optional": "auth_requirements",
  "verification-steps-optional": "verification_steps",
  "verification-steps": "verification_steps",
  "download-url-optional": "download_url",
  "install-command-required-unless-download-url-is-provided": "install_command",
  "script-language": "script_language",
  "skill-type": "skill_type",
  "skill-level": "skill_level",
  "verification-status": "verification_status",
  "verified-date-yyyy-mm-dd": "verified_at",
  "retrieval-sources": "retrieval_sources",
  "tested-platforms": "tested_platforms",
  items: "items",
  "items-category-slug-list": "items",
  "guide-content-markdown": "guide_content",
  prerequisites: "prerequisites",
  "troubleshooting-section": "troubleshooting_section",
  "installation-order": "installation_order",
  "estimated-setup-time": "estimated_setup_time",
  difficulty: "difficulty",
};

const CATEGORY_ALIASES = new Map([
  ["agent", "agents"],
  ["agents", "agents"],
  ["rule", "rules"],
  ["rules", "rules"],
  ["mcp", "mcp"],
  ["mcp-server", "mcp"],
  ["mcp-servers", "mcp"],
  ["mcp-server-submission", "mcp"],
  ["mcp-server-content", "mcp"],
  ["skill", "skills"],
  ["skills", "skills"],
  ["hook", "hooks"],
  ["hooks", "hooks"],
  ["command", "commands"],
  ["commands", "commands"],
  ["statusline", "statuslines"],
  ["statuslines", "statuslines"],
  ["collection", "collections"],
  ["collections", "collections"],
  ["guide", "guides"],
  ["guides", "guides"],
]);

export function normalizeHeading(label) {
  return String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeValue(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "_No response_") return "";
  return text;
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeCategory(value) {
  const normalized = normalizeHeading(value);
  if (CATEGORY_ALIASES.has(normalized)) return CATEGORY_ALIASES.get(normalized);
  if (/\bmcp\b/.test(normalized)) return "mcp";
  return "";
}

function fieldKey(label) {
  const normalized = normalizeHeading(label);
  return (
    HEADING_KEY_MAP[normalized] ??
    (normalized.startsWith("download-url") ? "download_url" : normalized)
  );
}

function parseJsonCodeBlock(value) {
  const raw = String(value || "").trim();
  const code = raw.match(/```(?:json)?\n([\s\S]*?)```/i)?.[1] ?? raw;
  try {
    const parsed = JSON.parse(code);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function mapJsonData(data) {
  const mapped = {};
  const source = data || {};
  const pairs = {
    name: "name",
    title: "name",
    slug: "slug",
    category: "category",
    description: "description",
    author: "author",
    github: "github_url",
    githubUrl: "github_url",
    repoUrl: "github_url",
    website: "docs_url",
    docs: "docs_url",
    docsUrl: "docs_url",
    documentationUrl: "docs_url",
    npm: "download_url",
    install: "install_command",
    installCommand: "install_command",
    license: "license",
  };

  for (const [inputKey, outputKey] of Object.entries(pairs)) {
    if (source[inputKey] !== undefined) mapped[outputKey] = source[inputKey];
  }

  if (Array.isArray(source.tags)) mapped.tags = source.tags.join(", ");
  return mapped;
}

export function parseIssueFormBody(body) {
  const sections = {};
  const text = String(body || "");
  const chunks = text
    .split(/\n(?=###\s+)/g)
    .filter((chunk) => chunk.trim().startsWith("### "));

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    const firstLine = lines.shift() ?? "";
    const rawLabel = firstLine.replace(/^###\s+/, "").trim();
    sections[fieldKey(rawLabel)] = normalizeValue(lines.join("\n"));
  }

  if (Object.keys(sections).length === 0) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const match = line.match(/^\s*-\s*([^:]+):\s*(.*)$/);
      if (!match) continue;
      const valueLines = [match[2] ?? ""];
      for (let j = i + 1; j < lines.length; j += 1) {
        const nextLine = lines[j];
        if (/^\s*-\s*[^:]+:/.test(nextLine)) break;
        valueLines.push(nextLine.replace(/^\s{2,}/, ""));
        i = j;
      }
      sections[fieldKey(match[1])] = normalizeValue(valueLines.join("\n"));
    }
  }

  for (const match of text.matchAll(/^\*\*([^*]+):\*\*\s*(.+)$/gm)) {
    const key = fieldKey(match[1]);
    if (!sections[key]) sections[key] = normalizeValue(match[2]);
  }

  const jsonData = parseJsonCodeBlock(sections["json-data"]);
  if (jsonData) {
    Object.assign(sections, mapJsonData(jsonData), sections);
  }

  return normalizeParsedFields(sections);
}

export function normalizeParsedFields(fields) {
  const normalized = { ...fields };
  const category = normalizeCategory(normalized.category);
  if (category) normalized.category = category;

  const slugSource = normalized.slug || normalized.name;
  const nextSlug = slugify(slugSource);
  if (nextSlug) normalized.slug = nextSlug;

  if (!normalized.card_description && normalized.description) {
    const oneLine = String(normalized.description).replace(/\s+/g, " ").trim();
    normalized.card_description =
      oneLine.length <= 140 ? oneLine : `${oneLine.slice(0, 137).trimEnd()}...`;
  }

  if (!normalized.usage_snippet && normalized.install_or_usage) {
    normalized.usage_snippet = normalized.install_or_usage;
  }

  if (!normalized.install_command && normalized.install_or_usage) {
    normalized.install_command = normalized.install_or_usage;
  }

  return normalized;
}

export function issueLabels(issue) {
  return Array.isArray(issue.labels)
    ? issue.labels
        .map((label) => {
          if (typeof label === "string") return label.trim().toLowerCase();
          return String(label?.name ?? "")
            .trim()
            .toLowerCase();
        })
        .filter(Boolean)
    : [];
}

export function validateSubmission(issue) {
  const labels = issueLabels(issue);
  const fields = parseIssueFormBody(issue.body ?? "");
  const categoryFromField = normalizeCategory(fields.category);
  const categoryFromLabels =
    labels
      .map(normalizeCategory)
      .find((category) => CORE_CATEGORIES.includes(category)) ?? "";
  const category = categoryFromLabels || categoryFromField;
  const warnings = [];

  if (fields.slug && fields.slug !== normalizeValue(fields.slug)) {
    warnings.push(`Slug normalized to ${fields.slug}`);
  }

  if (!category || !CORE_CATEGORIES.includes(category)) {
    return {
      ok: true,
      skipped: true,
      reason: "non_core_category_submission",
      category,
      errors: [],
      warnings,
      fields,
    };
  }

  fields.category = category;

  const errors = [];
  const requiredFields = [
    ...COMMON_REQUIRED_FIELDS,
    ...(CATEGORY_REQUIREMENTS[category] ?? []),
  ];

  for (const field of requiredFields) {
    if (!normalizeValue(fields[field])) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (fields.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) {
    errors.push("Invalid slug format: expected kebab-case");
  }

  if (
    fields.contact_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contact_email)
  ) {
    errors.push("Invalid contact email format");
  }

  if (
    String(fields.download_url ?? "")
      .trim()
      .startsWith("/downloads/")
  ) {
    errors.push(
      "Community submissions cannot request local /downloads hosting",
    );
  }

  if (
    category === "skills" &&
    !normalizeValue(fields.install_command) &&
    !normalizeValue(fields.download_url)
  ) {
    errors.push("Skills submissions require install_command or download_url");
  }

  if (category === "collections" && !normalizeValue(fields.items)) {
    errors.push("Collections submissions require items");
  }

  if (category === "guides" && !normalizeValue(fields.guide_content)) {
    errors.push("Guide submissions require guide_content");
  }

  if (category === "skills") {
    const skillType = String(fields.skill_type ?? "")
      .trim()
      .toLowerCase();
    const skillLevel = String(fields.skill_level ?? "")
      .trim()
      .toLowerCase();
    const verificationStatus = String(fields.verification_status ?? "")
      .trim()
      .toLowerCase();
    const verifiedAt = String(fields.verified_at ?? "").trim();
    const retrievalSources = String(fields.retrieval_sources ?? "").trim();
    const testedPlatforms = String(fields.tested_platforms ?? "").trim();

    const validSkillTypes = new Set(["general", "capability-pack"]);
    const validSkillLevels = new Set(["foundational", "advanced", "expert"]);
    const validStatuses = new Set(["draft", "validated", "production"]);

    if (skillType && !validSkillTypes.has(skillType)) {
      errors.push(`Invalid skill_type: ${skillType}`);
    }
    if (skillLevel && !validSkillLevels.has(skillLevel)) {
      errors.push(`Invalid skill_level: ${skillLevel}`);
    }
    if (verificationStatus && !validStatuses.has(verificationStatus)) {
      errors.push(`Invalid verification_status: ${verificationStatus}`);
    }
    if (verifiedAt && !/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) {
      errors.push("verified_at must use YYYY-MM-DD format");
    }
    if (skillType === "capability-pack") {
      if (!verifiedAt)
        errors.push("capability-pack skills require verified_at");
      if (!retrievalSources)
        errors.push("capability-pack skills require retrieval_sources");
      if (skillLevel && skillLevel !== "expert") {
        errors.push("capability-pack skills must use skill_level=expert");
      }
    }
    if (retrievalSources) {
      const urls = retrievalSources
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);
      for (const url of urls) {
        if (!/^https:\/\//i.test(url)) {
          errors.push(`retrieval_sources must use https URLs: ${url}`);
        }
      }
    }
    if (!testedPlatforms) {
      warnings.push("No tested_platforms provided");
    }
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
    fields,
  };
}
