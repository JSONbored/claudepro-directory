import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { marked } from "marked";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentRoot = path.join(repoRoot, "content");
const generatedDir = path.join(repoRoot, "apps/web/src/generated");
const outputFile = path.join(generatedDir, "content-index.json");
const downloadsDir = path.join(repoRoot, "apps/web/public/downloads/skills");

const categories = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "data")
  .map((entry) => entry.name);

marked.setOptions({
  gfm: true,
  breaks: false
});

function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractCodeBlocks(body) {
  const matches = [...body.matchAll(/```([\w-]*)\n([\s\S]*?)```/g)];
  return matches.map((match) => ({
    language: match[1] || "text",
    code: match[2].trim()
  }));
}

function extractHeadings(body) {
  return body
    .split("\n")
    .map((line) => line.match(/^(##+)\s+(.*)$/))
    .filter(Boolean)
    .map((match) => ({
      depth: match[1].length,
      text: match[2].trim(),
      id: headingId(match[2].trim())
    }));
}

const renderer = new marked.Renderer();
renderer.heading = ({ tokens, depth }) => {
  const text = tokens.map((token) => token.raw).join("").trim();
  const id = headingId(text);
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};

function buildGitHubUrl(filePath) {
  const relative = path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
  return `https://github.com/JSONbored/claudepro-directory/blob/main/${relative}`;
}

function normalizeDownloadUrl(downloadUrl) {
  if (!downloadUrl) return "";
  return downloadUrl;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(generatedDir);
ensureDir(downloadsDir);

for (const fileName of fs.readdirSync(path.join(contentRoot, "skills"))) {
  if (!fileName.endsWith(".zip")) continue;
  fs.copyFileSync(
    path.join(contentRoot, "skills", fileName),
    path.join(downloadsDir, fileName)
  );
}

const entries = [];

for (const category of categories) {
  const categoryDir = path.join(contentRoot, category);
  const files = fs
    .readdirSync(categoryDir)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .sort();

  for (const fileName of files) {
    const filePath = path.join(categoryDir, fileName);
    const source = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(source);
    const body = content.trim();
    const headings = extractHeadings(body);
    const codeBlocks = extractCodeBlocks(body);

    entries.push({
      category,
      slug: String(data.slug ?? fileName.replace(/\.mdx$/, "")),
      title: String(data.title ?? fileName.replace(/\.mdx$/, "")),
      description: String(data.description ?? ""),
      seoTitle: data.seoTitle ? String(data.seoTitle) : undefined,
      seoDescription: data.seoDescription ? String(data.seoDescription) : undefined,
      author: data.author ? String(data.author) : undefined,
      authorProfileUrl: data.authorProfileUrl
        ? String(data.authorProfileUrl)
        : undefined,
      dateAdded: data.dateAdded ? String(data.dateAdded) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
      readingTime:
        typeof data.readingTime === "number" ? data.readingTime : undefined,
      viewCount: typeof data.viewCount === "number" ? data.viewCount : undefined,
      copyCount: typeof data.copyCount === "number" ? data.copyCount : undefined,
      popularityScore:
        typeof data.popularityScore === "number" ? data.popularityScore : undefined,
      documentationUrl: data.documentationUrl
        ? String(data.documentationUrl)
        : undefined,
      downloadUrl: normalizeDownloadUrl(
        data.downloadUrl ? String(data.downloadUrl) : ""
      ),
      body,
      html: marked.parse(body, { renderer }),
      headings,
      codeBlocks,
      filePath: path.relative(repoRoot, filePath).replaceAll(path.sep, "/"),
      githubUrl: buildGitHubUrl(filePath)
    });
  }
}

entries.sort((left, right) => {
  const popularity = (right.popularityScore ?? 0) - (left.popularityScore ?? 0);
  if (popularity !== 0) return popularity;
  return left.title.localeCompare(right.title);
});

fs.writeFileSync(outputFile, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(repoRoot, outputFile)}`);
