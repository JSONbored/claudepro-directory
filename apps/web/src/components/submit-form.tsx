"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categorySpec } from "@heyclaude/registry";
import { categoryLabels, siteConfig } from "@/lib/site";
import { SubmitPreviewCard } from "@/components/submit-preview-card";
import { SubmitReadinessCard } from "@/components/submit-readiness-card";
import { buildSubmissionFieldModel } from "@heyclaude/registry/submission-spec";

type SubmissionCategorySpec = {
  template: string;
  requiresAssetContent: boolean;
  requiresUsageSnippet: boolean;
  supportsSkillMetadata: boolean;
  supportsDownloadUrl: boolean;
};

const categorySpecs = categorySpec.categories as Record<
  string,
  SubmissionCategorySpec
>;
const submissionCategoryOrder = categorySpec.submissionOrder;

const categories = submissionCategoryOrder.map((category) => ({
  value: category,
  label: categoryLabels[category] ?? category,
}));

const categoryTemplateMap = Object.fromEntries(
  Object.entries(categorySpecs).map(([category, spec]) => [
    category,
    spec.template,
  ]),
) as Record<string, string>;

const categoriesRequiringAssetContent = new Set(
  Object.entries(categorySpecs)
    .filter(([, spec]) => spec.requiresAssetContent)
    .map(([category]) => category),
);

const categoriesRequiringUsageSnippet = new Set(
  Object.entries(categorySpecs)
    .filter(([, spec]) => spec.requiresUsageSnippet)
    .map(([category]) => category),
);

const categoriesSupportingDownloads = new Set(
  Object.entries(categorySpecs)
    .filter(([, spec]) => spec.supportsDownloadUrl)
    .map(([category]) => category),
);

const defaultTestedPlatforms = categorySpec.defaultTestedPlatforms.join(", ");

