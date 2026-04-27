import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderAllEmailTemplates } from "../emails/src/render";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const outputDir = path.join(repoRoot, "emails", "templates");
const checkOnly = process.argv.includes("--check");

async function readExisting(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function main() {
  const rendered = await renderAllEmailTemplates();
  const stale: string[] = [];

  await mkdir(outputDir, { recursive: true });

  for (const template of rendered) {
    for (const [extension, value] of [
      ["html", template.html],
      ["txt", template.text],
    ] as const) {
      const filePath = path.join(outputDir, `${template.name}.${extension}`);
      if (checkOnly) {
        const existing = await readExisting(filePath);
        if (existing !== value) {
          stale.push(path.relative(repoRoot, filePath));
        }
      } else {
        await writeFile(filePath, value);
      }
    }
  }

  if (stale.length) {
    throw new Error(
      `Email templates are stale. Run pnpm email:render. Stale files: ${stale.join(", ")}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
