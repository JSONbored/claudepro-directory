import { Action, ActionPanel, Icon, List } from "@raycast/api";
import {
  SUBMIT_URL,
  buildContributeEntryUrl,
  buildSubmitIssueUrl,
  categoryLabels,
} from "./feed";
import { buildPostJobUrl } from "./jobs-feed";

const actions = [
  {
    title: "Submit New Entry",
    subtitle: "Open the reviewed HeyClaude submission form",
    url: SUBMIT_URL,
    icon: Icon.Plus,
  },
  {
    title: "Claim or Update a Listing",
    subtitle: "Request listing ownership, corrections, or source updates",
    url: "https://heyclau.de/claim",
    icon: Icon.Pencil,
  },
  {
    title: "Post a Job",
    subtitle: "Submit a role for review before publication",
    url: buildPostJobUrl(),
    icon: Icon.Document,
  },
  {
    title: "Browse Open Submissions",
    subtitle: "Review community submission issues already in progress",
    url: "https://heyclau.de/submissions",
    icon: Icon.MagnifyingGlass,
  },
  {
    title: "Open GitHub Issues",
    subtitle: "Use GitHub templates directly for reviewed contributions",
    url: "https://github.com/JSONbored/claudepro-directory/issues/new/choose",
    icon: Icon.Globe,
  },
];

const categoryActions = Object.entries(categoryLabels).map(
  ([category, label]) => ({
    title: `Submit ${label}`,
    subtitle: `Open the ${label.toLowerCase()} submission path`,
    category,
    url: buildContributeEntryUrl({ category }),
    issueUrl: buildSubmitIssueUrl(category),
  }),
);

export default function Command() {
  return (
    <List searchBarPlaceholder="Search contribution paths...">
      <List.Section title="Contribute">
        {actions.map((item) => (
          <List.Item
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  title="Open in Browser"
                  url={item.url}
                  icon={Icon.Globe}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      <List.Section title="Submit by Category">
        {categoryActions.map((item) => (
          <List.Item
            key={item.category}
            title={item.title}
            subtitle={item.subtitle}
            icon={Icon.Plus}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  title="Open HeyClaude Submit Form"
                  url={item.url}
                  icon={Icon.Plus}
                />
                <Action.OpenInBrowser
                  title="Open GitHub Issue Template"
                  url={item.issueUrl}
                  icon={Icon.Globe}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
