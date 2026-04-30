type SubmitPreviewCardProps = {
  title: string;
  slug: string;
  category: string;
  author: string;
  description: string;
  cardDescription: string;
  tags: string;
  githubUrl: string;
  docsUrl: string;
  brandName: string;
  brandDomain: string;
  installCommand: string;
  assetContent: string;
  readinessScore: number;
  sourceWarning: boolean;
};

function frontmatterValue(value: string) {
  const normalized = value.trim();
  return normalized ? JSON.stringify(normalized) : '""';
}

function buildMdxPreview(props: SubmitPreviewCardProps) {
  const tags = props.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const lines = [
    "---",
    `title: ${frontmatterValue(props.title)}`,
    `slug: ${frontmatterValue(props.slug)}`,
    `description: ${frontmatterValue(props.description)}`,
    `cardDescription: ${frontmatterValue(props.cardDescription)}`,
    `author: ${frontmatterValue(props.author)}`,
    `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
  ];

  if (props.githubUrl.trim())
    lines.push(`repoUrl: ${frontmatterValue(props.githubUrl)}`);
  if (props.docsUrl.trim())
    lines.push(`documentationUrl: ${frontmatterValue(props.docsUrl)}`);
  if (props.brandName.trim())
    lines.push(`brandName: ${frontmatterValue(props.brandName)}`);
  if (props.brandDomain.trim()) {
    lines.push(`brandDomain: ${frontmatterValue(props.brandDomain)}`);
    lines.push(`brandAssetSource: "brandfetch"`);
  }
  if (props.installCommand.trim()) {
    lines.push(`installCommand: ${frontmatterValue(props.installCommand)}`);
  }

  lines.push("---", "");
  lines.push(
    props.assetContent.trim() ||
      props.description.trim() ||
      "Add review-ready usage notes here.",
  );
  return lines.join("\n");
}

export function SubmitPreviewCard(props: SubmitPreviewCardProps) {
  const mdxPreview = buildMdxPreview(props);

  return (
    <section className="rounded-xl border border-border bg-card/80 px-4 py-3 text-xs leading-6 text-muted-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">Dry-run preview</span>
        <span className="rounded-full border border-border bg-background px-2 py-0.5">
          Quality preview: {props.readinessScore}/100
        </span>
      </div>
      <p className="mt-2">
        This preview is not submitted directly; it shows the maintainer-review
        shape that the issue prefill is trying to produce.
      </p>
      {props.sourceWarning ? (
        <p className="mt-2 text-destructive">
          Add a GitHub or docs URL when possible. Source-free submissions can
          still be reviewed, but they require explicit provenance review.
        </p>
      ) : null}
      {props.category ? (
        <p className="mt-2 text-muted-foreground">
          Target path:{" "}
          <code className="text-foreground">
            content/{props.category}/{props.slug || "new-entry"}.mdx
          </code>
        </p>
      ) : null}
      <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-border bg-background p-3 text-[11px] leading-5 text-muted-foreground">
        <code>{mdxPreview}</code>
      </pre>
    </section>
  );
}
