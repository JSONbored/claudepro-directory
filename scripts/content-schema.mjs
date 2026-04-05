const DEFAULT_REPO_URL = "https://github.com/JSONbored/claudepro-directory";

export const CATEGORY_SCHEMAS = {
  agents: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["usageSnippet", "copySnippet"]
  },
  collections: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["usageSnippet", "items"]
  },
  commands: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["commandSyntax", "usageSnippet", "copySnippet"]
  },
  guides: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["usageSnippet"]
  },
  hooks: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["trigger", "usageSnippet", "copySnippet"]
  },
  mcp: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["installCommand", "usageSnippet", "copySnippet"]
  },
  rules: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["copySnippet"]
  },
  skills: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["installCommand", "usageSnippet", "copySnippet"]
  },
  statuslines: {
    required: ["title", "slug", "description", "cardDescription", "repoUrl"],
    recommended: ["scriptLanguage", "usageSnippet", "copySnippet"]
  }
};

export function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function deriveCardDescription(description = "") {
  const normalized = String(description).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= 140) return normalized;

  const sentence = normalized.match(/^(.{0,140}[.!?])\s/);
  if (sentence?.[1]) return sentence[1];

  return `${normalized.slice(0, 137).trimEnd()}...`;
}

export function extractCodeBlocks(body) {
  const matches = [...body.matchAll(/```([\w-]*)\n([\s\S]*?)```/g)];
  return matches.map((match) => ({
    language: match[1] || "text",
    code: match[2].trim()
  }));
}

export function extractHeadings(body) {
  return body
    .split("\n")
    .map((line) => line.match(/^(##+)\s+(.*)$/))
    .filter(Boolean)
    .map((match) => ({
      depth: match[1].length,
      text: match[2].trim(),
      id: headingId(match[2].trim())
    }));
}

export function stripCodeBlocks(markdown) {
  return String(markdown || "")
    .replace(/```[\w-]*\n[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractSections(body) {
  const lines = String(body || "").split("\n");
  const sections = [];
  let current = { title: "Overview", markdown: "" };

  const pushCurrent = () => {
    const markdown = current.markdown.trim();
    if (!markdown) return;
    sections.push({
      title: current.title,
      id: headingId(current.title),
      markdown
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*)$/);
    if (headingMatch) {
      pushCurrent();
      current = {
        title: headingMatch[1].trim(),
        markdown: ""
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

  const signalCount = body
    .split("\n")
    .filter((line) => {
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
  if (data.repoUrl && String(data.repoUrl).trim() !== DEFAULT_REPO_URL) {
    return String(data.repoUrl);
  }

  if (
    data.documentationUrl &&
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(String(data.documentationUrl).trim())
  ) {
    return String(data.documentationUrl).trim();
  }

  return data.repoUrl ? String(data.repoUrl) : DEFAULT_REPO_URL;
}

export function inferHookTrigger(text = "") {
  const triggers = [
    "PreToolUse",
    "PostToolUse",
    "UserPromptSubmit",
    "Notification",
    "Stop",
    "SubagentStop",
    "SessionStart"
  ];

  return triggers.find((trigger) => text.includes(trigger)) || "";
}

export function inferStructuredFields(data, body, category) {
  const codeBlocks = extractCodeBlocks(body);
  const firstCodeBlock = codeBlocks[0];
  const combinedText = `${data.description ?? ""}\n${body}`;

  const installCommand =
    data.installCommand
      ? String(data.installCommand)
      : firstCodeBlock && firstCodeBlock.code.split("\n").length === 1
        ? firstCodeBlock.code.trim()
        : "";

  const usageSnippet =
    data.usageSnippet
      ? String(data.usageSnippet)
      : data.commandSyntax
        ? String(data.commandSyntax)
        : installCommand || "";

  const copySnippet =
    data.copySnippet
      ? String(data.copySnippet)
      : firstCodeBlock?.code?.trim() || usageSnippet || "";

  const scriptLanguage =
    data.scriptLanguage
      ? String(data.scriptLanguage)
      : looksLikeRawScript(body)
        ? inferLanguageFromCategory(category)
        : "";

  const scriptBody =
    data.scriptBody
      ? String(data.scriptBody)
      : looksLikeRawScript(body)
        ? body.replace(/^```[\w-]*\n/, "").replace(/\n```$/, "").trim()
        : "";

  const installable =
    typeof data.installable === "boolean"
      ? data.installable
      : Boolean(
          installCommand ||
            data.downloadUrl ||
            ["mcp", "skills", "hooks", "statuslines", "commands"].includes(category)
        );

  return {
    cardDescription: data.cardDescription
      ? String(data.cardDescription)
      : deriveCardDescription(data.description),
    repoUrl: inferRepoUrl(data),
    usageSnippet,
    copySnippet,
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
          : ""
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

  return { missingRequired, missingRecommended };
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
    "repoUrl",
    "documentationUrl",
    "downloadUrl",
    "installable",
    "installCommand",
    "usageSnippet",
    "copySnippet",
    "scriptLanguage",
    "trigger",
    "tags",
    "keywords",
    "readingTime",
    "viewCount",
    "copyCount",
    "popularityScore"
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

export { DEFAULT_REPO_URL };
