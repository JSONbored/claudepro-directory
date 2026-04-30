import categorySpec from "./category-spec.json" with { type: "json" };
import {
  BRAND_ASSET_SOURCES,
  isAllowedBrandAssetUrl,
  normalizeBrandColors,
  normalizeBrandDomain,
} from "./brand-assets.js";

const DEFAULT_DIRECTORY_REPO_URL =
  "https://github.com/JSONbored/claudepro-directory";
const DEFAULT_SITE_URL = "https://heyclau.de";

export const CATEGORY_SCHEMAS = Object.fromEntries(
  Object.entries(categorySpec.categories).map(([category, spec]) => [
    category,
    {
      required: spec.contentRequired,
      recommended: spec.contentRecommended,
    },
  ]),
);

export const FORBIDDEN_CONTENT_FIELDS = [
  "viewCount",
  "copyCount",
  "popularityScore",
];
export const SKILL_TYPE_VALUES = categorySpec.skillTypeValues;
export const SKILL_LEVEL_VALUES = categorySpec.skillLevelValues;
export const VERIFICATION_STATUS_VALUES = categorySpec.verificationStatusValues;
const DEFAULT_TESTED_PLATFORMS = categorySpec.defaultTestedPlatforms;

export function headingId(text) {
  let cleaned = "";

  for (const char of String(text || "")
    .trim()
    .toLowerCase()) {
    const isAlphaNumeric =
      (char >= "a" && char <= "z") || (char >= "0" && char <= "9");
    const isWhitespace =
      char === " " ||
      char === "\n" ||
      char === "\t" ||
      char === "\r" ||
      char === "-";
    if (isAlphaNumeric || char === "-") cleaned += char;
    if (isWhitespace && char !== "-") cleaned += " ";
  }

  let output = "";
  let lastWasWhitespace = false;
  for (const char of cleaned.trim()) {
    const isWhitespace =
      char === " " || char === "\n" || char === "\t" || char === "\r";
    if (isWhitespace) {
      if (!lastWasWhitespace) output += "-";
      lastWasWhitespace = true;
      continue;
    }
    output += char;
    lastWasWhitespace = false;
  }

  return output;
}

function uniqueHeadingId(text, counts) {
  const base = headingId(text) || "section";
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

export function deriveCardDescription(description = "") {
  const normalized = String(description).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 140) return normalized;

  const sentence = normalized.match(/^(.{0,140}[.!?])\s/);
  if (sentence?.[1]) return sentence[1];

  return `${normalized.slice(0, 137).trimEnd()}...`;
}

function compactText(value = "") {
  return String(value).replace(/\s+/g, " ").replace(/[<>]/g, "").trim();
}

