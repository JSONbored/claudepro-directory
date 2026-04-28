import { Action, ActionPanel, Form, Icon, open } from "@raycast/api";
import {
  SUBMIT_URL,
  buildContributeEntryUrl,
  buildSubmitIssueUrl,
  categoryLabels,
  type SubmissionDraft,
} from "./feed";
import { buildPostJobUrl } from "./jobs-feed";

type ContributionValues = {
  category: string;
  title: string;
  slug: string;
  sourceUrl: string;
  brandName: string;
  brandDomain: string;
  description: string;
  tags: string;
};

const categoryItems = Object.entries(categoryLabels).map(
  ([category, label]) => ({
    value: category,
    title: label,
  }),
);

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeDraft(values: ContributionValues): SubmissionDraft {
  const title = values.title.trim();
  const slug = values.slug.trim() || slugify(title);
  return {
    category: values.category,
    title,
    slug,
    sourceUrl: values.sourceUrl.trim(),
    brandName: values.brandName.trim(),
    brandDomain: values.brandDomain.trim(),
    description: values.description.trim(),
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

async function openSubmit(values: ContributionValues) {
  await open(buildContributeEntryUrl(normalizeDraft(values)));
}

async function openIssue(values: ContributionValues) {
  await open(buildSubmitIssueUrl(normalizeDraft(values)));
}

export default function Command() {
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Open HeyClaude Submit Form"
            icon={Icon.Plus}
            onSubmit={(values: ContributionValues) => void openSubmit(values)}
          />
          <Action.SubmitForm
            title="Open GitHub Issue Template"
            icon={Icon.Globe}
            onSubmit={(values: ContributionValues) => void openIssue(values)}
          />
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open Blank Submit Form"
              url={SUBMIT_URL}
              icon={Icon.Plus}
            />
            <Action.OpenInBrowser
              title="Claim or Update a Listing"
              url="https://heyclau.de/claim"
              icon={Icon.Pencil}
            />
            <Action.OpenInBrowser
              title="Post a Job"
              url={buildPostJobUrl()}
              icon={Icon.Document}
            />
            <Action.OpenInBrowser
              title="Browse Open Submissions"
              url="https://heyclau.de/submissions"
              icon={Icon.MagnifyingGlass}
            />
            <Action.OpenInBrowser
              title="Open GitHub Issue Chooser"
              url="https://github.com/JSONbored/claudepro-directory/issues/new/choose"
              icon={Icon.Globe}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.Dropdown id="category" title="Category" defaultValue="mcp">
        {categoryItems.map((item) => (
          <Form.Dropdown.Item
            key={item.value}
            value={item.value}
            title={item.title}
          />
        ))}
      </Form.Dropdown>
      <Form.TextField id="title" title="Name" placeholder="Asana MCP Server" />
      <Form.TextField
        id="slug"
        title="Slug"
        placeholder="asana-mcp-server"
        info="Optional. Leave blank to derive from the name."
      />
      <Form.TextField
        id="sourceUrl"
        title="Source or Docs URL"
        placeholder="https://..."
      />
      <Form.TextField id="brandName" title="Brand Name" placeholder="Asana" />
      <Form.TextField
        id="brandDomain"
        title="Brand Domain"
        placeholder="asana.com"
        info="Use the provider's canonical domain, not GitHub or docs hosting."
      />
      <Form.TextArea
        id="description"
        title="Short Description"
        placeholder="Explain what this does and when someone should use it."
      />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="mcp, project-management, workflow"
      />
    </Form>
  );
}
