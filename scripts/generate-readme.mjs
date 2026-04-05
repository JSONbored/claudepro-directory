import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const CONTENT_ROOT = join(REPO_ROOT, "content");
const README_PATH = join(REPO_ROOT, "README.md");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://heyclau.de";

const CATEGORY_META = {
  agents: {
    emoji: "🤖",
    title: "AI Agents",
    description:
      "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities."
  },
  collections: {
    emoji: "📦",
    title: "Collections",
    description:
      "Curated bundles of related prompts, configs, and workflows packaged around a specific outcome."
  },
  commands: {
    emoji: "⌨️",
    title: "Commands",
    description:
      "Slash commands and reusable command prompts for Claude Code and related workflows."
  },
  guides: {
    emoji: "📚",
    title: "Guides",
    description:
      "Long-form tutorials and implementation guides for real-world Claude and MCP usage."
  },
  hooks: {
    emoji: "🪝",
    title: "Hooks",
    description:
      "Automation hooks, workflow triggers, and session helpers for Claude Code."
  },
  mcp: {
    emoji: "⚙️",
    title: "MCP Servers",
    description:
      "Model Context Protocol servers that extend Claude with external tools, APIs, and data."
  },
  rules: {
    emoji: "📏",
    title: "Rules",
    description:
      "Reusable rules, guardrails, and standards that shape how Claude behaves."
  },
  skills: {
    emoji: "🧠",
    title: "Skills",
    description:
      "Packaged skills and implementation accelerators for specific stacks, workflows, and tools."
  },
  statuslines: {
    emoji: "📟",
    title: "Statuslines",
    description:
      "Statusline scripts and telemetry surfaces for Claude Code sessions."
  }
};

function parseScalar(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: source };
  }

  const [, frontmatter, body] = match;
  const lines = frontmatter.split("\n");
  const data = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const entryMatch = line.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (!entryMatch) {
      continue;
    }

    const [, key, rest = ""] = entryMatch;
    if (!rest.trim()) {
      const values = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        values.push(parseScalar(lines[index + 1].replace("  - ", "")));
        index += 1;
      }
      data[key] = values;
      continue;
    }

    data[key] = parseScalar(rest);
  }

  return { data, body };
}

async function walkDirectory(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(root, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "data") {
          return [];
        }
        return walkDirectory(absolutePath);
      }
      return absolutePath.endsWith(".mdx") ? [absolutePath] : [];
    })
  );

  return nested.flat();
}

async function readEntries() {
  const files = await walkDirectory(CONTENT_ROOT);
  const entries = await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const { data } = parseFrontmatter(source);
      return {
        category: data.category,
        slug: data.slug,
        title: data.title,
        description: data.description,
        filePath: relative(REPO_ROOT, filePath)
      };
    })
  );

  return entries
    .filter((entry) => entry.category && entry.slug && entry.title)
    .sort((left, right) => {
      if (left.category !== right.category) {
        return left.category.localeCompare(right.category);
      }
      return left.title.localeCompare(right.title);
    });
}

function buildReadme(entries) {
  const totalCount = entries.length;
  const sections = Object.entries(CATEGORY_META)
    .map(([category, meta]) => {
      const categoryEntries = entries.filter((entry) => entry.category === category);
      if (!categoryEntries.length) {
        return "";
      }

      const lines = categoryEntries.map((entry) => {
        const url = `${SITE_URL}/${entry.category}/${entry.slug}`;
        return `- **[${entry.title}](${url})** - ${entry.description}`;
      });

      return `## ${meta.emoji} ${meta.title} (${categoryEntries.length})

${meta.description}

${lines.join("\n")}
`;
    })
    .filter(Boolean)
    .join("\n");

  return `# HeyClaude

**Discover and share the best Claude configurations**
${totalCount}+ file-backed entries covering agents, MCP servers, skills, hooks, rules, commands, guides, collections, and statuslines.

[🌐 Website](${SITE_URL}) • [💼 Repository](https://github.com/JSONbored/claudepro-directory) • [💬 Discussions](https://github.com/JSONbored/claudepro-directory/discussions)

---

## What is HeyClaude?

HeyClaude is a fast, GitHub-native directory for Claude assets.

- No paid database required for the public site
- Content lives in-repo as files
- Community submissions can flow through GitHub
- The site doubles as an awesome-list and a browsable directory

## Quick Start

### For users

1. Visit [heyclau.de](${SITE_URL})
2. Browse a category or open an entry directly
3. Copy the relevant config, prompt, or setup
4. Apply it in Claude, Claude Code, or your MCP workflow

### For contributors

1. Open an issue or pull request in this repo
2. Add or update the relevant content file under \`content/<category>/\`
3. Run \`npm run generate:readme\` or \`pnpm generate:readme\`
4. Submit the updated README along with your content change

---

## Content Catalog

${sections}
`;
}

const entries = await readEntries();
const readme = buildReadme(entries);
await writeFile(README_PATH, readme, "utf8");
console.log(`README generated with ${entries.length} entries.`);
