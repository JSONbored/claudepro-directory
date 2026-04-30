import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  buildSubmissionQueue,
  buildSubmissionIssueDraft,
  isLikelyAffiliateUrl,
  looksLikeSubmissionIssue,
  parseIssueFormBody,
  recommendedSubmissionLabels,
  validateSubmission,
} from "@heyclaude/registry/submission";
import { categorySpec } from "@heyclaude/registry";
import { deriveSeoFields } from "@heyclaude/registry/content-schema";
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
    expect(
      model?.fields.some(
        (field) =>
          field.id === "contact_email" &&
          field.label === "Public contact" &&
          !field.required,
      ),
    ).toBe(true);
    expect(
      model?.fields.some(
        (field) => field.id === "brand_domain" && !field.required,
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

  it("builds website submission issues from the canonical field model", () => {
    const draft = buildSubmissionIssueDraft({
      name: "Website Intake MCP",
      slug: "website-intake-mcp",
      category: "mcp",
      contact_email: "@maintainer",
      docs_url: "https://example.com/docs",
      brand_name: "Example",
      brand_domain: "example.com",
      description:
        "MCP server submitted directly through the website intake API.",
      card_description: "Website intake API coverage.",
      install_command: "npx -y website-intake-mcp",
      usage_snippet:
        "claude mcp add website-intake-mcp -- npx -y website-intake-mcp",
    });

    expect(draft.title).toBe("Submit MCP Server: Website Intake MCP");
    expect(draft.body).toContain("### Name");
    expect(draft.body).toContain("Website Intake MCP");
    expect(draft.body).toContain("### Brand domain");
    expect(draft.body).toContain("example.com");
    expect(draft.labels).toEqual([
      "content-submission",
      "needs-review",
      "community-mcp",
    ]);
    expect(validateSubmission(draft).ok).toBe(true);
  });

  it("normalizes brand domains and rejects unsafe brand values", () => {
    const shapedIssue = issue(`### Name
Brand Intake MCP

### Slug
brand-intake-mcp

### Category
mcp

### Description
MCP server submitted with optional brand metadata.

### Card description
Brand metadata coverage.

### Brand name
Asana

### Brand domain
https://www.asana.com/docs

### Install command
npx -y brand-intake-mcp

### Usage snippet
claude mcp add brand-intake-mcp -- npx -y brand-intake-mcp`);

    const report = validateSubmission(shapedIssue);
    expect(report.ok).toBe(true);
    expect(report.fields.brand_domain).toBe("asana.com");

    const invalid = validateSubmission(
      issue(`### Name
Broken Brand MCP

### Slug
broken-brand-mcp

### Category
mcp

### Description
MCP server submitted with invalid brand metadata.

### Card description
Invalid brand metadata coverage.

### Brand domain
not a domain

### Install command
npx -y broken-brand-mcp

### Usage snippet
claude mcp add broken-brand-mcp -- npx -y broken-brand-mcp`),
    );
    expect(invalid.ok).toBe(false);
    expect(invalid.errors).toContain(
      "brand_domain must be a canonical domain such as asana.com",
    );
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
        "maintainers review accepted submissions before an import PR is opened",
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

### Public contact
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

  it("does not rely on the retired submission label", () => {
    expect(
      looksLikeSubmissionIssue({
        body: "This old label by itself should not trigger the queue.",
        labels: [{ name: "submission" }],
        title: "General question",
      }),
    ).toBe(false);

    const shapedIssue = issue(
      `### Name
ContrastAPI

### Slug
ContrastAPI

### Category
mcp-server

### Description
MCP server for contrast checks.

### Card description
Check color contrast from Claude.

### Install command
npx -y contrastapi

### Usage snippet
claude mcp add contrastapi -- npx -y contrastapi`,
      ["submission"],
    );
    expect(looksLikeSubmissionIssue(shapedIssue)).toBe(true);
    expect(validateSubmission(shapedIssue).ok).toBe(true);
  });

  it("detects and labels unlabeled submission-shaped issues", () => {
    const unlabeled = issue(
      `### Name
Prompt-to-asset

### Slug
Prompt-to-asset

### Category
Mcp

### Public contact
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

### Public contact
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

### Public contact
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

### Public contact
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

### Public contact
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

### Public contact
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

  it("rejects malformed or non-https contributor URLs", () => {
    const report = validateSubmission(
      issue(`### Name
Insecure URL Tool

### Slug
insecure-url-tool

### Category
mcp

### Public contact
dev@example.com

### GitHub URL
http://example.com/repo

### Description
MCP server with an insecure source URL.

### Card description
Insecure source URL test.

### Install command
npx insecure-url-tool

### Usage snippet
claude mcp add insecure-url-tool -- npx insecure-url-tool`),
    );
    expect(report.ok).toBe(false);
    expect(report.errors).toContain("github_url must be a valid https URL");
  });

  it("derives bounded SEO metadata for imported UGC", () => {
    const seo = deriveSeoFields(
      {
        title: "Website Intake MCP",
        description:
          "MCP server submitted directly through the website intake API for reviewable community contributions.",
        tags: ["mcp", "submission", "community"],
      },
      "mcp",
    );

    expect(seo.seoTitle.length).toBeLessThanOrEqual(70);
    expect(seo.seoDescription.length).toBeLessThanOrEqual(160);
    expect(seo.keywords).toEqual(
      expect.arrayContaining(["mcp", "submission", "community", "claude"]),
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