function truncateForSeo(value, maxLength) {
  const normalized = compactText(value);
  if (normalized.length <= maxLength) return normalized;

  const sentence = normalized.match(
    new RegExp(`^(.{40,${maxLength}}[.!?])\\s`),
  );
  if (sentence?.[1] && sentence[1].length <= maxLength) {
    return sentence[1];
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function deriveSeoDescription(value) {
  const normalized = compactText(value);
  if (normalized.length >= 120) return truncateForSeo(normalized, 160);

  const suffix =
    "HeyClaude adds source links, install steps, compatibility, and metadata.";
  const combined = normalized ? `${normalized} ${suffix}` : suffix;
  if (combined.length <= 160) return combined;
  const sliced = combined.slice(0, 157);
  const boundary = sliced.lastIndexOf(" ");
  const safeSlice = boundary >= 120 ? sliced.slice(0, boundary) : sliced;
  return `${safeSlice.trimEnd()}...`;
}

function keywordFromValue(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordKey(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function deriveSeoFields(data = {}, category = "") {
  const label = categorySpec.categories[category]?.label || category;
  const title = compactText(data.title || data.name || data.slug || "Entry");
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
  const explicitKeywords = Array.isArray(data.keywords)
    ? data.keywords.map(String)
    : [];
  const titleSuffix = label ? `${title} - ${label} for Claude` : title;
  const descriptionSource =
    data.seoDescription ||
    data.cardDescription ||
    data.card_description ||
    data.description ||
    "";

  const keywords = [
    ...explicitKeywords,
    ...tags,
    label,
    category,
    "claude",
    "heyclaude",
    title,
  ]
    .map(keywordFromValue)
    .filter(Boolean)
    .filter(
      (value, index, list) =>
        list.findIndex(
          (candidate) => keywordKey(candidate) === keywordKey(value),
        ) === index,
    )
    .slice(0, 12);

  return {
    seoTitle: truncateForSeo(data.seoTitle || titleSuffix, 70),
    seoDescription: deriveSeoDescription(descriptionSource),
    keywords,
  };
}

export function extractCodeBlocks(body) {
  const matches = [...body.matchAll(/```([\w-]*)\n([\s\S]*?)```/g)];
  return matches.map((match) => ({
    language: match[1] || "text",
    code: match[2].trim(),
  }));
}

export function extractHeadings(body) {
  const headings = [];
  const idCounts = new Map();
  let inCodeBlock = false;

  for (const line of String(body || "").split("\n")) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const trimmed = line.trimStart();
    if (!trimmed.startsWith("##")) continue;
    const markerLength = [...trimmed].findIndex((char) => char !== "#");
    if (markerLength < 2 || trimmed[markerLength] !== " ") continue;
    const headingText = trimmed.slice(markerLength + 1).trim();
    if (!headingText) continue;

    headings.push({
      depth: markerLength,
      text: headingText,
      id: uniqueHeadingId(headingText, idCounts),
    });
  }

  return headings;
}

export function stripCodeBlocks(markdown) {
  const lines = String(markdown || "").split("\n");
  const output = [];
  let inCodeBlock = false;
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (!line.trim()) {
      blankCount += 1;
      if (blankCount <= 2) output.push("");
      continue;
    }

    blankCount = 0;
    output.push(line);
  }

  return output.join("\n").trim();
}

function extractLeadParagraph(markdown) {
  const prose = stripCodeBlocks(markdown).replaceAll("\r\n", "\n").trim();

  if (!prose) return "";

  const blocks = [];
  let current = [];

  for (const line of prose.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) continue;
    if (!trimmed) {
      if (current.length) {
        blocks.push(current.join(" ").trim());
        current = [];
      }
      continue;
    }
    current.push(trimmed);
  }

  if (current.length) blocks.push(current.join(" ").trim());

  return blocks[0] || "";
}

function extractUsageCodeBlock(markdown) {
  const lines = String(markdown || "").split("\n");
  let inUsage = false;
  let inCodeBlock = false;
  const code = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inUsage) {
      inUsage = trimmed.toLowerCase() === "## usage";
      continue;
    }
    if (trimmed.startsWith("## ") && !inCodeBlock) return "";
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) return code.join("\n").trim();
      inCodeBlock = true;
      continue;
    }
    if (inCodeBlock) code.push(line);
  }

  return "";
}

export function extractSections(body) {
  const lines = String(body || "").split("\n");
  const sections = [];
  const idCounts = new Map();
  let current = { title: "Overview", markdown: "" };
  let inCodeBlock = false;

  const pushCurrent = () => {
    const markdown = current.markdown.trim();
    if (!markdown) return;
    sections.push({
      title: current.title,
      id: uniqueHeadingId(current.title, idCounts),
      markdown,
    });
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      current.markdown += `${line}\n`;
      continue;
    }

    if (inCodeBlock) {
      current.markdown += `${line}\n`;
      continue;
    }

    const trimmed = line.trimStart();
    if (trimmed.startsWith("## ")) {
      pushCurrent();
      current = {
        title: trimmed.slice(3).trim(),
        markdown: "",
      };
      continue;
    }

    current.markdown += `${line}\n`;
  }

  pushCurrent();
  return sections;
}

export function inferLanguageFromCategory(category) {
  if (category === "statuslines" || category === "hooks") return "bash";
  if (category === "commands") return "text";
  return "text";
}

