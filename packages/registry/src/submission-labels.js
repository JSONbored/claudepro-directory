export const SUBMISSION_BASE_LABELS = ["content-submission", "needs-review"];
export const SUBMISSION_NEEDS_AUTHOR_INPUT_LABEL = "needs-author-input";
export const SUBMISSION_SOURCE_NEEDS_VERIFICATION_LABEL =
  "source-needs-verification";
export const SUBMISSION_STALE_LABEL = "stale-submission";
export const SUBMISSION_PROTECTED_REVIEW_LABELS = [
  "accepted",
  "import-approved",
  "import-pr-open",
];

export const SUBMISSION_STALE_LABEL_DEFINITIONS = {
  [SUBMISSION_NEEDS_AUTHOR_INPUT_LABEL]: {
    color: "b60205",
    description:
      "Submission needs changes from the author before review can continue",
  },
  [SUBMISSION_SOURCE_NEEDS_VERIFICATION_LABEL]: {
    color: "d93f0b",
    description:
      "Submission source, package, or canonical URL needs maintainer verification",
  },
  [SUBMISSION_STALE_LABEL]: {
    color: "cfd3d7",
    description:
      "Submission has been waiting on author input past the reminder window",
  },
};

export const COMMUNITY_CATEGORY_LABELS = {
  agents: "community-agents",
  collections: "community-collections",
  commands: "community-commands",
  guides: "guide",
  hooks: "community-hooks",
  mcp: "community-mcp",
  rules: "community-rules",
  skills: "skills",
  statuslines: "community-statuslines",
};

export function submissionLabelsForCategory(category) {
  return [
    "content-submission",
    COMMUNITY_CATEGORY_LABELS[category] || category,
  ].filter(Boolean);
}

export function recommendedLabelsForCategory(category) {
  return [
    ...SUBMISSION_BASE_LABELS,
    COMMUNITY_CATEGORY_LABELS[category] || category,
  ].filter(Boolean);
}
