export const SUBMISSION_BASE_LABELS = ["content-submission", "needs-review"];

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