export function looksLikeRawScript(body) {
  if (!body) return false;
  if (body.startsWith("#!/")) return true;

  const signalCount = body.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("#!/") ||
      trimmed.startsWith("echo ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("read -r ") ||
      trimmed.startsWith("if [") ||
      trimmed.startsWith("fi") ||
      trimmed.includes("jq -r") ||
      trimmed.includes("\\033[") ||
      trimmed.includes("statusline+=") ||
      trimmed.includes("2>/dev/null")
    );
  }).length;

  return signalCount >= 4;
}

export function normalizeBody(body, category) {
  const trimmed = String(body || "").trim();

  if (!trimmed || trimmed === "*(No content)*" || trimmed === "(No content)") {
    return "";
  }

  if (!trimmed.includes("```") && looksLikeRawScript(trimmed)) {
    return `\`\`\`${inferLanguageFromCategory(category)}\n${trimmed}\n\`\`\``;
  }

  return trimmed;
}

export function inferRepoUrl(data = {}) {
  if (
    data.repoUrl &&
    String(data.repoUrl).trim() !== DEFAULT_DIRECTORY_REPO_URL
  ) {
    return String(data.repoUrl);
  }

  if (
    data.documentationUrl &&
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(
      String(data.documentationUrl).trim(),
    )
  ) {
    return String(data.documentationUrl).trim();
  }

  return "";
}

export function inferSectionBooleans(body = "") {
  const normalized = String(body || "");

  return {
    hasPrerequisites:
      /^##\s+Prerequisites\b|^##\s+Prerequisites\s+&|^##\s+Prerequisites\s+and\b/i.test(
        normalized,
      ),
    hasTroubleshooting:
      /^##\s+Troubleshooting\b|^##\s+Troubleshooting\s+Guide\b|^##\s+Troubleshooting\s+Common\b/im.test(
        normalized,
      ),
  };
}

export function inferHookTrigger(text = "") {
  const triggers = [
    "PreToolUse",
    "PostToolUse",
    "UserPromptSubmit",
    "Notification",
    "Stop",
    "SubagentStop",
    "SessionStart",
  ];

  return triggers.find((trigger) => text.includes(trigger)) || "";
}