function slugifySubmission(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function hasText(value: string) {
  return value.trim().length > 0;
}

export function SubmitForm() {
  const [toolName, setToolName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [category, setCategory] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [usageSnippet, setUsageSnippet] = useState("");
  const [commandSyntax, setCommandSyntax] = useState("");
  const [trigger, setTrigger] = useState("");
  const [scriptLanguage, setScriptLanguage] = useState("bash");
  const [assetContent, setAssetContent] = useState("");
  const [tags, setTags] = useState("");
  const [skillType, setSkillType] = useState("general");
  const [skillLevel, setSkillLevel] = useState("advanced");
  const [verificationStatus, setVerificationStatus] = useState("draft");
  const [verifiedAt, setVerifiedAt] = useState("");
  const [retrievalSources, setRetrievalSources] = useState("");
  const [testedPlatforms, setTestedPlatforms] = useState(
    defaultTestedPlatforms,
  );
  const suggestedSlug = useMemo(() => slugifySubmission(toolName), [toolName]);
  const normalizedSlug = slug || suggestedSlug;

  useEffect(() => {
    if (slugEdited) return;
    setSlug(suggestedSlug);
  }, [slugEdited, suggestedSlug]);

  const issueUrl = useMemo(() => {
    const template = categoryTemplateMap[category] ?? "submit-entry.md";
    const categoryLabel = categoryLabels[category] ?? "Entry";
    const title = `Submit ${categoryLabel}: ${toolName || "New directory entry"}`;
    const effectiveUsageSnippet = usageSnippet || installCommand;

    const params = new URLSearchParams({
      template,
      title,
    });

    if (toolName) params.set("name", toolName);
    if (normalizedSlug) params.set("slug", normalizedSlug);
    if (category) params.set("category", category);
    if (githubUrl) params.set("github_url", githubUrl);
    if (docsUrl) params.set("docs_url", docsUrl);
    if (downloadUrl) params.set("download_url", downloadUrl);
    if (author) params.set("author", author);
    if (email) params.set("contact_email", email);
    if (tags) params.set("tags", tags);
    if (description) params.set("description", description);
    if (cardDescription) params.set("card_description", cardDescription);
    if (installCommand) params.set("install_command", installCommand);
    if (installCommand) params.set("install_or_usage", installCommand);
    if (effectiveUsageSnippet)
      params.set("usage_snippet", effectiveUsageSnippet);
    if (commandSyntax) params.set("command_syntax", commandSyntax);
    if (trigger) params.set("trigger", trigger);
    if (
      scriptLanguage &&
      (category === "hooks" || category === "statuslines")
    ) {
      params.set("script_language", scriptLanguage);
    }
    if (assetContent) params.set("full_copyable_content", assetContent);
    if (assetContent) params.set("guide_content_markdown", assetContent);
    if (category === "skills") {
      params.set("skill_type", skillType);
      params.set("skill_level", skillLevel);
      params.set("verification_status", verificationStatus);
      if (verifiedAt) params.set("verified_at", verifiedAt);
      if (retrievalSources) params.set("retrieval_sources", retrievalSources);
      if (testedPlatforms) params.set("tested_platforms", testedPlatforms);
    }

    return `${siteConfig.githubUrl}/issues/new?${params.toString()}`;
  }, [
    assetContent,
    author,
    cardDescription,
    category,
    commandSyntax,
    description,
    docsUrl,
    downloadUrl,
    email,
    githubUrl,
    installCommand,
    normalizedSlug,
    scriptLanguage,
    skillLevel,
    skillType,
    tags,
    testedPlatforms,
    toolName,
    trigger,
    usageSnippet,
    retrievalSources,
    verificationStatus,
    verifiedAt,
  ]);

  const selectedFieldModel = useMemo(
    () => (category ? buildSubmissionFieldModel(category) : null),
    [category],
  );
  const categoryNeedsAsset =
    selectedFieldModel?.fields.some(
      (field) => field.id === "full_copyable_content" && field.required,
    ) ?? categoriesRequiringAssetContent.has(category);
  const categoryNeedsSkillMetadata =
    selectedFieldModel?.fields.some((field) => field.id === "skill_type") ??
    categorySpecs[category]?.supportsSkillMetadata === true;
  const categoryNeedsUsage =
    selectedFieldModel?.fields.some(
      (field) => field.id === "usage_snippet" && field.required,
    ) ?? categoriesRequiringUsageSnippet.has(category);

  const readinessItems = useMemo(() => {
    const items = [
      { label: "Name", ready: hasText(toolName) },
      { label: "Slug", ready: hasText(normalizedSlug) },
      { label: "Category", ready: hasText(category) },
      { label: "Email", ready: hasText(email) },
      { label: "Description", ready: hasText(description) },
      { label: "Card description", ready: hasText(cardDescription) },
    ];

    if (categoryNeedsUsage) {
      items.push({
        label: "Usage snippet",
        ready: hasText(usageSnippet || installCommand),
      });
    }
    if (categoryNeedsAsset) {
      items.push({
        label: "Full copyable asset",
        ready: hasText(assetContent),
      });
    }
    if (category === "commands") {
      items.push({ label: "Command syntax", ready: hasText(commandSyntax) });
    }
    if (category === "hooks") {
      items.push({ label: "Hook trigger", ready: hasText(trigger) });
    }
    if (category === "mcp") {
      items.push({ label: "Install command", ready: hasText(installCommand) });
    }
    if (category === "skills") {
      items.push(
        {
          label: "Install command or download URL",
          ready: hasText(installCommand) || hasText(downloadUrl),
        },
        { label: "Skill type", ready: hasText(skillType) },
        { label: "Skill level", ready: hasText(skillLevel) },
        { label: "Verification status", ready: hasText(verificationStatus) },
      );
      if (skillType === "capability-pack") {
        items.push(
          { label: "Verified date", ready: hasText(verifiedAt) },
          { label: "Retrieval sources", ready: hasText(retrievalSources) },
        );
      }
    }
    if (category === "statuslines") {
      items.push({ label: "Script language", ready: hasText(scriptLanguage) });
    }

    return items;
  }, [
    assetContent,
    cardDescription,
    category,
    categoryNeedsAsset,
    categoryNeedsUsage,
    commandSyntax,
    description,
    downloadUrl,
    email,
    installCommand,
    normalizedSlug,
    retrievalSources,
    scriptLanguage,
    skillLevel,
    skillType,
    toolName,
    trigger,
    usageSnippet,
    verificationStatus,
    verifiedAt,
  ]);
  const missingReadinessItems = readinessItems.filter((item) => !item.ready);
  const sourceWarning = !hasText(githubUrl) && !hasText(docsUrl);
  const readinessScore = readinessItems.length
    ? Math.round(
        ((readinessItems.length - missingReadinessItems.length) /
          readinessItems.length) *
          100,
      )
    : 0;

  const isReady = Boolean(category);

  return (
    <form
      className="submit-form-card"
      action={issueUrl}
      method="get"
      target="_blank"
    >
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
          onChange={(event) => {
            setSlug(slugifySubmission(event.target.value));
            setSlugEdited(true);
          }}
          placeholder="e.g. airtable-mcp-server"
          className="submit-input"
        />
        <p className="text-xs text-muted-foreground">
          Normalized: {normalizedSlug || "enter a name or slug"}
          {category && normalizedSlug
            ? ` -> content/${category}/${normalizedSlug}.mdx`
            : ""}
        </p>
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

      {categoriesSupportingDownloads.has(category) ? (
        <div className="space-y-1">
          <label htmlFor="submit-download" className="submit-label">
            Download URL
          </label>
          <input
            id="submit-download"
            type="url"
            value={downloadUrl}
            onChange={(event) => setDownloadUrl(event.target.value)}
            placeholder="https://github.com/owner/repo/releases/download/..."
            className="submit-input"
          />
        </div>
      ) : null}

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

      {categoryNeedsUsage ? (
        <div className="space-y-1">
          <label htmlFor="submit-usage-snippet" className="submit-label">
            Usage snippet
          </label>
          <textarea
            id="submit-usage-snippet"
            value={usageSnippet}
            onChange={(event) => setUsageSnippet(event.target.value)}
            placeholder="Paste the exact usage/config steps a user should run or copy."
            className="submit-textarea"
          />
        </div>
      ) : null}

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

      {category === "statuslines" ? (
        <div className="space-y-1">
          <label htmlFor="submit-script-language" className="submit-label">
            Script language
          </label>
          <Select value={scriptLanguage} onValueChange={setScriptLanguage}>
            <SelectTrigger
              id="submit-script-language"
              className="submit-select-trigger"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="directory-select-content">
              <SelectItem value="bash">bash</SelectItem>
              <SelectItem value="zsh">zsh</SelectItem>
              <SelectItem value="fish">fish</SelectItem>
              <SelectItem value="python">python</SelectItem>
              <SelectItem value="javascript">javascript</SelectItem>
              <SelectItem value="other">other</SelectItem>
            </SelectContent>
          </Select>
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

      {categoryNeedsSkillMetadata ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="submit-skill-type" className="submit-label">
                Skill type
              </label>
              <Select value={skillType} onValueChange={setSkillType}>
                <SelectTrigger
                  id="submit-skill-type"
                  className="submit-select-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="directory-select-content">
                  <SelectItem value="general">general</SelectItem>
                  <SelectItem value="capability-pack">
                    capability-pack
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="submit-skill-level" className="submit-label">
                Skill level
              </label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger
                  id="submit-skill-level"
                  className="submit-select-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="directory-select-content">
                  <SelectItem value="foundational">foundational</SelectItem>
                  <SelectItem value="advanced">advanced</SelectItem>
                  <SelectItem value="expert">expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="submit-verification-status"
                className="submit-label"
              >
                Verification
              </label>
              <Select
                value={verificationStatus}
                onValueChange={setVerificationStatus}
              >
                <SelectTrigger
                  id="submit-verification-status"
                  className="submit-select-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="directory-select-content">
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="validated">validated</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="submit-verified-at" className="submit-label">
              Verified date (YYYY-MM-DD)
            </label>
            <input
              id="submit-verified-at"
              value={verifiedAt}
              onChange={(event) => setVerifiedAt(event.target.value)}
              placeholder="2026-04-10"
              className="submit-input"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="submit-retrieval-sources" className="submit-label">
              Retrieval sources
            </label>
            <textarea
              id="submit-retrieval-sources"
              value={retrievalSources}
              onChange={(event) => setRetrievalSources(event.target.value)}
              placeholder="https://docs.example.com, https://api.example.com/reference"
              className="submit-textarea"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="submit-tested-platforms" className="submit-label">
              Tested platforms
            </label>
            <input
              id="submit-tested-platforms"
              value={testedPlatforms}
              onChange={(event) => setTestedPlatforms(event.target.value)}
              placeholder="Claude, Codex, OpenClaw, Cursor, Windsurf, Gemini"
              className="submit-input"
            />
          </div>
        </>
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

      <SubmitReadinessCard
        category={category}
        items={readinessItems}
        sourceWarning={sourceWarning}
      />

      <SubmitPreviewCard
        title={toolName}
        slug={normalizedSlug}
        category={category}
        author={author}
        description={description}
        cardDescription={cardDescription}
        tags={tags}
        githubUrl={githubUrl}
        docsUrl={docsUrl}
        installCommand={installCommand}
        assetContent={assetContent || usageSnippet || installCommand}
        readinessScore={readinessScore}
        sourceWarning={sourceWarning}
      />

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-xs leading-6 text-muted-foreground">
        This opens a category-specific GitHub issue form. Required fields are
        enforced on GitHub, and anything you entered here is used as prefill
        where supported.
      </div>

      <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-xs leading-6 text-muted-foreground">
        Guides and collections are temporarily handled via direct templates:{" "}
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

      <button
        type="submit"
        className="submit-primary-button"
        disabled={!isReady}
      >
        Open GitHub Issue
      </button>
    </form>
  );
}
