import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const readmePath = path.join(repoRoot, "README.md");

const categoryOrder = [
  "agents",
  "collections",
  "commands",
  "guides",
  "hooks",
  "mcp",
  "rules",
  "skills",
  "statuslines"
];

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

const readme = `# HeyClaude

**Discover and share the best Claude configurations**
${total}+ file-backed entries covering agents, MCP servers, skills, hooks, rules, commands, guides, collections, and statuslines.

[🌐 Website](https://heyclau.de) • [💼 Repository](https://github.com/JSONbored/claudepro-directory) • [💬 Discussions](https://github.com/JSONbored/claudepro-directory/discussions)

---

## What is HeyClaude?

HeyClaude is a fast, GitHub-native directory for Claude assets.

- No paid database required for the public site
- Content lives in-repo as files
- Community submissions can flow through GitHub
- The site doubles as an awesome-list and a browsable directory

## Quick Start

### For contributors

1. Add or update a file under \`content/<category>/\`
2. Run \`pnpm generate:readme\`
3. Commit the README alongside your content changes

---

## Content Catalog

${sections}
`;

fs.writeFileSync(readmePath, readme);
console.log(`Updated ${path.relative(repoRoot, readmePath)}`);