export function inferStructuredFields(data, body, category) {
  const codeBlocks = extractCodeBlocks(body);
  const firstCodeBlock = codeBlocks[0];
  const combinedText = `${data.description ?? ""}\n${body}`;
  const leadParagraph = extractLeadParagraph(body);
  const usageCodeBlock = extractUsageCodeBlock(body);
  const commandFromTitle =
    String(data.title || "").match(/^(\/[^\s]+)/)?.[1] || "";

  const normalizedDownloadUrl = String(data.downloadUrl || "").trim();
  const downloadInstallCommand =
    category === "skills" && normalizedDownloadUrl.startsWith("/")
      ? `curl -L ${DEFAULT_SITE_URL}${normalizedDownloadUrl} -o ${String(data.slug || "skill")}.zip && unzip -o ${String(data.slug || "skill")}.zip -d ./${String(data.slug || "skill")}`
      : "";

  const installCommand = data.installCommand
    ? String(data.installCommand)
    : category === "commands" && usageCodeBlock
      ? usageCodeBlock.split("\n")[0].trim()
      : category === "commands" && commandFromTitle
        ? commandFromTitle
        : downloadInstallCommand
          ? downloadInstallCommand
          : firstCodeBlock && firstCodeBlock.code.split("\n").length === 1
            ? firstCodeBlock.code.trim()
            : "";

  const commandSyntax = data.commandSyntax
    ? String(data.commandSyntax)
    : category === "commands"
      ? usageCodeBlock || commandFromTitle
      : "";

  const usageSnippet = data.usageSnippet
    ? String(data.usageSnippet)
    : commandSyntax
      ? commandSyntax
      : category === "guides"
        ? leadParagraph
        : category === "agents" || category === "rules"
          ? leadParagraph
          : category === "skills" && leadParagraph
            ? leadParagraph
            : installCommand || "";

  const copySnippet =
    category === "guides" || category === "collections"
      ? ""
      : category === "agents" || category === "rules"
        ? String(body || "").trim()
        : data.copySnippet
          ? String(data.copySnippet)
          : firstCodeBlock?.code?.trim() || usageSnippet || "";

  const scriptLanguage = data.scriptLanguage
    ? String(data.scriptLanguage)
    : looksLikeRawScript(body)
      ? inferLanguageFromCategory(category)
      : "";

  const scriptBody = data.scriptBody
    ? String(data.scriptBody)
    : looksLikeRawScript(body)
      ? body
          .replace(/^```[\w-]*\n/, "")
          .replace(/\n```$/, "")
          .trim()
      : "";

  const installable =
    typeof data.installable === "boolean"
      ? data.installable
      : Boolean(
          installCommand ||
          data.downloadUrl ||
          ["mcp", "skills", "hooks", "statuslines", "commands"].includes(
            category,
          ),
        );

  const normalizedSkillType =
    category === "skills"
      ? data.skillType
        ? String(data.skillType).trim().toLowerCase()
        : String(data.slug || "").endsWith("-capability-pack")
          ? "capability-pack"
          : "general"
      : "";

  const skillType = SKILL_TYPE_VALUES.includes(normalizedSkillType)
    ? normalizedSkillType
    : "general";
  const skillLevel =
    category === "skills"
      ? data.skillLevel
        ? String(data.skillLevel).trim().toLowerCase()
        : skillType === "capability-pack"
          ? "expert"
          : "advanced"
      : "";
  const verificationStatus =
    category === "skills"
      ? data.verificationStatus
        ? String(data.verificationStatus).trim().toLowerCase()
        : skillType === "capability-pack"
          ? "validated"
          : "draft"
      : "";
  const verifiedAt =
    category === "skills"
      ? data.verifiedAt
        ? String(data.verifiedAt).trim()
        : data.dateAdded
          ? String(data.dateAdded).trim()
          : ""
      : "";
  const retrievalSources =
    category === "skills"
      ? Array.isArray(data.retrievalSources)
        ? data.retrievalSources
            .map(String)
            .map((value) => value.trim())
            .filter(Boolean)
        : data.documentationUrl
          ? [String(data.documentationUrl).trim()]
          : []
      : [];
  const testedPlatforms =
    category === "skills"
      ? Array.isArray(data.testedPlatforms)
        ? data.testedPlatforms
            .map(String)
            .map((value) => value.trim())
            .filter(Boolean)
        : [...DEFAULT_TESTED_PLATFORMS]
      : [];

  return {
    cardDescription: data.cardDescription
      ? String(data.cardDescription)
      : deriveCardDescription(data.description),
    repoUrl: inferRepoUrl(data),
    usageSnippet,
    copySnippet,
    configSnippet: data.configSnippet ? String(data.configSnippet) : "",
    commandSyntax,
    installCommand,
    installable,
    scriptLanguage,
    scriptBody,
    trigger:
      category === "hooks"
        ? data.trigger
          ? String(data.trigger)
          : inferHookTrigger(combinedText)
        : data.trigger
          ? String(data.trigger)
          : "",
    skillType: category === "skills" ? skillType : "",
    skillLevel: category === "skills" ? skillLevel : "",
    verificationStatus: category === "skills" ? verificationStatus : "",
    verifiedAt,
    retrievalSources,
    testedPlatforms,
  };
}

