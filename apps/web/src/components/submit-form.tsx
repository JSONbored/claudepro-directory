"use client";

import { useMemo, useState } from "react";

import { categoryLabels, siteConfig } from "@/lib/site";

const categories = siteConfig.categoryOrder.map((category) => ({
  value: category,
  label: categoryLabels[category] ?? category
}));

export function SubmitForm() {
  const [toolName, setToolName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [tags, setTags] = useState("");

  const issueUrl = useMemo(() => {
    const title = `Submit: ${toolName || "New directory entry"}`;
    const issueBody = [
      "## Submission",
      "",
      `- Name: ${toolName || "[replace me]"}`,
      `- Category: ${category || "[replace me]"}`,
      `- GitHub URL: ${githubUrl || "[replace me]"}`,
      `- Docs URL: ${docsUrl || "[optional]"}`,
      `- Install / usage: ${installCommand || "[optional]"}`,
      `- Contact email: ${email || "[replace me]"}`,
      `- Tags: ${tags || "[optional]"}`,
      "",
      "## What it does",
      "",
      description || "[replace me]",
      "",
      "## Notes",
      "",
      "- Anything maintainers should know",
      "- Screenshots or examples if relevant"
    ].join("\n");

    const params = new URLSearchParams({
      template: "submit-entry.md",
      labels: "submission",
      title,
      body: issueBody
    });

    return `${siteConfig.githubUrl}/issues/new?${params.toString()}`;
  }, [category, description, docsUrl, email, githubUrl, installCommand, tags, toolName]);

  return (
    <form
      className="submit-form-card"
      action={issueUrl}
      method="get"
      target="_blank"
      rel="noreferrer"
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
          required
        />
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
        <p className="text-xs leading-6 text-muted-foreground">
          Used only so we can follow up if something is unclear.
        </p>
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
        <label htmlFor="submit-category" className="submit-label">
          Category <span className="text-destructive">*</span>
        </label>
        <select
          id="submit-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="submit-input"
          required
        >
          <option value="">Select a category</option>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

      <button type="submit" className="submit-primary-button">
        Open GitHub Issue
      </button>
    </form>
  );
}
