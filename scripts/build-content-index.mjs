import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import { marked } from "marked";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const CONTENT_ROOT = join(REPO_ROOT, "content");
const OUTPUT_PATH = join(
  REPO_ROOT,
  "apps",
  "web",
  "src",
  "generated",
  "content-index.json"
);
const SKILL_DOWNLOAD_ROOT = join(
  REPO_ROOT,
  "apps",
  "web",
  "public",
  "downloads",
  "skills"
);
const GITHUB_REPO_URL = "https://github.com/JSONbored/claudepro-directory";

function parseScalar(raw) {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  return value;
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
    if (!line.trim()) {
      continue;
    }

    const entryMatch = line.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (!entryMatch) {
      continue;
    }

    const [, key, rest = ""] = entryMatch;
    if (!rest.trim()) {
      const values = [];
      while (lines[index + 1]?.startsWith("  - ")) {
        values.push(String(parseScalar(lines[index + 1].replace("  - ", "").trim())));
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
  const files = await Promise.all(
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

  return files.flat();
}

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeBody(body) {
  return body
    .replace(/\r\n/g, "\n")
    .replace(
      /^- \[( |x|X)\] \{"task": "([^"]+)", "description": "([^"]+)"\}$/gm,
      (_, checked, task, description) =>
        `- [${checked}] **${task}** - ${description}`
    )
    .replace(/<!-- Section type: ([^>]+) -->/g, "> Section: $1")
    .replace(/^\*\(No content\)\*\s*$/gm, "")
    .trim();
}

function extractHeadings(body) {
  return body
    .split("\n")
    .map((line) => line.match(/^(#{2,4})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => {
      const depth = match[1].length;
      const text = match[2].replace(/\*\*/g, "").trim();
      return {
        depth,
        text,
        id: slugifyHeading(text)
      };
    });
}

function extractCodeBlocks(body) {
  return [...body.matchAll(/```([A-Za-z0-9_-]+)?\n([\s\S]*?)```/g)].map((match) => ({
    language: match[1] || "text",
    code: match[2].trim()
  }));
}

function addHeadingIds(html, headings) {
  let index = 0;
  return html.replace(/<h([2-4])>(.*?)<\/h\1>/g, (match, level, inner) => {
    const heading = headings[index];
    index += 1;
    if (!heading) {
      return match;
    }
    return `<h${level} id="${heading.id}">${inner}</h${level}>`;
  });
}

function inferPrimaryCodeBlock(category, body, codeBlocks) {
  if (category === "statuslines" && body.startsWith("#!/")) {
    return {
      language: "bash",
      code: body
    };
  }

  if (category === "commands") {
    return (
      codeBlocks.find((block) => block.language === "text") ??
      codeBlocks.find((block) => block.language === "bash") ??
      codeBlocks[0] ??
      null
    );
  }

  if (category === "skills" || category === "rules" || category === "agents") {
    return codeBlocks[0] ?? null;
  }

  return null;
}

async function main() {
  await mkdir(SKILL_DOWNLOAD_ROOT, { recursive: true });
  const files = await walkDirectory(CONTENT_ROOT);
  const entries = await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      const { data, body } = parseFrontmatter(source);
      const category = String(data.category ?? filePath.split("/").at(-2) ?? "");
      const slug = String(data.slug ?? "");
      const normalizedBody = normalizeBody(body);
      const headings = extractHeadings(normalizedBody);
      const codeBlocks = extractCodeBlocks(normalizedBody);
      const html = addHeadingIds(String(marked.parse(normalizedBody)), headings);
      const relativePath = relative(REPO_ROOT, filePath);
      const localSkillZipPath = join(CONTENT_ROOT, "skills", `${slug}.zip`);
      let downloadUrl = data.downloadUrl ? String(data.downloadUrl) : undefined;

      if (category === "skills" && slug) {
        try {
          await copyFile(
            localSkillZipPath,
            join(SKILL_DOWNLOAD_ROOT, `${slug}.zip`)
          );
          if (!downloadUrl) {
            downloadUrl = `/downloads/skills/${slug}.zip`;
          }
        } catch {}
      }

      return {
        category,
        slug,
        title: String(data.title ?? ""),
        description: String(data.description ?? ""),
        seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
        seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
        author: data.author ? String(data.author) : undefined,
        authorProfileUrl: data.authorProfileUrl
          ? String(data.authorProfileUrl)
          : undefined,
        dateAdded: data.dateAdded ? String(data.dateAdded) : undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        readingTime:
          typeof data.readingTime === "number" ? data.readingTime : undefined,
        popularityScore:
          typeof data.popularityScore === "number"
            ? data.popularityScore
            : undefined,
        viewCount: typeof data.viewCount === "number" ? data.viewCount : undefined,
        copyCount: typeof data.copyCount === "number" ? data.copyCount : undefined,
        documentationUrl: data.documentationUrl
          ? String(data.documentationUrl)
          : undefined,
        downloadUrl,
        body: normalizedBody,
        html,
        filePath: relativePath,
        githubUrl: `${GITHUB_REPO_URL}/blob/main/${relativePath}`,
        headings,
        codeBlocks,
        primaryCodeBlock: inferPrimaryCodeBlock(category, normalizedBody, codeBlocks),
        isMetadataOnly: !normalizedBody
      };
    })
  );

  const filtered = entries
    .filter((entry) => entry.category && entry.slug && entry.title)
    .sort((left, right) => {
      const popularity =
        (right.popularityScore ?? 0) - (left.popularityScore ?? 0);
      if (popularity !== 0) {
        return popularity;
      }
      return left.title.localeCompare(right.title);
    });

  await mkdir(join(REPO_ROOT, "apps", "web", "src", "generated"), {
    recursive: true
  });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(filtered, null, 2)}\n`);
  console.log(`Wrote ${filtered.length} entries to ${relative(REPO_ROOT, OUTPUT_PATH)}`);
}

await main();
