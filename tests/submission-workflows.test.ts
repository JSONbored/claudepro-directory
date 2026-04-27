import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { repoRoot } from "./helpers/registry-fixtures";

describe("submission automation workflows", () => {
  it("keeps issue validation as preview-only until maintainer approval", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, ".github/workflows/submission-issue-validation.yml"),
      "utf8",
    );

    expect(source).toContain("Preview import output");
    expect(source).toContain("--dry-run");
    expect(source).not.toContain("peter-evans/create-pull-request");
    expect(source).not.toContain("labels.*.name, 'submission'");
  });

  it("opens import PRs only after accepted/import-approved labels", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, ".github/workflows/submission-import-pr.yml"),
      "utf8",
    );

    expect(source).toContain("types:");
    expect(source).toContain("- labeled");
    expect(source).toContain("'accepted'");
    expect(source).toContain("'import-approved'");
    expect(source).toContain(
      "contains(github.event.issue.labels.*.name, 'content-submission')",
    );
    expect(source).toContain("scripts/import-submission-issue.mjs");
    expect(source).toContain("pnpm --filter web run prebuild");
    expect(source).toContain("pnpm generate:readme");
    expect(source).toContain("pnpm validate:content:strict");
    expect(source).toContain("peter-evans/create-pull-request@");
    expect(source).toContain("branch=automation/submission-");
    expect(source).toContain("pr_title=feat(content): add");
    expect(source).toContain("content/**");
    expect(source).toContain("apps/web/public/data/**");
    expect(source).toContain("README.md");
    expect(source).toContain(
      "Closes #${{ steps.metadata.outputs.issue_number }} after merge.",
    );
  });

  it("requires preview artifact validation before pull requests can merge", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, ".github/workflows/content-validation.yml"),
      "utf8",
    );

    expect(source).toContain("Require preview artifact base URL");
    expect(source).toContain("github.event_name == 'pull_request'");
    expect(source).toContain("DEPLOYMENT_ARTIFACT_BASE_URL must point");
    expect(source).toContain("pnpm validate:deployment-artifacts");
  });
});
