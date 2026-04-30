import categorySpec from "./category-spec.json" with { type: "json" };
import { normalizeBrandDomain } from "./brand-assets.js";
import { recommendedLabelsForCategory } from "./submission-labels.js";
import { buildSubmissionFieldModel } from "./submission-spec.js";

export const CORE_CATEGORIES = categorySpec.categoryOrder;

export const CATEGORY_REQUIREMENTS = Object.fromEntries(
  Object.entries(categorySpec.categories).map(([category, spec]) => [
    category,
    spec.submissionRequired,
  ]),
);

export const COMMON_REQUIRED_FIELDS = categorySpec.commonIssueRequiredFields;

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
  "brand-name": "brand_name",
  brand: "brand_name",
  provider: "brand_name",
  "brand-domain": "brand_domain",
  "provider-domain": "brand_domain",
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

const CATEGORY_ALIASES = new Map(Object.entries(categorySpec.aliases));

export function normalizeHeading(label) {
  let output = "";
  let lastWasSeparator = false;

  for (const char of String(label).trim().toLowerCase()) {
    const isAlphaNumeric =
      (char >= "a" && char <= "z") || (char >= "0" && char <= "9");
    if (isAlphaNumeric) {
      output += char;
      lastWasSeparator = false;
      continue;
    }
    if (output && !lastWasSeparator) {
      output += "-";
      lastWasSeparator = true;
    }
  }

  return lastWasSeparator ? output.slice(0, -1) : output;
}

export function normalizeValue(value) {
  const text = String(value ?? "").trim();
  if (!text || text === "_No response_") return "";
  return text;
}

function compactWhitespace(value) {
  let output = "";
  let lastWasWhitespace = false;
  for (const char of String(value || "").trim()) {
    if (char === " " || char === "\n" || char === "\t" || char === "\r") {
      if (!lastWasWhitespace) output += " ";
      lastWasWhitespace = true;
      continue;
    }
    output += char;
    lastWasWhitespace = false;
  }
  return output.trim();
}

function singularLabel(value) {
  const label = normalizeValue(value);
  return label.endsWith("s") ? label.slice(0, -1) : label;
}

function looksLikeSubmitTitle(value) {
  const title = normalizeValue(value).toLowerCase();
  const normalized = title.startsWith("[") ? title.slice(1) : title;
  return normalized === "submit" || normalized.startsWith("submit ");
}

function isIsoDate(value) {
  const text = normalizeValue(value);
  if (text.length !== 10) return false;
  return [...text].every((char, index) => {
    if (index === 4 || index === 7) return char === "-";
    return char >= "0" && char <= "9";
  });
}

function splitList(value) {
  const items = [];
  let current = "";
  for (const char of String(value || "")) {
    if (char === "\n" || char === ",") {
      const next = current.trim();
      if (next) items.push(next);
      current = "";
      continue;
    }
    current += char;
  }
  const next = current.trim();
  if (next) items.push(next);
  return items;
}

function containsForbiddenCounter(value) {
  const text = String(value || "").toLowerCase();
  return (
    text.includes("viewcount") ||
    text.includes("copycount") ||
    text.includes("popularityscore")
  );
}

export function slugify(value) {
  let output = "";
  let lastWasSeparator = false;

  for (const char of String(value || "")
    .trim()
    .toLowerCase()) {
    const isAlphaNumeric =
      (char >= "a" && char <= "z") || (char >= "0" && char <= "9");
    if (isAlphaNumeric) {
      output += char;
      lastWasSeparator = false;
      continue;
    }
    if (char === "'" || char === '"') continue;
    if (output && !lastWasSeparator) {
      output += "-";
      lastWasSeparator = true;
    }
  }

  return lastWasSeparator ? output.slice(0, -1) : output;
}

