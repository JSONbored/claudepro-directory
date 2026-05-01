"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

type SubmitStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; issueUrl: string }
  | { state: "error"; message: string; fallbackUrl: string };

function getApiErrorPayloadMessage(result: {
  error?: string | { code?: string; message?: string; details?: unknown };
  errors?: string[];
}) {
  if (result.errors?.length) return result.errors.join(", ");
  if (typeof result.error === "string") return result.error;
  if (result.error?.message) return result.error.message;
  if (result.error?.code) return result.error.code;
  return "";
}

function getApiErrorFallbackUrl(result: {
  fallbackUrl?: string;
  error?: string | { details?: unknown };
}) {
  if (result.fallbackUrl) return result.fallbackUrl;
  if (typeof result.error === "object" && result.error?.details) {
    const details = result.error.details as { fallbackUrl?: unknown };
    if (typeof details.fallbackUrl === "string") return details.fallbackUrl;
  }
  return "";
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

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

const prefilledFieldSetters: Record<
  string,
  (value: string, setters: Record<string, (value: string) => void>) => void
> = {
  author: (value, setters) => setters.author(value),
  contact_email: (value, setters) => setters.publicContact(value),
  download_url: (value, setters) => setters.downloadUrl(value),
  install_command: (value, setters) => setters.installCommand(value),
  usage_snippet: (value, setters) => setters.usageSnippet(value),
  skill_type: (value, setters) => setters.skillType(value),
  skill_level: (value, setters) => setters.skillLevel(value),
  verification_status: (value, setters) => setters.verificationStatus(value),
  verified_at: (value, setters) => setters.verifiedAt(value),
  retrieval_sources: (value, setters) => setters.retrievalSources(value),
  tested_platforms: (value, setters) => setters.testedPlatforms(value),
  command_syntax: (value, setters) => setters.commandSyntax(value),
  trigger: (value, setters) => setters.trigger(value),
  script_language: (value, setters) => setters.scriptLanguage(value),
  full_copyable_content: (value, setters) => setters.assetContent(value),
  guide_content: (value, setters) => setters.assetContent(value),
  items: (value, setters) => setters.items(value),
};

export function SubmitForm() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const [toolName, setToolName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [author, setAuthor] = useState("");
  const [publicContact, setPublicContact] = useState("");
  const [description, setDescription] = useState("");
  const [cardDescription, setCardDescription] = useState("");
  const [category, setCategory] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDomain, setBrandDomain] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [usageSnippet, setUsageSnippet] = useState("");
  const [commandSyntax, setCommandSyntax] = useState("");
  const [trigger, setTrigger] = useState("");
  const [scriptLanguage, setScriptLanguage] = useState("bash");
  const [assetContent, setAssetContent] = useState("");
  const [items, setItems] = useState("");
  const [tags, setTags] = useState("");
  const [skillType, setSkillType] = useState("general");
  const [skillLevel, setSkillLevel] = useState("advanced");
  const [verificationStatus, setVerificationStatus] = useState("draft");
  const [verifiedAt, setVerifiedAt] = useState("");
  const [retrievalSources, setRetrievalSources] = useState("");
  const [testedPlatforms, setTestedPlatforms] = useState(
    defaultTestedPlatforms,
  );
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({
    state: "idle",
  });
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const suggestedSlug = useMemo(() => slugifySubmission(toolName), [toolName]);
  const normalizedSlug = slug || suggestedSlug;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get("name") ?? "";
    const categoryParam = params.get("category") ?? "";
    const slugParam = params.get("slug") ?? "";
    const githubParam = params.get("github_url") ?? "";
    const docsParam = params.get("docs_url") ?? "";
    const brandNameParam = params.get("brand_name") ?? "";
    const brandDomainParam = params.get("brand_domain") ?? "";
    const descriptionParam = params.get("description") ?? "";
    const cardDescriptionParam = params.get("card_description") ?? "";
    const tagsParam = params.get("tags") ?? "";
    const setters: Record<string, (value: string) => void> = {
      author: setAuthor,
      publicContact: setPublicContact,
      downloadUrl: setDownloadUrl,
      installCommand: setInstallCommand,
      usageSnippet: setUsageSnippet,
      skillType: setSkillType,
      skillLevel: setSkillLevel,
      verificationStatus: setVerificationStatus,
      verifiedAt: setVerifiedAt,
      retrievalSources: setRetrievalSources,
      testedPlatforms: setTestedPlatforms,
      commandSyntax: setCommandSyntax,
      trigger: setTrigger,
      scriptLanguage: setScriptLanguage,
      assetContent: setAssetContent,
      items: setItems,
    };

    if (nameParam) setToolName(nameParam);
    if (siteConfig.categoryOrder.includes(categoryParam)) {
      setCategory(categoryParam);
    }
    if (slugParam) {
      setSlug(slugifySubmission(slugParam));
      setSlugEdited(true);
    }
    if (githubParam) setGithubUrl(githubParam);
    if (docsParam) setDocsUrl(docsParam);
    if (brandNameParam) setBrandName(brandNameParam);
    if (brandDomainParam) setBrandDomain(brandDomainParam);
    if (descriptionParam) setDescription(descriptionParam);
    if (cardDescriptionParam) setCardDescription(cardDescriptionParam);
    if (tagsParam) setTags(tagsParam);
    for (const [field, hydrate] of Object.entries(prefilledFieldSetters)) {
      const value = params.get(field) ?? "";
      if (value) hydrate(value, setters);
    }
  }, []);

  useEffect(() => {
    if (slugEdited) return;
    setSlug(suggestedSlug);
  }, [slugEdited, suggestedSlug]);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return;

    let cancelled = false;
    const renderTurnstile = () => {
      if (
        cancelled ||
        !turnstileRef.current ||
        !window.turnstile ||
        turnstileWidgetId.current
      ) {
        return;
      }
      turnstileWidgetId.current = window.turnstile.render(
        turnstileRef.current,
        {
          sitekey: turnstileSiteKey,
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
        },
      );
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      const existing = document.getElementById("cf-turnstile-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = renderTurnstile;
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", renderTurnstile, { once: true });
      }
    }

    return () => {
      cancelled = true;
      if (turnstileWidgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, [turnstileSiteKey]);

  const selectedFieldModel = useMemo(
    () => (category ? buildSubmissionFieldModel(category) : null),
    [category],
  );
  const selectedFields = selectedFieldModel?.fields ?? [];
  const selectedFieldIds = useMemo(
    () => new Set(selectedFields.map((field) => field.id)),
    [selectedFields],
  );
  const requiredFieldIds = useMemo(
    () =>
      new Set(
        selectedFields
          .filter((field) => field.required)
          .map((field) => field.id),
      ),
    [selectedFields],
  );
  const assetField = selectedFields.find(
    (field) =>
      field.id === "full_copyable_content" || field.id === "guide_content",
  );
  const triggerOptions =
    selectedFields.find((field) => field.id === "trigger")?.options ?? [];
  const scriptLanguageOptions =
    selectedFields.find((field) => field.id === "script_language")?.options ??
    [];

  const submissionFieldValues = useMemo(
    () =>
      ({
        name: toolName,
        slug: normalizedSlug,
        category,
        github_url: githubUrl,
        docs_url: docsUrl,
        brand_name: brandName,
        brand_domain: brandDomain,
        download_url: downloadUrl,
        author,
        contact_email: publicContact,
        tags,
        description,
        card_description: cardDescription,
        install_command: installCommand,
        install_or_usage: installCommand,
        usage_snippet: usageSnippet || installCommand,
        command_syntax: commandSyntax,
        trigger,
        script_language: scriptLanguage,
        full_copyable_content: assetContent,
        guide_content: assetContent,
        items,
        skill_type: skillType,
        skill_level: skillLevel,
        verification_status: verificationStatus,
        verified_at: verifiedAt,
        retrieval_sources: retrievalSources,
        tested_platforms: testedPlatforms,
      }) as Record<string, string>,
    [
      assetContent,
      author,
      brandDomain,
      brandName,
      cardDescription,
      category,
      commandSyntax,
      description,
      docsUrl,
      downloadUrl,
      githubUrl,
      installCommand,
      items,
      normalizedSlug,
      publicContact,
      retrievalSources,
      scriptLanguage,
      skillLevel,
      skillType,
      tags,
      testedPlatforms,
      toolName,
      trigger,
      usageSnippet,
      verificationStatus,
      verifiedAt,
    ],
  );

  const issueUrl = useMemo(() => {
    const template = categoryTemplateMap[category] ?? "submit-entry.md";
    const categoryLabel = categoryLabels[category] ?? "Entry";
    const title = `Submit ${categoryLabel}: ${toolName || "New directory entry"}`;

    const params = new URLSearchParams({
      template,
      title,
    });

    for (const field of selectedFields) {
      const value = submissionFieldValues[field.id];
      if (hasText(value)) params.set(field.id, value);
    }
    if (installCommand) params.set("install_or_usage", installCommand);

    return `${siteConfig.githubUrl}/issues/new?${params.toString()}`;
  }, [
    category,
    installCommand,
    selectedFields,
    submissionFieldValues,
    toolName,
  ]);
  const categoryNeedsAsset =
    Boolean(assetField) || categoriesRequiringAssetContent.has(category);
  const categoryNeedsSkillMetadata =
    selectedFieldIds.has("skill_type") ||
    categorySpecs[category]?.supportsSkillMetadata === true;
  const categoryNeedsUsage =
    selectedFields.some(
      (field) => field.id === "usage_snippet" && field.required,
    ) || categoriesRequiringUsageSnippet.has(category);
  const categoryNeedsItems = selectedFieldIds.has("items");

  const readinessItems = useMemo(() => {
    const items = selectedFields
      .filter((field) => field.required)
      .map((field) => ({
        label: field.label,
        ready: hasText(submissionFieldValues[field.id] ?? ""),
      }));

    if (category === "skills") {
      items.push({
        label: "Install command or download URL",
        ready: hasText(installCommand) || hasText(downloadUrl),
      });
      if (skillType === "capability-pack") {
        items.push(
          { label: "Verified date", ready: hasText(verifiedAt) },
          { label: "Retrieval sources", ready: hasText(retrievalSources) },
        );
      }
    }
    return items;
  }, [
    category,
    downloadUrl,
    installCommand,
    retrievalSources,
    selectedFields,
    skillType,
    submissionFieldValues,
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

  const isReady = Boolean(category) && missingReadinessItems.length === 0;

  const resetTurnstile = () => {
    setTurnstileToken("");
    if (turnstileWidgetId.current) {
      window.turnstile?.reset(turnstileWidgetId.current);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady || submitStatus.state === "submitting") return;

    setSubmitStatus({ state: "submitting" });
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fields: submissionFieldValues,
          honeypot,
          turnstileToken,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        issueUrl?: string;
        fallbackUrl?: string;
        error?: string | { code?: string; message?: string; details?: unknown };
        errors?: string[];
      };

      if (response.ok && result.issueUrl) {
        setSubmitStatus({ state: "success", issueUrl: result.issueUrl });
        resetTurnstile();
        return;
      }

      const message =
        getApiErrorPayloadMessage(result) ||
        `Submission failed with status ${response.status}`;
      setSubmitStatus({
        state: "error",
        message,
        fallbackUrl: getApiErrorFallbackUrl(result) || issueUrl,
      });
      resetTurnstile();
    } catch {
      setSubmitStatus({
        state: "error",
        message: "Submission endpoint is temporarily unavailable.",
        fallbackUrl: issueUrl,
      });
      resetTurnstile();
    }
  };

  return (
    <form className="submit-form-card" onSubmit={handleSubmit}>
      <div aria-hidden="true" className="hidden">
        <label htmlFor="submit-company-website">Company website</label>
        <input
          id="submit-company-website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

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
          Public contact
        </label>
        <input
          id="submit-email"
          value={publicContact}
          onChange={(event) => setPublicContact(event.target.value)}
          placeholder="@github-handle or email if public"
          className="submit-input"
        />
        <p className="text-xs leading-6 text-muted-foreground">
          Optional. Website submissions create public GitHub issues, so only
          include contact details you are comfortable making public.
        </p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="submit-brand-name" className="submit-label">
            Brand name
          </label>
          <input
            id="submit-brand-name"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder="e.g. Asana"
            className="submit-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="submit-brand-domain" className="submit-label">
            Brand domain
          </label>
          <input
            id="submit-brand-domain"
            value={brandDomain}
            onChange={(event) => setBrandDomain(event.target.value)}
            placeholder="e.g. asana.com"
            className="submit-input"
          />
          <p className="text-xs leading-6 text-muted-foreground">
            Optional. Use the provider's canonical domain so maintainers can
            verify the right logo.
          </p>
        </div>
      </div>

      {selectedFieldIds.has("download_url") ||
      categoriesSupportingDownloads.has(category) ? (
        <div className="space-y-1">
          <label htmlFor="submit-download" className="submit-label">
            Download URL{" "}
            {requiredFieldIds.has("download_url") ? (
              <span className="text-destructive">*</span>
            ) : null}
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
          Install or usage command{" "}
          {requiredFieldIds.has("install_command") ? (
            <span className="text-destructive">*</span>
          ) : null}
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
            Usage snippet{" "}
            {requiredFieldIds.has("usage_snippet") ? (
              <span className="text-destructive">*</span>
            ) : null}
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
            Command syntax{" "}
            {requiredFieldIds.has("command_syntax") ? (
              <span className="text-destructive">*</span>
            ) : null}
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
            Hook trigger <span className="text-destructive">*</span>
          </label>
          {triggerOptions.length ? (
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger
                id="submit-trigger"
                className="submit-select-trigger"
              >
                <SelectValue placeholder="Select a trigger" />
              </SelectTrigger>
              <SelectContent className="directory-select-content">
                {triggerOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              id="submit-trigger"
              value={trigger}
              onChange={(event) => setTrigger(event.target.value)}
              placeholder="PreToolUse, PostToolUse, Stop, etc."
              className="submit-input"
            />
          )}
        </div>
      ) : null}

      {category === "statuslines" ? (
        <div className="space-y-1">
          <label htmlFor="submit-script-language" className="submit-label">
            Script language <span className="text-destructive">*</span>
          </label>
          <Select value={scriptLanguage} onValueChange={setScriptLanguage}>
            <SelectTrigger
              id="submit-script-language"
              className="submit-select-trigger"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="directory-select-content">
              {(scriptLanguageOptions.length
                ? scriptLanguageOptions
                : ["bash", "zsh", "fish", "python", "javascript", "other"]
              ).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {categoryNeedsAsset ? (
        <div className="space-y-1">
          <label htmlFor="submit-asset-content" className="submit-label">
            {assetField?.label ?? "Full copyable asset content"}{" "}
            {assetField?.required ? (
              <span className="text-destructive">*</span>
            ) : null}
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

      {categoryNeedsItems ? (
        <div className="space-y-1">
          <label htmlFor="submit-items" className="submit-label">
            Items <span className="text-destructive">*</span>
          </label>
          <textarea
            id="submit-items"
            value={items}
            onChange={(event) => setItems(event.target.value)}
            placeholder={"mcp/example-server\nskills/example-skill"}
            className="submit-textarea"
          />
        </div>
      ) : null}

      {categoryNeedsSkillMetadata ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="submit-skill-type" className="submit-label">
                Skill type{" "}
                {requiredFieldIds.has("skill_type") ? (
                  <span className="text-destructive">*</span>
                ) : null}
              </label>
              <Select value={skillType} onValueChange={setSkillType}>
                <SelectTrigger
                  id="submit-skill-type"
                  className="submit-select-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="directory-select-content">
                  {categorySpec.skillTypeValues.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor="submit-skill-level" className="submit-label">
                Skill level{" "}
                {requiredFieldIds.has("skill_level") ? (
                  <span className="text-destructive">*</span>
                ) : null}
              </label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger
                  id="submit-skill-level"
                  className="submit-select-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="directory-select-content">
                  {categorySpec.skillLevelValues.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="submit-verification-status"
                className="submit-label"
              >
                Verification{" "}
                {requiredFieldIds.has("verification_status") ? (
                  <span className="text-destructive">*</span>
                ) : null}
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
                  {categorySpec.verificationStatusValues.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
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
              placeholder="Claude, Codex, Windsurf, Gemini, Cursor, Generic AGENTS"
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
        brandName={brandName}
        brandDomain={brandDomain}
        installCommand={installCommand}
        assetContent={assetContent || usageSnippet || installCommand}
        readinessScore={readinessScore}
        sourceWarning={sourceWarning}
      />

      <div className="rounded-xl border border-border bg-background px-4 py-3 text-xs leading-6 text-muted-foreground">
        This creates a reviewable GitHub issue from the website. If the direct
        submission endpoint is unavailable, use the fallback link below to open
        the same schema-aligned issue body in GitHub.
      </div>

      {turnstileSiteKey ? <div ref={turnstileRef} /> : null}

      {submitStatus.state === "success" ? (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-7 text-foreground">
          Submission issue created:{" "}
          <a
            href={submitStatus.issueUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            view on GitHub
          </a>
          .
        </div>
      ) : null}

      {submitStatus.state === "error" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-7 text-foreground">
          {submitStatus.message}{" "}
          <a
            href={submitStatus.fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-4"
          >
            Open GitHub fallback
          </a>
          .
        </div>
      ) : null}

      <button
        type="submit"
        className="submit-primary-button"
        disabled={!isReady || submitStatus.state === "submitting"}
      >
        {submitStatus.state === "submitting"
          ? "Submitting..."
          : "Submit for review"}
      </button>

      <a
        href={issueUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex justify-center text-sm font-medium text-primary underline underline-offset-4"
      >
        Open GitHub issue form instead
      </a>
    </form>
  );
}
