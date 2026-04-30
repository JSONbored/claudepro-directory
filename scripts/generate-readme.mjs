import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import prettier from "prettier";
import categorySpec from "@heyclaude/registry/category-spec";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const readmePath = path.join(repoRoot, "README.md");
const checkMode = process.argv.includes("--check");

const categoryOrder = categorySpec.categoryOrder;

const categoryHeadings = {
  agents: "## 🤖 AI Agents",
  collections: "## 📦 Collections",
  commands: "## ⌨️ Commands",
  guides: "## 📚 Guides",
  hooks: "## 🪝 Hooks",
  mcp: "## 🔌 MCP Servers",
  rules: "## 📏 Rules",
  skills: "## 🧠 Skills",
  statuslines: "## 📟 Statuslines",
  tools: "## 🧰 Tools",
};

function readEntries(category) {
  const categoryDir = path.join(contentRoot, category);
  return fs
    .readdirSync(categoryDir)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .sort()
    .map((fileName) => {
      const source = fs.readFileSync(path.join(categoryDir, fileName), "utf8");
      const { data } = matter(source);
      return {
        title: String(data.title ?? fileName.replace(/\.mdx$/, "")),
        slug: String(data.slug ?? fileName.replace(/\.mdx$/, "")),
        description: String(data.description ?? ""),
      };
    });
}

