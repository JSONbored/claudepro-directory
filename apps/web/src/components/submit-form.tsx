"use client";

import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { categoryLabels, siteConfig } from "@/lib/site";

const submissionCategoryOrder = [
  "agents",
  "rules",
  "mcp",
  "skills",
  "hooks",
  "commands",
  "statuslines"
] as const;

const categories = submissionCategoryOrder.map((category) => ({
  value: category,
  label: categoryLabels[category] ?? category
}));

const categoryTemplateMap: Record<string, string> = {
  agents: "submit-agent.md",
  rules: "submit-rule.md",
  mcp: "submit-mcp.md",
  skills: "submit-skill.md",
  hooks: "submit-hook.md",
  commands: "submit-command.md",
  statuslines: "submit-statusline.md",
  collections: "submit-collection.md",
  guides: "submit-guide.md"
};

const categoriesRequiringAssetContent = new Set([
  "agents",
  "rules",
  "hooks",
  "commands",
  "statuslines",
  "guides"
]);

export function SubmitForm() {
  const [toolName, setToolName] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [category, setCategory] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [commandSyntax, setCommandSyntax] = useState("");
  const [trigger, setTrigger] = useState("");
  const [assetContent, setAssetContent] = useState("");
  const [tags, setTags] = useState("");

  const issueUrl = useMemo(() => {
    const template = categoryTemplateMap[category] ?? "submit-entry.md";
    const categoryLabel = categoryLabels[category] ?? "Entry";
    const title = `Submit ${categoryLabel}: ${toolName || "New directory entry"}`;
    const labels = ["submission"];
    if (category) labels.push(category);

    const issueBodyParts = [
      `## ${categoryLabel} Submission`,
      "",
      `- Name: ${toolName || "[replace me]"}`,
      `- Slug: ${slug || "[replace me]"}`,
      `- Category: ${category || "[replace me]"}`,
      `- GitHub URL: ${githubUrl || "[optional]"}`,
      `- Docs URL: ${docsUrl || "[optional]"}`,
      `- Author: ${author || "[optional]"}`,
      `- Contact email: ${email || "[replace me]"}`,
      `- Tags (comma-separated): ${tags || "[optional]"}`,
      "",
      "## Required content",
      "",
      `- Description (1-3 sentences): ${description || "[replace me]"}`,
      `- Card description (short preview): ${cardDescription || "[replace me]"}`,
      category === "hooks" ? `- Trigger: ${trigger || "[replace me]"}` : "",
      category === "commands" ? `- Command syntax: ${commandSyntax || "[replace me]"}` : "",
      `- Install / usage: ${installCommand || "[optional]"}`,
      categoriesRequiringAssetContent.has(category)
        ? `- Full copyable asset content:\n\n${assetContent || "[replace me]"}`
        : "",
      "",
      "## Optional notes",
      "",
      "- Anything maintainers should know",
      "- Screenshots or examples if relevant"
    ];

    const params = new URLSearchParams({
      template,
      labels: labels.join(","),
      title,
      body: issueBodyParts.filter(Boolean).join("\n")
    });

    return `${siteConfig.githubUrl}/issues/new?${params.toString()}`;
  }, [
    assetContent,
    author,
    cardDescription,
    category,
    commandSyntax,
    description,
    docsUrl,
    email,
    githubUrl,
    installCommand,
    slug,
    tags,
    toolName,
    trigger
  ]);

  const categoryNeedsAsset = categoriesRequiringAssetContent.has(category);
  const categoryNeedsTrigger = category === "hooks";
  const categoryNeedsCommandSyntax = category === "commands";

  const hasRequiredBase =
    Boolean(toolName.trim()) &&
    Boolean(slug.trim()) &&
    Boolean(email.trim()) &&
    Boolean(description.trim()) &&
    Boolean(cardDescription.trim()) &&
    Boolean(category);
  const hasCategoryRequired =
    (!categoryNeedsAsset || Boolean(assetContent.trim())) &&
    (!categoryNeedsTrigger || Boolean(trigger.trim())) &&
    (!categoryNeedsCommandSyntax || Boolean(commandSyntax.trim()));
  const isReady = hasRequiredBase && hasCategoryRequired;

  return (
    <form className="submit-form-card" action={issueUrl} method="get" target="_blank">
      <div className="space-y-1">
        <label htmlFor="tool-name" className="submit-label">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="tool-name"
          value={toolName}
          onChange={(event) => setToolName(event.target.value)}
          placeholder="e.g. Airtable MCP Server"
          className="submit-input"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-slug" className="submit-label">
          Slug <span className="text-destructive">*</span>
        </label>
        <input
          id="submit-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="e.g. airtable-mcp-server"
          className="submit-input"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-category" className="submit-label">
          Category <span className="text-destructive">*</span>
        </label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="submit-category" className="submit-select-trigger">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="directory-select-content">
            {categories.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-email" className="submit-label">
          Email <span className="text-destructive">*</span>
        </label>
        <input
          id="submit-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="submit-input"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-author" className="submit-label">
          Author
        </label>
        <input
          id="submit-author"
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          placeholder="GitHub handle or name"
          className="submit-input"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-description" className="submit-label">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id="submit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what this is, why it matters, and how someone would use it."
          className="submit-textarea"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-card-description" className="submit-label">
          Card description <span className="text-destructive">*</span>
        </label>
        <input
          id="submit-card-description"
          value={cardDescription}
          onChange={(event) => setCardDescription(event.target.value)}
          placeholder="Short summary shown in browse cards."
          className="submit-input"
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-github" className="submit-label">
          GitHub URL
        </label>
        <input
          id="submit-github"
          type="url"
          value={githubUrl}
          onChange={(event) => setGithubUrl(event.target.value)}
          placeholder="https://github.com/username/repo"
          className="submit-input"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-docs" className="submit-label">
          Docs URL
        </label>
        <input
          id="submit-docs"
          type="url"
          value={docsUrl}
          onChange={(event) => setDocsUrl(event.target.value)}
          placeholder="https://..."
          className="submit-input"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-install" className="submit-label">
          Install or usage command
        </label>
        <input
          id="submit-install"
          value={installCommand}
          onChange={(event) => setInstallCommand(event.target.value)}
          placeholder="npx ..., uvx ..., claude ..."
          className="submit-input"
        />
      </div>

      {category === "commands" ? (
        <div className="space-y-1">
          <label htmlFor="submit-command-syntax" className="submit-label">
            Command syntax <span className="text-destructive">*</span>
          </label>
          <input
            id="submit-command-syntax"
            value={commandSyntax}
            onChange={(event) => setCommandSyntax(event.target.value)}
            placeholder="/command-name [arguments]"
            className="submit-input"
            required
          />
        </div>
      ) : null}

      {category === "hooks" ? (
        <div className="space-y-1">
          <label htmlFor="submit-trigger" className="submit-label">
            Hook trigger <span className="text-destructive">*</span>
          </label>
          <input
            id="submit-trigger"
            value={trigger}
            onChange={(event) => setTrigger(event.target.value)}
            placeholder="PreToolUse, PostToolUse, Stop, etc."
            className="submit-input"
            required
          />
        </div>
      ) : null}

      {categoryNeedsAsset ? (
        <div className="space-y-1">
          <label htmlFor="submit-asset-content" className="submit-label">
            Full copyable asset content <span className="text-destructive">*</span>
          </label>
          <textarea
            id="submit-asset-content"
            value={assetContent}
            onChange={(event) => setAssetContent(event.target.value)}
            placeholder="Paste the exact prompt/config/script/markdown to publish."
            className="submit-textarea min-h-56"
            required
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="submit-tags" className="submit-label">
          Tags
        </label>
        <input
          id="submit-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="mcp, airtable, automation"
          className="submit-input"
        />
      </div>

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-xs leading-6 text-muted-foreground">
        This opens a category-specific GitHub issue template so maintainers can import
        content with schema-aligned fields and less back-and-forth.
      </div>

      <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-xs leading-6 text-muted-foreground">
        Guides and collections are temporarily handled via direct templates:
        {" "}
        <a
          className="text-primary underline underline-offset-4"
          href={`${siteConfig.githubUrl}/issues/new?template=submit-guide.md`}
          target="_blank"
          rel="noreferrer"
        >
          guide
        </a>
        {" / "}
        <a
          className="text-primary underline underline-offset-4"
          href={`${siteConfig.githubUrl}/issues/new?template=submit-collection.md`}
          target="_blank"
          rel="noreferrer"
        >
          collection
        </a>
        .
      </div>

      <button type="submit" className="submit-primary-button" disabled={!isReady}>
        Open GitHub Issue
      </button>
    </form>
  );
}
