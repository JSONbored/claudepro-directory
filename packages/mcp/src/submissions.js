export const SUBMISSION_SITE_URL = "https://heyclau.de/submit";
export const GITHUB_NEW_ISSUE_URL =
  "https://github.com/JSONbored/claudepro-directory/issues/new";

const defaultLabels = ["content-submission", "needs-review"];

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

export function slugify(value) {
  return normalizeLower(value)
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeDomain(value) {
  const trimmed = normalizeText(value);
  if (!trimmed) return "";
  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return trimmed.replace(/^www\./i, "").toLowerCase();
  }
}

function isCanonicalDomain(value) {
  const domain = normalizeDomain(value);
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
    domain,
  );
}

function isHttpsUrl(value) {
  const trimmed = normalizeText(value);
  if (!trimmed) return true;
  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyAffiliateUrl(value) {
  const trimmed = normalizeText(value);
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
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
      const normalized = key.trim().toLowerCase();
      if (normalized.startsWith("utm_") || affiliateParams.has(normalized)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

function isPublicContact(value) {
  const contact = normalizeText(value);
  if (!contact) return true;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return true;
  if (/^@?[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(contact)) {
    return true;
  }
  try {
    const url = new URL(contact);
    return (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.pathname.split("/").filter(Boolean).length === 1
    );
  } catch {
    return false;
  }
}

function tagsToText(value) {
  return Array.isArray(value)
    ? value.map(normalizeText).filter(Boolean).join(", ")
    : normalizeText(value);
}

export function normalizeSubmissionFields(fields = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value === undefined || value === null) continue;
    normalized[key] = key === "tags" ? tagsToText(value) : normalizeText(value);
  }

  if (!normalized.name && normalized.title) normalized.name = normalized.title;
  if (!normalized.slug && normalized.name)
    normalized.slug = slugify(normalized.name);
  if (normalized.brand_domain) {
    normalized.brand_domain = normalizeDomain(normalized.brand_domain);
  }

  const sourceUrl = normalized.source_url;
  if (sourceUrl && !normalized.github_url && !normalized.docs_url) {
    try {
      const url = new URL(sourceUrl);
      if (url.hostname === "github.com") {
        normalized.github_url = sourceUrl;
      } else {
        normalized.docs_url = sourceUrl;
      }
    } catch {
      normalized.docs_url = sourceUrl;
    }
  }

  if (!normalized.card_description && normalized.description) {
    const oneLine = normalized.description.replace(/\s+/g, " ").trim();
    normalized.card_description =
      oneLine.length <= 140 ? oneLine : `${oneLine.slice(0, 137).trimEnd()}...`;
  }

  return normalized;
}

function categoryKeys(spec) {
  return Object.keys(spec?.categories || {});
}

function modelFor(spec, category) {
  return spec?.categories?.[category] || null;
}

function templateFor(spec, category) {
  return spec?.issueTemplates?.[category] || null;
}

function labelsFor(spec, category) {
  return templateFor(spec, category)?.labels || defaultLabels;
}

function requiredFields(model) {
  return (model?.fields || [])
    .filter((field) => field.required)
    .map((field) => field.id);
}

function fieldLabels(model) {
  return new Map((model?.fields || []).map((field) => [field.id, field.label]));
}

function selectedCategory(spec, category) {
  const normalized = normalizeLower(category);
  return categoryKeys(spec).includes(normalized) ? normalized : "";
}

function validateAgainstSpec(spec, fields = {}) {
  const normalized = normalizeSubmissionFields(fields);
  const category = selectedCategory(spec, normalized.category);
  const model = modelFor(spec, category);
  const errors = [];
  const warnings = [];

  if (!category || !model) {
    errors.push("Missing or unsupported submission category.");
    return {
      valid: false,
      category: normalized.category || "",
      normalized,
      errors,
      warnings,
    };
  }

  normalized.category = category;
  const missingRequiredFields = requiredFields(model).filter(
    (field) => !normalizeText(normalized[field]),
  );
  for (const field of missingRequiredFields) {
    errors.push(`Missing required field: ${field}`);
  }

  if (normalized.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized.slug)) {
    errors.push("Invalid slug format: expected kebab-case.");
  }
  if (normalized.description && normalized.description.length < 12) {
    errors.push("Description is too short for review.");
  }
  if (normalized.card_description && normalized.card_description.length < 8) {
    errors.push("Card description is too short for review.");
  }
  if (!isPublicContact(normalized.contact_email)) {
    errors.push(
      "Invalid public contact: use a GitHub handle, GitHub profile URL, or email.",
    );
  }

  for (const field of [
    "github_url",
    "docs_url",
    "download_url",
    "source_url",
  ]) {
    if (!isHttpsUrl(normalized[field])) {
      errors.push(`${field} must be a valid https URL.`);
    }
    if (isLikelyAffiliateUrl(normalized[field])) {
      errors.push(
        `Contributor submissions cannot include affiliate/referral URLs: ${field}.`,
      );
    }
  }

  if (normalized.brand_domain && !isCanonicalDomain(normalized.brand_domain)) {
    errors.push("brand_domain must be a canonical domain such as asana.com.");
  }
  if (
    category === "skills" &&
    !normalizeText(normalized.install_command) &&
    !normalizeText(normalized.download_url)
  ) {
    errors.push("Skills submissions require install_command or download_url.");
  }
  if (category === "collections" && !normalizeText(normalized.items)) {
    errors.push("Collections submissions require items.");
  }
  if (category === "guides" && !normalizeText(normalized.guide_content)) {
    errors.push("Guide submissions require guide_content.");
  }
  if (!normalized.github_url && !normalized.docs_url) {
    warnings.push("No github_url/docs_url provided.");
  }
  if (category === "skills" && !normalized.tested_platforms) {
    warnings.push("No tested_platforms provided.");
  }

  return {
    valid: errors.length === 0,
    category,
    normalized,
    errors,
    warnings,
    missingRequiredFields,
    requiredFields: requiredFields(model),
  };
}

export function buildIssueDraftFromSpec(spec, fields = {}) {
  const validation = validateAgainstSpec(spec, fields);
  const category = validation.category;
  const model = modelFor(spec, category);
  const labelsById = fieldLabels(model);
  const fieldIds = [
    ...(model?.fields || []).map((field) => field.id),
    ...Object.keys(validation.normalized).filter(
      (field) =>
        !(model?.fields || []).some((candidate) => candidate.id === field),
    ),
  ];
  const body = fieldIds
    .filter((field) => field !== "title" && field !== "source_url")
    .map((field) => {
      const value = normalizeText(validation.normalized[field]);
      if (!value && field !== "category") return "";
      return [
        `### ${labelsById.get(field) || field.replaceAll("_", " ")}`,
        "",
        value || category,
        "",
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n")
    .trimEnd();
  const label = model?.label?.replace(/s$/, "") || "Entry";

  return {
    title: `Submit ${label}: ${validation.normalized.name || "New directory entry"}`,
    body,
    labels: labelsFor(spec, category),
  };
}

function setParam(params, key, value) {
  const normalized = tagsToText(value);
  if (normalized) params.set(key, normalized);
}

export function buildSubmissionUrlsFromSpec(spec, args = {}) {
  const fields = normalizeSubmissionFields(args.fields || {});
  const validation = validateAgainstSpec(spec, fields);
  const category = validation.category || fields.category || "";
  const issueDraft = buildIssueDraftFromSpec(spec, fields);
  const template = templateFor(spec, category)?.template || "submit-entry.md";

  const submitUrl = new URL(SUBMISSION_SITE_URL);
  const issueUrl = new URL(GITHUB_NEW_ISSUE_URL);
  issueUrl.searchParams.set("template", template);

  for (const [key, value] of Object.entries(fields)) {
    if (key === "source_url" && (fields.github_url || fields.docs_url))
      continue;
    setParam(submitUrl.searchParams, key, value);
    if (key !== "source_url") setParam(issueUrl.searchParams, key, value);
  }
  if (category) {
    submitUrl.searchParams.set("category", category);
    issueUrl.searchParams.set("category", category);
  }
  if (fields.name) {
    issueUrl.searchParams.set("title", issueDraft.title);
    issueUrl.searchParams.set("name", fields.name);
  }

  return {
    ok: true,
    valid: validation.valid,
    category,
    slug: fields.slug || "",
    submitUrl: submitUrl.toString(),
    githubIssueUrl: issueUrl.toString(),
    issueDraft: args.includeIssueBody
      ? issueDraft
      : { title: issueDraft.title, labels: issueDraft.labels },
    validation: {
      errors: validation.errors,
      warnings: validation.warnings,
      missingRequiredFields: validation.missingRequiredFields || [],
    },
    reviewModel:
      "Issue-first: maintainers review accepted submissions before an import PR is opened.",
  };
}

export function getSubmissionSchemaFromSpec(spec, args = {}) {
  const category = selectedCategory(spec, args.category);
  if (args.category && !category) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: `No HeyClaude submission schema found for ${args.category}.`,
      },
    };
  }

  return {
    ok: true,
    schemaVersion: spec.schemaVersion,
    categories: categoryKeys(spec),
    category: category || "",
    schema: category ? spec.categories[category] : spec.categories,
    issueTemplate: category
      ? spec.issueTemplates?.[category]
      : spec.issueTemplates,
  };
}

export function validateSubmissionDraftFromSpec(spec, args = {}) {
  const validation = validateAgainstSpec(spec, args.fields || {});
  const issueDraft = validation.category
    ? buildIssueDraftFromSpec(spec, validation.normalized)
    : null;

  return {
    ok: true,
    valid: validation.valid,
    category: validation.category,
    slug: validation.normalized.slug || "",
    fields: validation.normalized,
    requiredFields: validation.requiredFields || [],
    missingRequiredFields: validation.missingRequiredFields || [],
    errors: validation.errors,
    warnings: validation.warnings,
    issuePreview: issueDraft
      ? { title: issueDraft.title, labels: issueDraft.labels }
      : null,
    nextSteps: validation.valid
      ? [
          "Check for duplicate registry entries.",
          "Open the generated HeyClaude submit URL or GitHub issue URL.",
          "Maintainers review accepted submissions before an import PR is opened.",
        ]
      : ["Fix validation errors before opening a public submission issue."],
  };
}

function entrySourceUrls(entry) {
  return [
    entry.documentationUrl,
    entry.repoUrl,
    entry.url,
    entry.canonicalUrl,
    entry.llmsUrl,
    entry.apiUrl,
  ]
    .map(normalizeText)
    .filter(Boolean);
}

export function searchDuplicateEntries(entries = [], args = {}) {
  const limit = Math.max(1, Math.min(10, Math.trunc(Number(args.limit) || 5)));
  const category = normalizeLower(args.category);
  const slug = normalizeLower(args.slug);
  const title = normalizeLower(args.title || args.name);
  const brandDomain = normalizeDomain(args.brandDomain);
  const sourceUrl = normalizeText(args.sourceUrl);

  const matches = [];
  for (const entry of entries) {
    const reasons = [];
    if (category && entry.category !== category) continue;
    if (slug && normalizeLower(entry.slug) === slug) reasons.push("slug");
    if (title && normalizeLower(entry.title) === title) reasons.push("title");
    if (brandDomain && normalizeDomain(entry.brandDomain) === brandDomain) {
      reasons.push("brand_domain");
    }
    if (sourceUrl && entrySourceUrls(entry).includes(sourceUrl)) {
      reasons.push("source_url");
    }

    if (!reasons.length) continue;
    matches.push({
      key: `${entry.category}:${entry.slug}`,
      category: entry.category,
      slug: entry.slug,
      title: entry.title,
      description: entry.description || entry.seoDescription || "",
      canonicalUrl: entry.canonicalUrl || entry.url || "",
      brandName: entry.brandName || "",
      brandDomain: entry.brandDomain || "",
      reasons,
    });
    if (matches.length >= limit) break;
  }

  return {
    ok: true,
    count: matches.length,
    matches,
    reviewNote:
      matches.length > 0
        ? "Potential duplicates require maintainer review before submitting a new entry."
        : "No obvious registry duplicate found in the generated search index.",
  };
}

export function getCategorySubmissionGuidanceFromSpec(spec, args = {}) {
  const category = selectedCategory(spec, args.category);
  if (args.category && !category) {
    return {
      ok: false,
      error: {
        code: "not_found",
        message: `No HeyClaude submission guidance found for ${args.category}.`,
      },
    };
  }

  const categories = category ? [category] : categoryKeys(spec);
  return {
    ok: true,
    categories: categories.map((key) => {
      const model = modelFor(spec, key);
      return {
        category: key,
        label: model?.label || key,
        description: model?.description || "",
        template: model?.template || templateFor(spec, key)?.template || "",
        requiredFields: requiredFields(model),
        optionalFields: (model?.fields || [])
          .filter((field) => !field.required)
          .map((field) => field.id),
        guidance: [
          "Use canonical source URLs and avoid affiliate/referral links.",
          "Brand domain is optional but helps HeyClaude show accurate logos and trust signals.",
          "Schema-valid submissions still require maintainer review before publication.",
        ],
      };
    }),
  };
}