export function validateEntry(category, data, inferred = {}) {
  const schema = CATEGORY_SCHEMAS[category];
  const merged = { ...data, ...inferred };
  const missingRequired = [];
  const missingRecommended = [];
  const recommendedFields = [...(schema?.recommended ?? [])];

  if (category === "agents" && merged.copySnippet) {
    const index = recommendedFields.indexOf("usageSnippet");
    if (index >= 0) recommendedFields.splice(index, 1);
  }

  if (category === "collections") {
    const usageIndex = recommendedFields.indexOf("usageSnippet");
    if (usageIndex >= 0) recommendedFields.splice(usageIndex, 1);
  }

  if (category === "hooks" && !merged.copySnippet && !merged.scriptBody) {
    const usageIndex = recommendedFields.indexOf("usageSnippet");
    if (usageIndex >= 0) recommendedFields.splice(usageIndex, 1);
    const copyIndex = recommendedFields.indexOf("copySnippet");
    if (copyIndex >= 0) recommendedFields.splice(copyIndex, 1);
  }

  if ((category === "mcp" || category === "skills") && !merged.installable) {
    const installIndex = recommendedFields.indexOf("installCommand");
    if (installIndex >= 0) recommendedFields.splice(installIndex, 1);
  }

  if (category === "skills" && merged.downloadUrl && !merged.installCommand) {
    const installIndex = recommendedFields.indexOf("installCommand");
    if (installIndex >= 0) recommendedFields.splice(installIndex, 1);
  }

  const enumErrors = [];
  const semanticErrors = [];

  for (const field of schema?.required ?? []) {
    if (
      merged[field] === undefined ||
      merged[field] === null ||
      String(merged[field]).trim() === ""
    ) {
      missingRequired.push(field);
    }
  }

  for (const field of recommendedFields) {
    if (
      merged[field] === undefined ||
      merged[field] === null ||
      String(merged[field]).trim() === ""
    ) {
      missingRecommended.push(field);
    }
  }

  if (category === "skills") {
    const skillType = String(merged.skillType || "")
      .trim()
      .toLowerCase();
    const skillLevel = String(merged.skillLevel || "")
      .trim()
      .toLowerCase();
    const verificationStatus = String(merged.verificationStatus || "")
      .trim()
      .toLowerCase();
    const verifiedAt = String(merged.verifiedAt || "").trim();
    const retrievalSources = Array.isArray(merged.retrievalSources)
      ? merged.retrievalSources
          .map((value) => String(value).trim())
          .filter(Boolean)
      : [];
    const testedPlatforms = Array.isArray(merged.testedPlatforms)
      ? merged.testedPlatforms
          .map((value) => String(value).trim())
          .filter(Boolean)
      : [];

    if (skillType && !SKILL_TYPE_VALUES.includes(skillType)) {
      enumErrors.push(`Invalid skillType: ${skillType}`);
    }
    if (skillLevel && !SKILL_LEVEL_VALUES.includes(skillLevel)) {
      enumErrors.push(`Invalid skillLevel: ${skillLevel}`);
    }
    if (
      verificationStatus &&
      !VERIFICATION_STATUS_VALUES.includes(verificationStatus)
    ) {
      enumErrors.push(`Invalid verificationStatus: ${verificationStatus}`);
    }
    if (verifiedAt && !/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) {
      semanticErrors.push("verifiedAt must be ISO date format YYYY-MM-DD");
    }

    if (skillType === "capability-pack") {
      if (!retrievalSources.length) {
        semanticErrors.push(
          "capability-pack skills must include retrievalSources",
        );
      }
      if (!verifiedAt) {
        semanticErrors.push("capability-pack skills must include verifiedAt");
      }
      if (skillLevel && skillLevel !== "expert") {
        semanticErrors.push(
          "capability-pack skills must use skillLevel: expert",
        );
      }
    }

    if (!testedPlatforms.length) {
      semanticErrors.push("skills must define testedPlatforms");
    }
  }

  const brandDomain = String(merged.brandDomain || "").trim();
  const brandAssetSource = String(merged.brandAssetSource || "")
    .trim()
    .toLowerCase();
  const brandIconUrl = String(merged.brandIconUrl || "").trim();
  const brandLogoUrl = String(merged.brandLogoUrl || "").trim();
  const brandVerifiedAt = String(merged.brandVerifiedAt || "").trim();

  if (brandDomain && !normalizeBrandDomain(brandDomain)) {
    semanticErrors.push(
      "brandDomain must be a canonical domain such as asana.com",
    );
  }
  if (brandAssetSource && !BRAND_ASSET_SOURCES.includes(brandAssetSource)) {
    semanticErrors.push(
      `brandAssetSource must be one of ${BRAND_ASSET_SOURCES.join(", ")}`,
    );
  }
  if (brandIconUrl && !isAllowedBrandAssetUrl(brandIconUrl)) {
    semanticErrors.push(
      "brandIconUrl must be HTTPS and served by Brandfetch, HeyClaude, or a local asset path",
    );
  }
  if (brandLogoUrl && !isAllowedBrandAssetUrl(brandLogoUrl)) {
    semanticErrors.push(
      "brandLogoUrl must be HTTPS and served by Brandfetch, HeyClaude, or a local asset path",
    );
  }
  if (brandVerifiedAt && !/^\d{4}-\d{2}-\d{2}$/.test(brandVerifiedAt)) {
    semanticErrors.push("brandVerifiedAt must be ISO date format YYYY-MM-DD");
  }
  if (
    merged.brandColors !== undefined &&
    normalizeBrandColors(merged.brandColors).length !==
      (Array.isArray(merged.brandColors)
        ? merged.brandColors.length
        : String(merged.brandColors || "")
            .split(",")
            .filter((value) => value.trim()).length)
  ) {
    semanticErrors.push("brandColors must be hex colors such as #796eff");
  }

  if (category === "tools") {
    const websiteUrl = String(merged.websiteUrl || "").trim();
    const affiliateUrl = String(merged.affiliateUrl || "").trim();
    const disclosure = String(merged.disclosure || "editorial")
      .trim()
      .toLowerCase();
    const pricingModel = String(merged.pricingModel || "")
      .trim()
      .toLowerCase();

    if (websiteUrl && !/^https:\/\//i.test(websiteUrl)) {
      semanticErrors.push("websiteUrl must use https");
    }
    if (affiliateUrl && !/^https:\/\//i.test(affiliateUrl)) {
      semanticErrors.push("affiliateUrl must use https");
    }
    if (
      disclosure &&
      ![
        "editorial",
        "heyclaude_pick",
        "affiliate",
        "sponsored",
        "claimed",
      ].includes(disclosure)
    ) {
      semanticErrors.push(
        "disclosure must be editorial, heyclaude_pick, affiliate, sponsored, or claimed",
      );
    }
    if (disclosure === "affiliate" && !affiliateUrl) {
      semanticErrors.push("affiliate tool listings must include affiliateUrl");
    }
    if (
      pricingModel &&
      ![
        "free",
        "freemium",
        "paid",
        "open-source",
        "subscription",
        "usage-based",
        "contact-sales",
      ].includes(pricingModel)
    ) {
      semanticErrors.push("pricingModel is not recognized");
    }
  }

  return { missingRequired, missingRecommended, enumErrors, semanticErrors };
}

