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
  agents: "submit-agent.yml",
  rules: "submit-rule.yml",
  mcp: "submit-mcp.yml",
  skills: "submit-skill.yml",
  hooks: "submit-hook.yml",
  commands: "submit-command.yml",
  statuslines: "submit-statusline.yml",
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

    const params = new URLSearchParams({
      template,
      title
    });

    if (toolName) params.set("name", toolName);
    if (slug) params.set("slug", slug);
    if (category) params.set("category", category);
    if (githubUrl) params.set("github_url", githubUrl);
    if (docsUrl) params.set("docs_url", docsUrl);
    if (author) params.set("author", author);
    if (email) params.set("contact_email", email);
    if (tags) params.set("tags", tags);
    if (description) params.set("description", description);
    if (cardDescription) params.set("card_description", cardDescription);
    if (installCommand) params.set("install_command", installCommand);
    if (installCommand) params.set("install_or_usage", installCommand);
    if (commandSyntax) params.set("command_syntax", commandSyntax);
    if (trigger) params.set("trigger", trigger);
    if (assetContent) params.set("full_copyable_content", assetContent);
    if (assetContent) params.set("guide_content_markdown", assetContent);

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

  const isReady = Boolean(category);

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
          Email
        </label>
        <input
          id="submit-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="submit-input"
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
          Description
        </label>
        <textarea
          id="submit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe what this is, why it matters, and how someone would use it."
          className="submit-textarea"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="submit-card-description" className="submit-label">
          Card description
        </label>
        <input
          id="submit-card-description"
          value={cardDescription}
          onChange={(event) => setCardDescription(event.target.value)}
          placeholder="Short summary shown in browse cards."
          className="submit-input"
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
            Command syntax
          </label>
          <input
            id="submit-command-syntax"
            value={commandSyntax}
            onChange={(event) => setCommandSyntax(event.target.value)}
            placeholder="/command-name [arguments]"
            className="submit-input"
          />
        </div>
      ) : null}

      {category === "hooks" ? (
        <div className="space-y-1">
          <label htmlFor="submit-trigger" className="submit-label">
            Hook trigger
          </label>
          <input
            id="submit-trigger"
            value={trigger}
            onChange={(event) => setTrigger(event.target.value)}
            placeholder="PreToolUse, PostToolUse, Stop, etc."
            className="submit-input"
          />
        </div>
      ) : null}

      {categoryNeedsAsset ? (
        <div className="space-y-1">
          <label htmlFor="submit-asset-content" className="submit-label">
            Full copyable asset content
          </label>
          <textarea
            id="submit-asset-content"
            value={assetContent}
            onChange={(event) => setAssetContent(event.target.value)}
            placeholder="Paste the exact prompt/config/script/markdown to publish."
            className="submit-textarea min-h-56"
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
        This opens a category-specific GitHub issue form. Required fields are enforced
        on GitHub, and anything you entered here is used as prefill where supported.
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