function escapeTableCell(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function headingAnchor(category) {
  return (categoryHeadings[category] ?? category)
    .replace(/^#+\s*/, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function readmeEntryLine(category, entry) {
  return `- **[${entry.title}](https://heyclau.de/${category}/${entry.slug})** - ${entry.description}`;
}

const entriesByCategory = Object.fromEntries(
  categoryOrder.map((category) => [category, readEntries(category)]),
);

const categoryRows = categoryOrder
  .map((category) => {
    const entries = entriesByCategory[category] ?? [];
    const spec = categorySpec.categories[category];
    return `| [${escapeTableCell(spec?.label ?? category)}](#${headingAnchor(category)}) | ${entries.length} | ${escapeTableCell(spec?.description ?? "")} |`;
  })
  .join("\n");

const sections = categoryOrder
  .map((category) => {
    const entries = entriesByCategory[category] ?? [];
    if (!entries.length) return "";

    const lines = [
      `${categoryHeadings[category] ?? `## ${category}`} (${entries.length})`,
      "",
      ...entries.map((entry) => readmeEntryLine(category, entry)),
    ];

    return lines.join("\n");
  })
  .filter(Boolean)
  .join("\n\n");

const total = categoryOrder.reduce(
  (sum, category) => sum + (entriesByCategory[category] ?? []).length,
  0,
);

const readme = `<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/heyclaude-wordmark-dark.svg">
  <img src="apps/web/public/heyclaude-wordmark.svg" alt="HeyClaude" width="300">
</picture>

**Discover and share the best Claude configurations**
${total}+ file-backed entries covering agents, MCP servers, tools, skills, hooks, rules, commands, guides, collections, and statuslines.

[Website](https://heyclau.de) • [Browse](https://heyclau.de/browse) • [Jobs](https://heyclau.de/jobs) • [Submit](https://heyclau.de/submit) • [API](https://heyclau.de/api-docs) • [MCP](packages/mcp) • [Discussions](https://github.com/JSONbored/claudepro-directory/discussions)

[Feeds](https://heyclau.de/api/registry/feed) • [RSS](https://heyclau.de/feed.xml) • [Atom](https://heyclau.de/atom.xml) • [LLM export](https://heyclau.de/llms-full.txt) • [Raycast](integrations/raycast) • [MCP endpoint](https://heyclau.de/api/mcp) • [Claim/update](https://heyclau.de/claim)

</div>

---

## What is HeyClaude?

HeyClaude is a fast, GitHub-native directory for Claude assets.

- No paid database required for the public site
- Content lives in-repo as files
- Community submissions can flow through GitHub
- Jobs are reviewed and published by maintainers
- The site doubles as an awesome-list and a browsable directory

## At a Glance

| Section | Entries | Scope |
| --- | ---: | --- |
${categoryRows}

## Distribution Surfaces

- Website: [heyclau.de](https://heyclau.de)
- Search and browse API: [API docs](https://heyclau.de/api-docs)
- Machine-readable registry feed: [\`/api/registry/feed\`](https://heyclau.de/api/registry/feed)
- Platform compatibility pages: [\`/platforms\`](https://heyclau.de/platforms)
- Read-only MCP server: [\`packages/mcp\`](packages/mcp)
- Remote MCP endpoint: [\`/api/mcp\`](https://heyclau.de/api/mcp)
- Jobs board: [\`/jobs\`](https://heyclau.de/jobs)
- Post a role: [\`/jobs/post\`](https://heyclau.de/jobs/post)
- Full LLM export: [\`/llms-full.txt\`](https://heyclau.de/llms-full.txt)
- RSS updates: [\`/feed.xml\`](https://heyclau.de/feed.xml)
- Atom updates: [\`/atom.xml\`](https://heyclau.de/atom.xml)
- Package validator: [Agent Skill package validator](https://heyclau.de/tools/skill-validator)

## Quick Start

### For contributors

Option A (recommended): open [Submit](https://heyclau.de/submit) and use the category issue form.

Option B (direct): open a category issue form in GitHub under \`.github/ISSUE_TEMPLATE\`.

Option C (advanced): open a pull request with content files directly.

Free Claude resources use issue-first intake by default. Maintainers review,
validate, and approve accepted submissions before automation opens an import PR.
Tool/app/service
promotion, listing claims, and jobs use the website lead forms instead of GitHub
content issues.

### Claim or update an entry

- Use [Claim/update listing](https://heyclau.de/claim) for ownership or commercial listing updates.
- Use detail-page "Edit on GitHub" links for direct source edits.
- Use detail-page "Suggest change" links for issue-first corrections.

1. Add or update a file under \`content/<category>/\`
2. Run \`pnpm --filter web run prebuild\`
3. Run \`pnpm validate:content:strict\`, \`pnpm validate:issue-templates\`, \`pnpm validate:clean\`, \`pnpm audit:content\`, \`pnpm validate:emails\`, \`pnpm test:mcp\`, \`pnpm test:registry-artifacts\`, \`pnpm test:seo-jsonld\`, and \`pnpm test:commercial-intake\`
4. Run \`pnpm generate:issue-templates\` and \`pnpm generate:readme\` if registry categories or content counts changed
5. Commit the README and generated registry artifacts alongside your content changes

### Schema references

- Examples: [examples/content/README.md](examples/content/README.md)
- Registry schema: [content/SCHEMA.md](content/SCHEMA.md)
- Registry package: [packages/registry](packages/registry)
- Read-only MCP server: [packages/mcp](packages/mcp)
- Issue forms: [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE)
- Package trust model: [docs/package-security-policy.md](docs/package-security-policy.md)

---

## Project Docs

- Security policy: [SECURITY.md](SECURITY.md)
- Deployment guide: [apps/web/DEPLOYMENT.md](apps/web/DEPLOYMENT.md)
- IndexNow: [docs/indexnow.md](docs/indexnow.md)
- Registry MCP: [docs/registry-mcp-plan.md](docs/registry-mcp-plan.md)
- API security contract: [docs/api-security-contract.md](docs/api-security-contract.md)
- License: [LICENSE](LICENSE)

---

## Content Catalog

${sections}

---

<div align="center">

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=JSONbored/claudepro-directory&type=Date)](https://www.star-history.com/#JSONbored/claudepro-directory&Date)

## 📊 Activity

![RepoBeats Analytics](https://repobeats.axiom.co/api/embed/c2b1b7e36103fba7a650c6d7f2777cba7338a1f7.svg "Repobeats analytics image")

## 👥 Contributors

Thanks to everyone who has contributed to making HeyClaude better.

<a href="https://github.com/JSONbored/claudepro-directory/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=JSONbored/claudepro-directory" alt="HeyClaude contributors" />
</a>

---

[Website](https://heyclau.de) • [GitHub](https://github.com/JSONbored/claudepro-directory) • [Discord](https://discord.gg/Ax3Py4YDrq) • [Twitter](https://x.com/jsonbored) • [License](LICENSE)

</div>
`;

const formattedReadme = await prettier.format(readme, { parser: "markdown" });

function validateReadmeCatalog(readmeContent) {
  const errors = [];

  if (!readmeContent.includes(`${total}+ file-backed entries`)) {
    errors.push(`README total count does not match ${total}.`);
  }

  for (const category of categoryOrder) {
    const entries = entriesByCategory[category] ?? [];
    const spec = categorySpec.categories[category];
    const label = spec?.label ?? category;
    const countRowPattern = new RegExp(
      `\\| \\[${escapeRegExp(label)}\\]\\(#${escapeRegExp(
        headingAnchor(category),
      )}\\)\\s*\\|\\s*${entries.length}\\s*\\|`,
    );

    if (!countRowPattern.test(readmeContent)) {
      errors.push(
        `README At a Glance row for ${category} does not show ${entries.length}.`,
      );
    }

    const heading = `${categoryHeadings[category] ?? `## ${category}`} (${
      entries.length
    })`;
    if (!readmeContent.includes(heading)) {
      errors.push(
        `README section heading is missing or stale for ${category}.`,
      );
    }

    for (const entry of entries) {
      const url = `https://heyclau.de/${category}/${entry.slug}`;
      if (!readmeContent.includes(url)) {
        errors.push(`README catalog is missing ${category}/${entry.slug}.`);
      }
      if (entry.description && !readmeContent.includes(entry.description)) {
        errors.push(
          `README catalog is missing the frontmatter description for ${category}/${entry.slug}.`,
        );
      }
    }
  }

  if (errors.length) {
    throw new Error(`README catalog validation failed:\n${errors.join("\n")}`);
  }
}

validateReadmeCatalog(formattedReadme);

if (checkMode) {
  const current = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, "utf8")
    : "";
  if (current !== formattedReadme) {
    console.error("README.md is out of date. Run pnpm generate:readme.");
    process.exit(1);
  }
  validateReadmeCatalog(current);
  console.log("README.md is up to date.");
} else {
  fs.writeFileSync(readmePath, formattedReadme);
  console.log(`Updated ${path.relative(repoRoot, readmePath)}`);
}