export function normalizeCategory(value) {
  const normalized = normalizeHeading(value);
  if (CATEGORY_ALIASES.has(normalized)) return CATEGORY_ALIASES.get(normalized);
  if (normalized.split("-").includes("mcp")) return "mcp";
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
  let code = raw;
  if (raw.startsWith("```")) {
    const firstLineEnd = raw.indexOf("\n");
    const closingFence = raw.lastIndexOf("```");
    if (firstLineEnd >= 0 && closingFence > firstLineEnd) {
      code = raw.slice(firstLineEnd + 1, closingFence).trim();
    }
  }
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
    brandName: "brand_name",
    brandDomain: "brand_domain",
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

function parseBulletLine(line) {
  const trimmed = String(line || "").trimStart();
  if (!trimmed.startsWith("- ")) return null;
  const withoutMarker = trimmed.slice(2);
  const colonIndex = withoutMarker.indexOf(":");
  if (colonIndex <= 0) return null;
  return {
    label: withoutMarker.slice(0, colonIndex),
    value: withoutMarker.slice(colonIndex + 1).trimStart(),
  };
}

function parseBoldFieldLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed.startsWith("**")) return null;
  const labelEnd = trimmed.indexOf(":**");
  if (labelEnd <= 2) return null;
  return {
    label: trimmed.slice(2, labelEnd),
    value: trimmed.slice(labelEnd + 3).trimStart(),
  };
}

export function parseIssueFormBody(body) {
  const sections = {};
  const text = String(body || "");
  let currentLabel = "";
  let currentLines = [];

  const commitSection = () => {
    if (!currentLabel) return;
    sections[fieldKey(currentLabel)] = normalizeValue(currentLines.join("\n"));
  };

  for (const line of text.split("\n")) {
    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith("### ")) {
      commitSection();
      currentLabel = trimmedStart.slice(4).trim();
      currentLines = [];
      continue;
    }
    if (currentLabel) currentLines.push(line);
  }
  commitSection();

  if (Object.keys(sections).length === 0) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const match = parseBulletLine(lines[i]);
      if (!match) continue;
      const valueLines = [match.value];
      for (let j = i + 1; j < lines.length; j += 1) {
        const nextLine = lines[j];
        if (parseBulletLine(nextLine)) break;
        valueLines.push(nextLine.trimStart());
        i = j;
      }
      sections[fieldKey(match.label)] = normalizeValue(valueLines.join("\n"));
    }
  }

  for (const line of text.split("\n")) {
    const match = parseBoldFieldLine(line);
    if (!match) continue;
    const key = fieldKey(match.label);
    if (!sections[key]) sections[key] = normalizeValue(match.value);
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
    const oneLine = compactWhitespace(normalized.description);
    normalized.card_description =
      oneLine.length <= 140 ? oneLine : `${oneLine.slice(0, 137).trimEnd()}...`;
  }

  if (!normalized.usage_snippet && normalized.install_or_usage) {
    normalized.usage_snippet = normalized.install_or_usage;
  }

  if (!normalized.install_command && normalized.install_or_usage) {
    normalized.install_command = normalized.install_or_usage;
  }

  if (normalized.brand_domain) {
    normalized.brand_domain =
      normalizeBrandDomain(normalized.brand_domain) || normalized.brand_domain;
  }

  return normalized;
}

export function normalizeSubmissionPayloadFields(fields = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      normalized[key] = value.map(String).join(", ");
      continue;
    }
    if (typeof value === "object") continue;
    normalized[key] = String(value);
  }
  return normalizeParsedFields(normalized);
}

export function buildSubmissionIssueTitle(fields = {}) {
  const normalized = normalizeSubmissionPayloadFields(fields);
  const category = normalizeCategory(normalized.category);
  const label = singularLabel(categorySpec.categories[category]?.label || "");
  return `Submit ${label || "Entry"}: ${normalizeValue(normalized.name) || "New directory entry"}`;
}

