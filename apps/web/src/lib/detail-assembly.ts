import { marked } from "marked";

import type { ContentEntry, DirectoryEntry } from "@/lib/content";

export function stripCodeBlocks(markdown: string) {
  return String(markdown || "")
    .replace(/```[\w-]*\n[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function renderMarkdown(markdown: string) {
  const output = await marked.parse(markdown);
  return sanitizeRenderedHtml(
    typeof output === "string" ? output : String(output),
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sanitizeRenderedHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (match) => {
      return `<pre><code>${escapeHtml(match)}</code></pre>`;
    })
    .replace(/<script\b[^>]*>/gi, (match) => `<pre><code>${escapeHtml(match)}`)
    .replace(/<\/script>/gi, (match) => `${escapeHtml(match)}</code></pre>`)
    .replace(/<\/?([a-z][\w:-]*)(?:\s[^>]*)?>/gi, (match, tagName) => {
      const allowedTags = new Set([
        "a",
        "blockquote",
        "br",
        "code",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "img",
        "li",
        "ol",
        "p",
        "pre",
        "strong",
        "table",
        "tbody",
        "td",
        "th",
        "thead",
        "tr",
        "ul",
      ]);
      return allowedTags.has(String(tagName).toLowerCase())
        ? match
        : escapeHtml(match);
    })
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function getPrimarySnippet(entry: ContentEntry) {
  switch (entry.category) {
    case "agents":
    case "rules":
      return {
        title: "Copyable asset",
        code: entry.body || entry.copySnippet || entry.usageSnippet,
        language: "md",
      };
    case "hooks":
      if (entry.configSnippet) {
        return {
          title: "Claude config",
          code: entry.configSnippet,
          language: "json",
        };
      }
      return {
        title: entry.scriptBody ? "Hook script" : "Usage",
        code: entry.scriptBody || entry.copySnippet || entry.usageSnippet,
        language: entry.scriptLanguage || "text",
      };
    case "mcp":
    case "skills":
    case "commands":
      return {
        title: entry.installCommand
          ? "Install command"
          : entry.commandSyntax
            ? "Command syntax"
            : "Usage",
        code:
          entry.installCommand ||
          entry.commandSyntax ||
          entry.copySnippet ||
          entry.usageSnippet,
        language: entry.scriptLanguage || "text",
      };
    case "statuslines":
      return {
        title: entry.configSnippet
          ? "Claude config"
          : entry.scriptBody
            ? "Source asset"
            : "Usage",
        code:
          entry.configSnippet ||
          entry.scriptBody ||
          entry.copySnippet ||
          entry.usageSnippet,
        language: entry.configSnippet ? "json" : entry.scriptLanguage || "text",
      };
    case "collections":
      return {
        title: "Quick start",
        code: entry.usageSnippet || entry.copySnippet || entry.body,
        language: "text",
      };
    case "guides":
      return {
        title: "Quick summary",
        code: entry.usageSnippet || entry.copySnippet || entry.body,
        language: "text",
      };
    default:
      return {
        title: entry.copySnippet ? "Copyable asset" : "Usage",
        code: entry.copySnippet || entry.usageSnippet || entry.body,
        language: entry.scriptLanguage || "text",
      };
  }
}

export function getMetadataFallback(entry: ContentEntry) {
  if (entry.category === "hooks") {
    return {
      title: "How to use this hook",
      points: [
        entry.trigger
          ? `Register it under the \`${entry.trigger}\` hook event in your Claude Code configuration.`
          : "Register it in your Claude Code hooks configuration.",
        entry.documentationUrl
          ? "Use the documentation link in the sidebar to confirm the event shape and required config."
          : "Open the source file in GitHub to copy the exact implementation and adapt it to your project.",
        "Keep the source file in your repo and test it locally before relying on it in production workflows.",
      ],
    };
  }

  if (entry.category === "collections") {
    return {
      title: "How to use this collection",
      points: [
        "Open the source file to review the assets included in the collection.",
        "Pick the individual entries you want to use and add them to your Claude workflow one by one.",
        "Collections need richer item metadata next, but the GitHub source still gives you the current canonical list.",
      ],
    };
  }

  if (entry.documentationUrl || entry.repoUrl) {
    return {
      title: "How to use this entry",
      points: [
        entry.documentationUrl
          ? "Start with the documentation link in the sidebar for setup and usage details."
          : "Open the repository in the sidebar for setup details.",
        "Use the source link to inspect the exact file this directory entry was built from.",
        "Copy the relevant snippet or config into your local Claude setup and test it before wider use.",
      ],
    };
  }

  return {
    title: "How to use this entry",
    points: [
      "Open the GitHub source file in the sidebar.",
      "Copy the content you need into your project or Claude configuration.",
      "Test it locally and adapt it to your workflow before relying on it.",
    ],
  };
}

