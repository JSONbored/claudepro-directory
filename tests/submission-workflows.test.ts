import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { planStaleSubmissionAction } from "../scripts/manage-stale-submissions.mjs";
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
    expect(source).toContain("issue_author=");
    expect(source).toContain("issue_author_id=");
    expect(source).toContain("Co-authored-by:");
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

    expect(source).toContain("validate-pr-preview:");
    expect(source).toContain("github.event_name == 'pull_request'");
    expect(source).toContain("Deploy same-repo PR preview to dev Worker");
    expect(source).toContain("Resolve PR preview URL");
    expect(source).toContain("pnpm validate:deployment-artifacts");
    expect(source).not.toContain("vars.DEPLOYMENT_ARTIFACT_BASE_URL");
    expect(source).toContain("Dry-run Resend template sync");
    expect(source).toContain("pnpm resend:sync-templates -- --dry-run");
  });

  it("keeps stale submission automation review-only and label-scoped", () => {
    const source = fs.readFileSync(
      path.join(repoRoot, ".github/workflows/submission-stale.yml"),
      "utf8",
    );

    expect(source).toContain("Submission Stale Manager");
    expect(source).toContain("issues: write");
    expect(source).toContain("workflow_dispatch:");
    expect(source).not.toContain("inputs:");
    expect(source).not.toContain("inputs.");
    expect(source).toContain("pnpm submission:stale");
    expect(source).toContain("--apply");
    expect(source).not.toContain("import-approved");
    expect(source).not.toContain("scripts/import-submission-issue.mjs");
    expect(source).not.toContain("peter-evans/create-pull-request");
  });

  it("keeps stale reminders separate from close eligibility", () => {
    const baseEntry = {
      number: 296,
      status: "stale_reminder_due",
      labels: ["content-submission", "needs-author-input"],
      recommendedLabels: [
        "content-submission",
        "needs-review",
        "needs-author-input",
        "stale-submission",
      ],
    };

    expect(planStaleSubmissionAction(baseEntry)).toMatchObject({
      issue: 296,
      labels: ["stale-submission"],
      remind: true,
      close: false,
    });
    expect(
      planStaleSubmissionAction({
        ...baseEntry,
        labels: [...baseEntry.labels, "stale-submission"],
      }),
    ).toMatchObject({
      labels: [],
      remind: false,
      close: false,
    });
    expect(
      planStaleSubmissionAction({
        ...baseEntry,
        status: "close_eligible",
        labels: [...baseEntry.labels, "stale-submission"],
      }),
    ).toMatchObject({
      labels: [],
      remind: false,
      close: true,
    });
    expect(
      planStaleSubmissionAction({
        ...baseEntry,
        status: "close_eligible",
      }),
    ).toMatchObject({
      labels: ["stale-submission"],
      remind: true,
      close: false,
    });
  });

  it("prevents Renovate from pinning package engine ranges", () => {
    const renovate = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "renovate.json"), "utf8"),
    );
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "packages/mcp/package.json"), "utf8"),
    );

    expect(packageJson.engines.node).toBe(">=20");
    expect(renovate.packageRules).toContainEqual(
      expect.objectContaining({
        matchManagers: ["npm"],
        matchDepTypes: ["engines"],
        enabled: false,
      }),
    );
    expect(renovate.packageRules).toContainEqual(
      expect.objectContaining({
        matchManagers: ["github-actions"],
        matchDepNames: ["node"],
        allowedVersions: "24.x",
      }),
    );
  });
});