export function buildSubmissionIssueBody(fields = {}) {
  const normalized = normalizeSubmissionPayloadFields(fields);
  const category = normalizeCategory(normalized.category);
  const model = buildSubmissionFieldModel(category);
  const fieldIds = model?.fields?.map((field) => field.id) ?? [
    "name",
    "slug",
    "category",
    "github_url",
    "docs_url",
    "author",
    "contact_email",
    "tags",
    "description",
    "card_description",
  ];
  const labelsById = new Map(
    (model?.fields ?? []).map((field) => [field.id, field.label || field.id]),
  );
  const allFieldIds = [
    ...fieldIds,
    ...Object.keys(normalized).filter((id) => !fieldIds.includes(id)),
  ];
  const lines = [];

  for (const id of allFieldIds) {
    const value = normalizeValue(normalized[id]);
    if (!value && id !== "category") continue;
    const label = labelsById.get(id) || id.replaceAll("_", " ");
    lines.push(`### ${label}`, "", value || category, "");
  }

  return lines.join("\n").trimEnd();
}

export function buildSubmissionIssueDraft(fields = {}) {
  const normalized = normalizeSubmissionPayloadFields(fields);
  const category = normalizeCategory(normalized.category);
  return {
    title: buildSubmissionIssueTitle(normalized),
    body: buildSubmissionIssueBody(normalized),
    labels: CORE_CATEGORIES.includes(category)
      ? recommendedLabelsForCategory(category)
      : ["content-submission", "needs-review"],
  };
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

export function looksLikeSubmissionIssue(issue = {}) {
  const labels = issueLabels(issue);
  if (labels.includes("content-submission")) {
    return true;
  }

  const title = String(issue.title || "").trim();
  const body = String(issue.body || "");
  if (looksLikeSubmitTitle(title)) return true;

  const normalizedBody = body.toLowerCase();
  return (
    (normalizedBody.includes("### category") ||
      normalizedBody.includes("**category:**") ||
      normalizedBody.includes("content type")) &&
    (normalizedBody.includes("### name") ||
      normalizedBody.includes("**name:**") ||
      normalizedBody.includes("json data"))
  );
}

export function isLikelyAffiliateUrl(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return false;

  try {
    const url = new URL(normalized);
    const affiliateParams = new Set([
      "aff",
      "affiliate",
      "affiliate_id",
      "campaign",
      "coupon",
      "irclickid",
      "partner",
      "referral",
      "referral_code",
      "via",
    ]);

    for (const key of url.searchParams.keys()) {
      const normalizedKey = key.trim().toLowerCase();
      if (normalizedKey.startsWith("utm_")) return true;
      if (affiliateParams.has(normalizedKey)) return true;
    }
  } catch {
    return false;
  }

  return false;
}

function isHttpsUrl(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return true;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidPublicContact(value) {
  const normalized = normalizeValue(value);
  if (!normalized) return true;
  if (normalized.includes("@")) {
    const [local, domain] = normalized.split("@");
    if (local && domain && domain.includes(".") && !normalized.includes(" ")) {
      return true;
    }
  }
  const handle = normalized.startsWith("@") ? normalized.slice(1) : normalized;
  if (
    handle.length >= 1 &&
    handle.length <= 39 &&
    !handle.startsWith("-") &&
    !handle.endsWith("-") &&
    [...handle].every(
      (char) =>
        (char >= "A" && char <= "Z") ||
        (char >= "a" && char <= "z") ||
        (char >= "0" && char <= "9") ||
        char === "-",
    )
  ) {
    return true;
  }

  try {
    const url = new URL(normalized);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.split("/").filter(Boolean).length === 1
    );
  } catch {
    return false;
  }
}

export function recommendedSubmissionLabels(
  issue,
  report = validateSubmission(issue),
) {
  if (!looksLikeSubmissionIssue(issue)) return [];
  const labels = new Set(issueLabels(issue));
  if (report?.category && CORE_CATEGORIES.includes(report.category)) {
    for (const label of recommendedLabelsForCategory(report.category)) {
      labels.add(label);
    }
  } else {
    labels.add("content-submission");
    labels.add("needs-review");
  }
  return [...labels].sort();
}

export function submissionQueueStatus(report) {
  if (report?.skipped) return "skipped";
  return report?.ok ? "import_ready" : "needs_changes";
}

export function buildSubmissionQueue(issues = []) {
  const entries = issues
    .filter(looksLikeSubmissionIssue)
    .map((issue) => {
      const report = validateSubmission(issue);
      const status = submissionQueueStatus(report);
      return {
        number: issue.number ?? null,
        title: String(issue.title || ""),
        url: String(issue.url || ""),
        author:
          typeof issue.author === "string"
            ? issue.author
            : String(issue.author?.login || ""),
        updatedAt: String(issue.updatedAt || issue.updated_at || ""),
        labels: issueLabels(issue),
        recommendedLabels: recommendedSubmissionLabels(issue, report),
        status,
        category: report.category || "",
        slug: report.fields?.slug || "",
        name: report.fields?.name || "",
        errors: report.errors || [],
        warnings: report.warnings || [],
        importPath:
          status === "import_ready" && report.category && report.fields?.slug
            ? `content/${report.category}/${report.fields.slug}.mdx`
            : "",
      };
    })
    .sort((left, right) => {
      const statusOrder = {
        import_ready: 0,
        needs_changes: 1,
        skipped: 2,
      };
      return (
        (statusOrder[left.status] ?? 99) - (statusOrder[right.status] ?? 99) ||
        right.updatedAt.localeCompare(left.updatedAt) ||
        Number(left.number ?? 0) - Number(right.number ?? 0)
      );
    });

  return {
    schemaVersion: 1,
    kind: "submission-queue",
    generatedAt: new Date().toISOString(),
    count: entries.length,
    summary: {
      importReady: entries.filter((entry) => entry.status === "import_ready")
        .length,
      needsChanges: entries.filter((entry) => entry.status === "needs_changes")
        .length,
      skipped: entries.filter((entry) => entry.status === "skipped").length,
    },
    entries,
  };
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

  if (fields.slug && slugify(fields.slug) !== fields.slug) {
    errors.push("Invalid slug format: expected kebab-case");
  }

  if (!isValidPublicContact(fields.contact_email)) {
    errors.push(
      "Invalid public contact: use a GitHub handle, GitHub profile URL, or email",
    );
  }

  if (fields.description && normalizeValue(fields.description).length < 12) {
    errors.push("Description is too short for review");
  }

  if (
    fields.card_description &&
    normalizeValue(fields.card_description).length < 8
  ) {
    errors.push("Card description is too short for review");
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

  for (const field of ["github_url", "docs_url", "download_url"]) {
    if (!isHttpsUrl(fields[field])) {
      errors.push(`${field} must be a valid https URL`);
    }
    if (isLikelyAffiliateUrl(fields[field])) {
      errors.push(
        `Contributor submissions cannot include affiliate/referral URLs: ${field}`,
      );
    }
  }

  if (fields.brand_domain && !normalizeBrandDomain(fields.brand_domain)) {
    errors.push("brand_domain must be a canonical domain such as asana.com");
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

    const validSkillTypes = new Set(categorySpec.skillTypeValues);
    const validSkillLevels = new Set(categorySpec.skillLevelValues);
    const validStatuses = new Set(categorySpec.verificationStatusValues);

    if (skillType && !validSkillTypes.has(skillType)) {
      errors.push(`Invalid skill_type: ${skillType}`);
    }
    if (skillLevel && !validSkillLevels.has(skillLevel)) {
      errors.push(`Invalid skill_level: ${skillLevel}`);
    }
    if (verificationStatus && !validStatuses.has(verificationStatus)) {
      errors.push(`Invalid verification_status: ${verificationStatus}`);
    }
    if (verifiedAt && !isIsoDate(verifiedAt)) {
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
      const urls = splitList(retrievalSources);
      for (const url of urls) {
        if (!isHttpsUrl(url)) {
          errors.push(`retrieval_sources must use https URLs: ${url}`);
        }
      }
    }
    if (!testedPlatforms) {
      warnings.push("No tested_platforms provided");
    }
  }

  const fullCopyable = String(fields.full_copyable_content ?? "");
  if (containsForbiddenCounter(fullCopyable)) {
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
