import assert from "node:assert/strict";

import {
  parseIssueFormBody,
  validateSubmission,
} from "@heyclaude/registry/submission";
import {
  buildIssueTemplateSpec,
  buildSubmissionFieldModel,
} from "@heyclaude/registry/submission-spec";

{
  const model = buildSubmissionFieldModel("skills");
  assert.ok(model, "skills submission model must exist");
  assert.ok(
    model.fields.some((field) => field.id === "skill_type" && field.required),
  );
  assert.ok(
    model.fields.some(
      (field) => field.id === "download_url" && !field.required,
    ),
  );

  const issueTemplate = buildIssueTemplateSpec("mcp");
  assert.ok(issueTemplate, "mcp issue template spec must exist");
  assert.ok(issueTemplate.labels.includes("content-submission"));
  assert.ok(
    issueTemplate.fields.some(
      (field) => field.id === "install_command" && field.required,
    ),
  );
}

function issue(body, labels = ["content-submission"]) {
  return { body, labels: labels.map((name) => ({ name })) };
}

{
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
  assert.equal(report.ok, true);
  assert.equal(report.category, "mcp");
  assert.equal(report.fields.slug, "prompt-to-asset");
}

{
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
  assert.equal(report.ok, true);
  assert.equal(report.category, "mcp");
  assert.equal(report.fields.slug, "contrastapi");
}

{
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
  assert.equal(report.ok, false);
  assert.equal(report.category, "skills");
  assert.ok(report.errors.includes("Missing required field: skill_type"));
}

{
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
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.includes(
      "Community submissions cannot request local /downloads hosting",
    ),
  );
}

{
  const fields = parseIssueFormBody(`## Submission

**Name:** Macuse
**Website:** https://macuse.app
**GitHub:** https://github.com/macuseapp/macuse
**Category:** macOS Automation / MCP Server

### Description
Native macOS MCP server.`);
  assert.equal(fields.name, "Macuse");
  assert.equal(fields.category, "mcp");
  assert.equal(fields.github_url, "https://github.com/macuseapp/macuse");
  assert.equal(fields.docs_url, "https://macuse.app");
}

console.log("Submission intake tests passed.");