export function orderFrontmatter(data) {
  const preferredOrder = [
    "title",
    "slug",
    "category",
    "description",
    "cardDescription",
    "seoTitle",
    "seoDescription",
    "author",
    "authorProfileUrl",
    "dateAdded",
    "brandName",
    "brandDomain",
    "brandAssetSource",
    "brandVerifiedAt",
    "brandIconUrl",
    "brandLogoUrl",
    "brandColors",
    "websiteUrl",
    "affiliateUrl",
    "repoUrl",
    "documentationUrl",
    "pricingModel",
    "disclosure",
    "applicationCategory",
    "operatingSystem",
    "downloadUrl",
    "installable",
    "installCommand",
    "usageSnippet",
    "copySnippet",
    "configSnippet",
    "scriptLanguage",
    "scriptBody",
    "trigger",
    "items",
    "installationOrder",
    "estimatedSetupTime",
    "difficulty",
    "skillType",
    "skillLevel",
    "verificationStatus",
    "verifiedAt",
    "retrievalSources",
    "testedPlatforms",
    "prerequisites",
    "tags",
    "keywords",
    "robotsIndex",
    "robotsFollow",
    "readingTime",
  ];

  const ordered = {};

  for (const key of preferredOrder) {
    if (data[key] !== undefined && data[key] !== "") {
      ordered[key] = data[key];
    }
  }

  for (const key of Object.keys(data)) {
    if (ordered[key] !== undefined) continue;
    if (data[key] === undefined || data[key] === "") continue;
    ordered[key] = data[key];
  }

  return ordered;
}

export { DEFAULT_DIRECTORY_REPO_URL };
