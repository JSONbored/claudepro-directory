import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import categorySpec from "@heyclaude/registry/category-spec";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const readmePath = path.join(repoRoot, "README.md");

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
  statuslines: "## 📟 Statuslines"
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
        description: String(data.description ?? "")
      };
    });
}

const sections = categoryOrder
  .map((category) => {
    const entries = readEntries(category);
    if (!entries.length) return "";

    const lines = [
      `${categoryHeadings[category]} (${entries.length})`,
      "",
      ...entries.map(
        (entry) =>
          `- **[${entry.title}](https://heyclau.de/${category}/${entry.slug})** - ${entry.description}`
      )
    ];

    return lines.join("\n");
  })
  .filter(Boolean)
  .join("\n\n");

const total = categoryOrder.reduce(
  (sum, category) => sum + readEntries(category).length,
  0
);

const readme = `![HeyClaude](apps/web/public/heyclaude-wordmark.svg)

<div align="center">

# HeyClaude

**Discover and share the best Claude configurations**
${total}+ file-backed entries covering agents, MCP servers, skills, hooks, rules, commands, guides, collections, and statuslines.
Formerly Claude Pro Directory.

[🌐 Website](https://heyclau.de) • [💼 Repository](https://github.com/JSONbored/claudepro-directory) • [💬 Discussions](https://github.com/JSONbored/claudepro-directory/discussions) • [💬 Discord](https://discord.gg/Ax3Py4YDrq) • [🐦 Twitter](https://x.com/jsonbored)

</div>

---

## What is HeyClaude?

HeyClaude is a fast, GitHub-native directory for Claude assets.

- No paid database required for the public site
- Content lives in-repo as files
- Community submissions can flow through GitHub
- Jobs are reviewed and published by maintainers
- The site doubles as an awesome-list and a browsable directory

## Quick Start

### For contributors

Option A (easiest): open [Submit](https://heyclau.de/submit) and use the category issue form.

Option B (direct): open a category issue form in GitHub under \`.github/ISSUE_TEMPLATE\`.

Option C (advanced): commit content files directly.

1. Add or update a file under \`content/<category>/\`
2. Run \`pnpm --filter web run prebuild\`
3. Run \`pnpm validate:content:strict\`, \`pnpm audit:content\`, and \`pnpm test:registry-artifacts\`
4. Run \`pnpm generate:readme\`
5. Commit the README and generated registry artifacts alongside your content changes

### Schema references

- Examples: [examples/content/README.md](examples/content/README.md)
- Registry schema: [content/SCHEMA.md](content/SCHEMA.md)
- Registry package: [packages/registry](packages/registry)
- Issue forms: [.github/ISSUE_TEMPLATE](.github/ISSUE_TEMPLATE)
- Package trust model: [docs/package-security-policy.md](docs/package-security-policy.md)

---

## Project Docs

- Security policy: [SECURITY.md](SECURITY.md)
- Deployment guide: [apps/web/DEPLOYMENT.md](apps/web/DEPLOYMENT.md)
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
  <img src="https://contrib.rocks/image?repo=JSONbored/claudepro-directory" />
</a>

---

[Website](https://heyclau.de) • [GitHub](https://github.com/JSONbored/claudepro-directory) • [Discord](https://discord.gg/Ax3Py4YDrq) • [Twitter](https://x.com/jsonbored) • [License](LICENSE)

</div>
`;

fs.writeFileSync(readmePath, readme);
console.log(`Updated ${path.relative(repoRoot, readmePath)}`);
