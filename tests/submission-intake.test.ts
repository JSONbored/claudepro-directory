import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  buildSubmissionQueue,
  isLikelyAffiliateUrl,
  looksLikeSubmissionIssue,
  parseIssueFormBody,
  recommendedSubmissionLabels,
  validateSubmission,
} from "@heyclaude/registry/submission";
import { categorySpec } from "@heyclaude/registry";
import {
  buildIssueTemplateSpec,
  buildSubmissionFieldModel,
} from "@heyclaude/registry/submission-spec";
import { submissionLabelsForCategory } from "@heyclaude/registry/submission-labels";

const repoRoot = path.resolve(import.meta.dirname, "..");

function issue(body: string, labels = ["content-submission"]) {
  return {
    body,
    labels: labels.map((name) => ({ name })),
    title: "Submit MCP: example",
    number: 1,
    url: "https://github.com/owner/repo/issues/1",
    author: { login: "contributor" },
    updatedAt: "2026-04-26T00:00:00Z",
  };
}

describe("submission intake", () => {
  it("derives web form and issue template fields from registry specs", () => {
    const model = buildSubmissionFieldModel("skills");
    expect(model).toBeTruthy();
    expect(
      model?.fields.some(
        (field) => field.id === "skill_type" && field.required,
      ),
    ).toBe(true);
    expect(
      model?.fields.some(
        (field) => field.id === "download_url" && !field.required,
      ),
    ).toBe(true);

    const issueTemplate = buildIssueTemplateSpec("mcp");
    expect(issueTemplate).toBeTruthy();
    expect(issueTemplate?.labels).toContain("content-submission");
    expect(issueTemplate?.labels).toEqual(submissionLabelsForCategory("mcp"));
    expect(
      issueTemplate?.fields.some(
        (field) => field.id === "install_command" && field.required,
      ),
    ).toBe(true);
  });

  it("keeps checked-in GitHub issue templates aligned with registry specs", () => {
    for (const category of categorySpec.submissionOrder) {
      const template = buildIssueTemplateSpec(category);
      expect(template).toBeTruthy();
      const templatePath = path.join(
        repoRoot,
        ".github",
        "ISSUE_TEMPLATE",
        template!.template,
      );
      const source = fs.readFileSync(templatePath, "utf8");
      for (const label of template!.labels) {
        expect(source).toContain(`  - "${label}"`);
      }
      for (const field of template!.fields.filter((field) => field.required)) {
        expect(source).toContain(`    id: ${field.id}`);
        expect(source).toContain("      required: true");
      }
      expect(source).toContain(
        "maintainers review and import accepted submissions manually",
      );
      expect(source).toContain("not affiliate, referral, or tracking URLs");
    }
  });

  it("normalizes category aliases and slugs", () => {
    const report = validateSubmission(
      issue(`### Name
Prompt-to-asset

### Slug
Prompt-to-asset

### Category
Mcp

### Contact email
dev@example.com

### Description
MCP server that generates visual assets.

### Card description
Generate app icons and favicons.

### Install command
npx -y prompt-to-asset

### Usage snippet
claude mcp add prompt-to-asset -- npx -y prompt-to-asset`),
    );
    expect(report.ok).toBe(true);
    expect(report.category).toBe("mcp");
    expect(report.fields.slug).toBe("prompt-to-asset");
  });

  it("accepts older submission labels without a parser shim", () => {
    const report = validateSubmission(
      issue(
        `### Name
ContrastAPI

### Slug
ContrastAPI

### Category
mcp-server

### Contact email
dev@example.com

### Description
MCP server for contrast checks.

### Card description
Check color contrast from Claude.

### Install command
npx -y contrastapi

### Usage snippet
claude mcp add contrastapi -- npx -y contrastapi`,
        ["submission"],
      ),
    );
    expect(report.ok).toBe(true);
    expect(report.category).toBe("mcp");
    expect(report.fields.slug).toBe("contrastapi");
  });

  it("detects and labels unlabeled submission-shaped issues", () => {
    const unlabeled = issue(
      `### Name
Prompt-to-asset

### Slug
Prompt-to-asset

### Category
Mcp

### Contact email
dev@example.com

### Description
MCP server that generates visual assets.

### Card description
Generate app icons and favicons.

### Install command
npx -y prompt-to-asset

### Usage snippet
claude mcp add prompt-to-asset -- npx -y prompt-to-asset`,
      [],
    );
    expect(looksLikeSubmissionIssue(unlabeled)).toBe(true);
    expect(validateSubmission(unlabeled).ok).toBe(true);
    expect(recommendedSubmissionLabels(unlabeled)).toEqual([
      "community-mcp",
      "content-submission",
      "needs-review",
    ]);
  });

  it("builds a maintainer submission queue", () => {
    const valid = issue(`### Name
ContrastAPI

### Slug
contrastapi

### Category
mcp

### Contact email
dev@example.com

### Description
Security MCP.

### Card description
Security MCP.

### Install command
claude mcp add contrastapi --transport http https://example.com/mcp

### Usage snippet
claude mcp list`);
    const invalid = issue(`### Name
Unslop

### Slug
unslop

### Category
skills

### Contact email
dev@example.com

### Description
Writing cleanup.

### Card description
Writing cleanup.

### Usage snippet
npx unslop --help`);
    const queue = buildSubmissionQueue([valid, invalid, { title: "Question" }]);
    expect(queue.count).toBe(2);
    expect(queue.summary.importReady).toBe(1);
    expect(queue.summary.needsChanges).toBe(1);
    expect(queue.entries[0].status).toBe("import_ready");
    expect(queue.entries[0].importPath).toBe("content/mcp/contrastapi.mdx");
  });

  it("rejects missing required category fields", () => {
    const report = validateSubmission(
      issue(`### Name
Unslop

### Slug
Unslop

### Category
Skill

### Contact email
dev@example.com

### Description
Clean AI writing patterns.

### Card description
Clean AI writing patterns.

### Install command
npx -y unslop

### Usage snippet
npx unslop --help`),
    );
    expect(report.ok).toBe(false);
    expect(report.category).toBe("skills");
    expect(report.errors).toContain("Missing required field: skill_type");
  });

  it("rejects community requests for local package hosting", () => {
    const report = validateSubmission(
      issue(`### Name
Local Package

### Slug
local-package

### Category
skills

### Contact email
dev@example.com

### Description
Test local package.

### Card description
Test local package.

### Download URL (optional)
/downloads/skills/local-package.zip

### Skill type
general

### Skill level
advanced

### Verification status
draft

### Usage snippet
Use it.`),
    );
    expect(report.ok).toBe(false);
    expect(report.errors).toContain(
      "Community submissions cannot request local /downloads hosting",
    );
  });

  it("rejects contributor affiliate and referral URLs", () => {
    expect(isLikelyAffiliateUrl("https://example.com/?affiliate=creator")).toBe(
      true,
    );
    const report = validateSubmission(
      issue(`### Name
Referral Tool

### Slug
referral-tool

### Category
mcp

### Contact email
dev@example.com

### GitHub URL
https://github.com/example/referral-tool?referral=affiliate

### Description
Referral test.

### Card description
Referral test.

### Install command
npx referral-tool

### Usage snippet
claude mcp add referral-tool -- npx referral-tool`),
    );
    expect(report.ok).toBe(false);
    expect(report.errors).toContain(
      "Contributor submissions cannot include affiliate/referral URLs: github_url",
    );
  });

  it("parses unstructured issue bodies into canonical fields", () => {
    const fields = parseIssueFormBody(`## Submission

**Name:** Macuse
**Website:** https://macuse.app
**GitHub:** https://github.com/macuseapp/macuse
**Category:** macOS Automation / MCP Server

### Description
Native macOS MCP server.`);
    expect(fields.name).toBe("Macuse");
    expect(fields.category).toBe("mcp");
    expect(fields.github_url).toBe("https://github.com/macuseapp/macuse");
    expect(fields.docs_url).toBe("https://macuse.app");
  });
});
