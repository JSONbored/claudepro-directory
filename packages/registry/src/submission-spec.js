import categorySpec from "./category-spec.json" with { type: "json" };
import { submissionLabelsForCategory } from "./submission-labels.js";

export const SUBMISSION_SPEC_SCHEMA_VERSION = 2;

const BASE_FIELDS = [
  {
    id: "name",
    label: "Name",
    type: "text",
    required: true,
    placeholder: "Human-readable listing name",
  },
  {
    id: "slug",
    label: "Slug",
    type: "text",
    required: true,
    placeholder: "kebab-case-slug",
    helpText: "Kebab-case only. Maintainers may adjust before merge.",
  },
  {
    id: "category",
    label: "Category",
    type: "category",
    required: true,
  },
  {
    id: "github_url",
    label: "GitHub URL",
    type: "url",
    required: false,
    placeholder: "https://github.com/owner/repo",
  },
  {
    id: "docs_url",
    label: "Docs URL",
    type: "url",
    required: false,
    placeholder: "https://...",
  },
  {
    id: "author",
    label: "Author",
    type: "text",
    required: false,
    placeholder: "GitHub handle, company, or maintainer name",
  },
  {
    id: "contact_email",
    label: "Public contact",
    type: "text",
    required: false,
    placeholder: "@github-handle or email if you want it public",
    helpText:
      "Optional. This is copied into a public GitHub issue, so do not include private contact details.",
  },
  {
    id: "tags",
    label: "Tags",
    type: "text",
    required: false,
    placeholder: "claude, mcp, automation",
    helpText: "Comma-separated.",
  },
  {
    id: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Explain what this does, why it matters, and when to use it.",
  },
  {
    id: "card_description",
    label: "Card description",
    type: "textarea",
    required: true,
    placeholder: "Short browse-card preview text.",
  },
];

const FIELD_LIBRARY = {
  full_copyable_content: {
    id: "full_copyable_content",
    label: "Full copyable content",
    type: "textarea",
    required: true,
    render: "markdown",
    placeholder: "Paste the complete usable prompt, config, script, or rule.",
  },
  install_command: {
    id: "install_command",
    label: "Install command",
    type: "text",
    required: true,
    placeholder: "npx -y @org/package",
  },
  usage_snippet: {
    id: "usage_snippet",
    label: "Usage snippet",
    type: "textarea",
    required: true,
    render: "markdown",
    placeholder: "Show how someone actually uses this.",
  },
  command_syntax: {
    id: "command_syntax",
    label: "Command syntax",
    type: "text",
    required: true,
    placeholder: "/command [path] [options]",
  },
  trigger: {
    id: "trigger",
    label: "Trigger",
    type: "select",
    required: true,
    options: [
      "PreToolUse",
      "PostToolUse",
      "UserPromptSubmit",
      "Notification",
      "Stop",
      "SubagentStop",
      "SessionStart",
    ],
  },
  guide_content: {
    id: "guide_content",
    label: "Guide content",
    type: "textarea",
    required: true,
    render: "markdown",
    placeholder: "Paste the full guide content.",
  },
  items: {
    id: "items",
    label: "Items",
    type: "textarea",
    required: true,
    placeholder: "category/slug list, one per line.",
  },
  script_language: {
    id: "script_language",
    label: "Script language",
    type: "select",
    required: true,
    options: ["bash", "zsh", "fish", "python", "javascript", "other"],
  },
  skill_type: {
    id: "skill_type",
    label: "Skill type",
    type: "select",
    required: true,
    options: categorySpec.skillTypeValues,
  },
  skill_level: {
    id: "skill_level",
    label: "Skill level",
    type: "select",
    required: true,
    options: categorySpec.skillLevelValues,
  },
  verification_status: {
    id: "verification_status",
    label: "Verification status",
    type: "select",
    required: true,
    options: categorySpec.verificationStatusValues,
  },
};

const OPTIONAL_FIELDS = [
  {
    id: "download_url",
    label: "Download URL",
    type: "url",
    required: false,
    placeholder: "https://...",
    helpText: "Community submissions cannot request local /downloads hosting.",
  },
  {
    id: "config_snippet",
    label: "Config snippet",
    type: "textarea",
    required: false,
    render: "markdown",
  },
  {
    id: "retrieval_sources",
    label: "Retrieval sources",
    type: "textarea",
    required: false,
    placeholder: "Official docs or source URLs used for verification.",
  },
  {
    id: "tested_platforms",
    label: "Tested platforms",
    type: "text",
    required: false,
    placeholder: categorySpec.defaultTestedPlatforms?.join(", "),
  },
];

function fieldFor(id, required = false) {
  const field = FIELD_LIBRARY[id] ??
    OPTIONAL_FIELDS.find((candidate) => candidate.id === id) ?? {
      id,
      label: id.replaceAll("_", " "),
      type: "text",
    };

  return {
    ...field,
    required: field.required || required,
  };
}

export function buildSubmissionFieldModel(category) {
  const spec = categorySpec.categories[category];
  if (!spec) return null;
  const required = new Set([
    ...categorySpec.commonIssueRequiredFields,
    ...(spec.submissionRequired ?? []),
  ]);
  const fieldIds = [
    ...BASE_FIELDS.map((field) => field.id),
    ...(spec.submissionRequired ?? []),
  ];

  if (category === "skills") {
    fieldIds.push("download_url", "retrieval_sources", "tested_platforms");
  }
  if (
    category === "mcp" ||
    category === "hooks" ||
    category === "statuslines"
  ) {
    fieldIds.push("config_snippet");
  }

  const fields = fieldIds
    .filter((id, index, list) => list.indexOf(id) === index)
    .map((id) => {
      const baseField = BASE_FIELDS.find((field) => field.id === id);
      return baseField
        ? { ...baseField, required: required.has(id) }
        : fieldFor(id, required.has(id));
    });

  return {
    schemaVersion: SUBMISSION_SPEC_SCHEMA_VERSION,
    category,
    label: spec.label,
    description: spec.description,
    template: spec.template,
    fields,
  };
}

export function buildIssueTemplateSpec(category) {
  const model = buildSubmissionFieldModel(category);
  if (!model) return null;

  return {
    schemaVersion: SUBMISSION_SPEC_SCHEMA_VERSION,
    category,
    template: model.template,
    labels: submissionLabelsForCategory(category),
    title: `Submit ${model.label.replace(/s$/, "")}: `,
    fields: model.fields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: Boolean(field.required),
      options: field.options,
      render: field.render,
    })),
  };
}

export function buildSubmissionSpecs() {
  const categories = Object.fromEntries(
    categorySpec.submissionOrder.map((category) => [
      category,
      buildSubmissionFieldModel(category),
    ]),
  );
  const issueTemplates = Object.fromEntries(
    categorySpec.submissionOrder.map((category) => [
      category,
      buildIssueTemplateSpec(category),
    ]),
  );

  return {
    schemaVersion: SUBMISSION_SPEC_SCHEMA_VERSION,
    categories,
    issueTemplates,
  };
}