export function getDownloadHref(downloadUrl: string) {
  if (downloadUrl.startsWith("/downloads/")) {
    return `/api/download?asset=${encodeURIComponent(downloadUrl)}`;
  }
  return downloadUrl;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getRelatedEntries(
  entry: ContentEntry,
  allEntries: DirectoryEntry[],
) {
  const relatedPool = allEntries.filter((item) => item.slug !== entry.slug);
  const entryTagSet = new Set(
    (entry.tags ?? []).map((tag) => tag.toLowerCase()),
  );
  const anchorHash = hashString(`${entry.category}:${entry.slug}`);

  return relatedPool
    .map((item) => {
      const sharedTagCount = (item.tags ?? []).reduce((count, tag) => {
        return entryTagSet.has(tag.toLowerCase()) ? count + 1 : count;
      }, 0);
      const sameCategory = item.category === entry.category ? 1 : 0;
      const hasDocs = item.documentationUrl ? 1 : 0;
      const hasInstall = item.installCommand ? 1 : 0;
      const dateScore = item.dateAdded ? new Date(item.dateAdded).getTime() : 0;
      const closeness = Math.abs(
        hashString(`${item.category}:${item.slug}`) - anchorHash,
      );

      return {
        item,
        score: sharedTagCount * 8 + sameCategory * 3 + hasDocs + hasInstall,
        dateScore,
        closeness,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.dateScore !== left.dateScore)
        return right.dateScore - left.dateScore;
      return left.closeness - right.closeness;
    })
    .slice(0, 2)
    .map((item) => item.item);
}

export function getCollectionItems(
  entry: ContentEntry,
  allEntries: DirectoryEntry[],
) {
  if (entry.category !== "collections" || !Array.isArray(entry.items))
    return [];

  return entry.items
    .map((item) => ({
      ...item,
      target:
        allEntries.find(
          (candidate) =>
            candidate.category === item.category &&
            candidate.slug === item.slug,
        ) ?? null,
    }))
    .filter((item) => item.target);
}

export function getTopFacts(entry: ContentEntry) {
  const facts = [
    entry.author ? { label: "Author", value: entry.author } : null,
    entry.dateAdded ? { label: "Added", value: entry.dateAdded } : null,
    entry.trigger ? { label: "Trigger", value: entry.trigger } : null,
    entry.argumentHint
      ? { label: "Arguments", value: entry.argumentHint }
      : null,
    entry.scriptLanguage
      ? { label: "Format", value: entry.scriptLanguage }
      : null,
    entry.estimatedSetupTime
      ? { label: "Setup time", value: entry.estimatedSetupTime }
      : null,
    entry.difficulty ? { label: "Difficulty", value: entry.difficulty } : null,
    entry.category === "skills" && entry.skillType
      ? { label: "Skill type", value: entry.skillType }
      : null,
    entry.category === "skills" && entry.skillLevel
      ? { label: "Skill level", value: entry.skillLevel }
      : null,
    entry.category === "skills" && entry.verificationStatus
      ? { label: "Verification", value: entry.verificationStatus }
      : null,
    entry.category === "skills" && entry.verifiedAt
      ? { label: "Verified", value: entry.verifiedAt }
      : null,
  ];

  return facts.filter((fact): fact is { label: string; value: string } =>
    Boolean(fact),
  );
}

export function getSourceSignals(entry: ContentEntry) {
  const signals = [
    entry.downloadTrust
      ? {
          label: "Package trust",
          value:
            entry.downloadTrust === "first-party"
              ? "Verified first-party package"
              : "External package, review before use",
        }
      : null,
    entry.verificationStatus
      ? { label: "Verification", value: entry.verificationStatus }
      : null,
    entry.repoUrl ? { label: "Repository", value: entry.repoUrl } : null,
    entry.documentationUrl
      ? { label: "Documentation", value: entry.documentationUrl }
      : null,
    entry.githubUrl
      ? { label: "Content source", value: entry.githubUrl }
      : null,
  ];

  return signals.filter((signal): signal is { label: string; value: string } =>
    Boolean(signal),
  );
}
