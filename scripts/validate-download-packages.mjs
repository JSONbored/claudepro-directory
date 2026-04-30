import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import matter from "gray-matter";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const failures = [];
const warnings = [];

function isFirstPartyPackage(data = {}) {
  return data.packageVerified === true;
}

function normalizeDownloadUrl(downloadUrl) {
  return String(downloadUrl ?? "").trim();
}

function isLocalDownloadUrl(downloadUrl) {
  return normalizeDownloadUrl(downloadUrl).startsWith("/downloads/");
}

function unzipList(archivePath) {
  try {
    const output = execFileSync("unzip", ["-Z1", archivePath], {
      encoding: "utf8",
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    warnings.push(
      `Could not inspect archive contents with unzip: ${path.relative(repoRoot, archivePath)}`,
    );
    return [];
  }
}

function unzipText(archivePath, fileName) {
  try {
    return execFileSync("unzip", ["-p", archivePath, fileName], {
      encoding: "utf8",
    });
  } catch {
    failures.push(
      `Could not read ${fileName} from ${path.relative(repoRoot, archivePath)}`,
    );
    return "";
  }
}

function validateSkillArchive(filePath, entry) {
  const names = unzipList(filePath);
  if (!names.length) return;

  const invalidPath = names.find(
    (name) =>
      name.startsWith("/") || name.includes("..") || name.includes("\\"),
  );
  if (invalidPath) {
    failures.push(`${entry}: unsafe archive path detected (${invalidPath})`);
  }

  const rootFolders = new Set(
    names.map((name) => name.split("/").filter(Boolean)[0]).filter(Boolean),
  );
  if (rootFolders.size !== 1) {
    failures.push(`${entry}: skills archive must contain one root folder`);
    return;
  }

  const root = [...rootFolders][0];
  const skillPath = `${root}/SKILL.md`;
  if (!names.includes(skillPath)) {
    failures.push(`${entry}: skills archive must include ${skillPath}`);
    return;
  }

  const disallowed = names.find((name) => {
    if (name.endsWith("/")) return false;
    if (name === skillPath) return false;
    if (name.startsWith(`${root}/scripts/`)) return false;
    if (name.startsWith(`${root}/references/`)) return false;
    if (name.startsWith(`${root}/assets/`)) return false;
    if (name === `${root}/agents/openai.yaml`) return false;
    return true;
  });
  if (disallowed) {
    failures.push(`${entry}: unexpected Agent Skill file (${disallowed})`);
  }

  const skill = matter(unzipText(filePath, skillPath));
  const name = String(skill.data?.name || "").trim();
  const description = String(skill.data?.description || "").trim();
  if (!name) failures.push(`${entry}: SKILL.md frontmatter missing name`);
  if (!description) {
    failures.push(`${entry}: SKILL.md frontmatter missing description`);
  }
  if (description.length > 1024) {
    failures.push(`${entry}: SKILL.md description exceeds 1024 characters`);
  }
}

function validateMcpArchive(filePath, entry) {
  const names = unzipList(filePath);
  if (!names.length) return;

  const invalidPath = names.find(
    (name) =>
      name.startsWith("/") || name.includes("..") || name.includes("\\"),
  );
  if (invalidPath) {
    failures.push(`${entry}: unsafe archive path detected (${invalidPath})`);
  }

  const required = [
    "manifest.json",
    "package.json",
    "README.md",
    "server/index.js",
  ];
  for (const requiredPath of required) {
    if (!names.includes(requiredPath)) {
      failures.push(`${entry}: missing required MCPB file (${requiredPath})`);
    }
  }

  const allowedExtensions = new Set([".md", ".json", ".js"]);
  const disallowed = names.find((name) => {
    const ext = path.extname(name).toLowerCase();
    return ext && !allowedExtensions.has(ext);
  });

  if (disallowed) {
    failures.push(`${entry}: unexpected MCPB file extension (${disallowed})`);
  }
}

for (const category of ["skills", "mcp"]) {
  const categoryDir = path.join(contentRoot, category);
  if (!fs.existsSync(categoryDir)) continue;

  for (const fileName of fs.readdirSync(categoryDir)) {
    if (!fileName.endsWith(".mdx")) continue;
    const filePath = path.join(categoryDir, fileName);
    const entry = `${category}/${fileName}`;
    const parsed = matter(fs.readFileSync(filePath, "utf8"));
    const data = parsed.data ?? {};
    const downloadUrl = normalizeDownloadUrl(data.downloadUrl);

    if (!downloadUrl) continue;

    const firstPartyPackage = isFirstPartyPackage(data);

    if (category === "skills" && !downloadUrl.endsWith(".zip")) {
      failures.push(`${entry}: skills downloadUrl must end with .zip`);
    }

    if (category === "mcp" && !downloadUrl.endsWith(".mcpb")) {
      failures.push(`${entry}: mcp downloadUrl must end with .mcpb`);
    }

    if (!isLocalDownloadUrl(downloadUrl)) continue;

    if (!firstPartyPackage) {
      failures.push(
        `${entry}: local /downloads hosting requires packageVerified: true`,
      );
      continue;
    }

    if (
      category === "skills" &&
      !downloadUrl.startsWith("/downloads/skills/")
    ) {
      failures.push(
        `${entry}: skills local downloadUrl must use /downloads/skills/...`,
      );
      continue;
    }

    if (category === "mcp" && !downloadUrl.startsWith("/downloads/mcp/")) {
      failures.push(
        `${entry}: mcp local downloadUrl must use /downloads/mcp/...`,
      );
      continue;
    }

    const sourceArchive = path.join(
      contentRoot,
      category,
      path.basename(downloadUrl),
    );
    if (!fs.existsSync(sourceArchive)) {
      failures.push(
        `${entry}: referenced local package file is missing (${path.relative(repoRoot, sourceArchive)})`,
      );
      continue;
    }

    const stat = fs.statSync(sourceArchive);
    if (stat.size > 5 * 1024 * 1024) {
      failures.push(
        `${entry}: package exceeds 5MB limit (${Math.round(stat.size / 1024)}KB)`,
      );
      continue;
    }

    if (category === "skills") {
      validateSkillArchive(sourceArchive, entry);
    } else if (category === "mcp") {
      validateMcpArchive(sourceArchive, entry);
    }
  }
}

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (failures.length > 0) {
  console.error(`Failures (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Package download validation passed.");
