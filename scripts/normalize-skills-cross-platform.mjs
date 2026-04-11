import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

const repoRoot = process.cwd();
const skillsDir = path.join(repoRoot, "content", "skills");

const compatibilitySection = `## Compatibility

### Native

- **Claude Code / Claude**: native skill usage via \`SKILL.md\`.
- **Codex/OpenAI workflows**: compatible with Agent Skills-style \`SKILL.md\` content as reusable workflow instructions.

### Manual Adaptation

- **OpenClaw, Cursor, Windsurf, Gemini, and similar agents**: use the same skill content as a reusable prompt/workflow file when native skill import is unavailable.
`;

function insertCompatibilitySection(body) {
  if (/^##\s+Compatibility\b/im.test(body)) return body;

  const prerequisitesMatch = body.match(/^##\s+Prerequisites\b/im);
  if (prerequisitesMatch?.index !== undefined) {
    return `${body.slice(0, prerequisitesMatch.index).trimEnd()}\n\n${compatibilitySection}\n\n${body
      .slice(prerequisitesMatch.index)
      .trimStart()}`;
  }

  const firstSectionMatch = body.match(/^##\s+/m);
  if (firstSectionMatch?.index !== undefined) {
    return `${body.slice(0, firstSectionMatch.index).trimEnd()}\n\n${compatibilitySection}\n\n${body
      .slice(firstSectionMatch.index)
      .trimStart()}`;
  }

  return `${body.trimEnd()}\n\n${compatibilitySection}\n`;
}

function asSkillMarkdown(slug, description, body) {
  const cleanDescription = String(description || "").replaceAll('"', '\\"');
  return `---
name: ${slug}
description: "${cleanDescription}"
---

${body.trim()}\n`;
}

const files = fs
  .readdirSync(skillsDir)
  .filter((fileName) => fileName.endsWith(".mdx"))
  .sort();

let updatedContentCount = 0;
let rebuiltZipCount = 0;

for (const fileName of files) {
  const filePath = path.join(skillsDir, fileName);
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);

  const slug = String(parsed.data.slug || fileName.replace(/\.mdx$/, ""));
  const description = String(parsed.data.description || "");
  const normalizedBody = insertCompatibilitySection(parsed.content.trim());
  const nextSource = matter.stringify(`${normalizedBody}\n`, parsed.data, {
    lineWidth: 10000
  });

  if (nextSource !== source) {
    fs.writeFileSync(filePath, nextSource);
    updatedContentCount += 1;
  }

  const skillMarkdown = asSkillMarkdown(slug, description, normalizedBody);
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), `skill-${slug}-`));
  const packageDir = path.join(tmpRoot, slug);
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(path.join(packageDir, "SKILL.md"), skillMarkdown);

  const zipPath = path.join(skillsDir, `${slug}.zip`);
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

  execFileSync("zip", ["-rqD", zipPath, `${slug}/SKILL.md`], {
    cwd: tmpRoot
  });

  fs.rmSync(tmpRoot, { recursive: true, force: true });
  rebuiltZipCount += 1;
}

console.log(
  `Skills normalized. Updated content files: ${updatedContentCount}. Rebuilt zips: ${rebuiltZipCount}.`
);
