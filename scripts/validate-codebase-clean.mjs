import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const forbiddenPaths = [
  "apps/web/public/data/content-index.json",
  "apps/web/src/generated/content-category-spec.json",
  "apps/web/src/generated/legacy-vote-seed.json",
  "apps/web/src/lib/entry-presentation.ts",
  "apps/web/src/lib/llms-export.ts",
  "content/archive/legacy-data",
  "content/data/legacy-vote-seed.json",
  "scripts/content-schema.mjs",
  "scripts/export-legacy-vote-seed.mjs",
  "scripts/migrate-content.mjs",
  "scripts/normalize-skills-cross-platform.mjs",
  "scripts/remove-legacy-counters.mjs",
  "scripts/restore-collections-from-history.mjs",
  "scripts/restore-hooks-from-history.mjs",
  "scripts/restore-mcp-from-history.mjs",
  "scripts/restore-skills-from-history.mjs",
  "scripts/restore-statuslines-from-history.mjs",
  "scripts/submission-issue-lib.mjs",
  "scripts/test-all.mjs",
  "scripts/test-commercial-intake.mjs",
  "scripts/test-registry-artifacts.mjs",
  "scripts/test-seo-jsonld.mjs",
  "scripts/test-submission-intake.mjs",
];

const ignoredDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  "apps/web/public/data",
  "integrations/raycast/node_modules",
]);

const ignoredFiles = new Set([
  "CHANGELOG.md",
  "apps/web/worker-configuration.d.ts",
  "scripts/audit-content.mjs",
  "scripts/validate-content.mjs",
  "scripts/validate-codebase-clean.mjs",
  "tests/cleanup-policy.test.ts",
]);

const forbiddenPatterns = [
  {
    pattern: /\blegacy-vote-seed\b/,
    label: "legacy vote seed reference",
  },
  {
    pattern: /\bcontent-schema\.mjs\b/,
    label: "registry compatibility shim reference",
  },
  {
    pattern: /\bsubmission-issue-lib\.mjs\b/,
    label: "submission compatibility shim reference",
  },
  {
    pattern: /\bclaudepro\.directory\b/i,
    label: "old domain reference",
  },
  {
    pattern: /\bClaude Pro Directory\b/,
    label: "old brand reference",
  },
  {
    pattern: /\[Script content from first example\]/,
    label: "placeholder script marker",
  },
  {
    pattern: /Array\.isArray\(payload\)\s*\?\s*payload/,
    label: "legacy array registry artifact reader",
  },
];

const requiredTaskSections = [
  "Current Gate",
  "V2.1 Hardening",
  "Registry/API",
  "SEO + Content Quality",
  "UGC Growth",
  "Raycast",
  "Commercial Surfaces",
  "Testing/CI/Trunk",
  "Future Moat",
];

const forbiddenBenchmarkNames = [
  String.fromCharCode(
    99,
    117,
    114,
    115,
    111,
    114,
    46,
    100,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
  ),
  String.fromCharCode(
    67,
    117,
    114,
    115,
    111,
    114,
    32,
    68,
    105,
    114,
    101,
    99,
    116,
    111,
    114,
    121,
  ),
];

const failures = [];

for (const relativePath of forbiddenPaths) {
  if (fs.existsSync(path.join(repoRoot, relativePath))) {
    failures.push(`Forbidden legacy path exists: ${relativePath}`);
  }
}

function shouldIgnore(relativePath) {
  if (ignoredFiles.has(relativePath)) return true;
  if (relativePath.startsWith("apps/web/public/data/")) return true;
  if (relativePath.startsWith("integrations/raycast/node_modules/"))
    return true;
  return relativePath.split(path.sep).some((part) => ignoredDirs.has(part));
}

function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.relative(repoRoot, fullPath);
    if (shouldIgnore(relativePath)) continue;

    if (item.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!item.isFile()) continue;
    const ext = path.extname(item.name).toLowerCase();
    const searchable =
      !ext ||
      [
        ".css",
        ".js",
        ".json",
        ".md",
        ".mdx",
        ".mjs",
        ".sql",
        ".ts",
        ".tsx",
        ".txt",
        ".yml",
        ".yaml",
      ].includes(ext);
    if (!searchable) continue;

    const source = fs.readFileSync(fullPath, "utf8");
    for (const { pattern, label } of forbiddenPatterns) {
      if (pattern.test(source)) failures.push(`${relativePath}: ${label}`);
    }
  }
}

walk(repoRoot);

const trunkConfig = path.join(repoRoot, ".trunk", "trunk.yaml");
if (!fs.existsSync(trunkConfig)) {
  failures.push("Tracked Trunk config is missing: .trunk/trunk.yaml");
}

const tasksPath = path.join(repoRoot, "TASKS.md");
if (!fs.existsSync(tasksPath)) {
  failures.push("TASKS.md is missing");
} else {
  const tasks = fs.readFileSync(tasksPath, "utf8");
  for (const section of requiredTaskSections) {
    if (!tasks.includes(`## ${section}`)) {
      failures.push(`TASKS.md is missing section: ${section}`);
    }
  }
  for (const forbiddenName of forbiddenBenchmarkNames) {
    if (tasks.toLowerCase().includes(forbiddenName.toLowerCase())) {
      failures.push("TASKS.md contains a forbidden internal benchmark name");
    }
  }

  const completedLines = tasks
    .split("\n")
    .filter((line) => line.trim().startsWith("- [x]"));
  for (const line of completedLines) {
    if (!line.includes("Evidence:") || !line.includes("`")) {
      failures.push(`Completed TASKS.md item lacks command evidence: ${line}`);
    }
  }

  const scriptNames = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ).scripts;
  for (const scriptName of [
    "validate:clean",
    "validate:content:strict",
    "validate:category-spec",
    "validate:packages",
    "validate:raycast-feed",
    "test",
    "test:e2e",
    "type-check",
    "build",
  ]) {
    if (!scriptNames?.[scriptName]) {
      failures.push(
        `package.json is missing TASKS.md gate script: ${scriptName}`,
      );
    }
    if (!tasks.includes(`pnpm ${scriptName}`)) {
      failures.push(`TASKS.md is missing gate command: pnpm ${scriptName}`);
    }
  }
}

const openApiSchema = fs.existsSync(
  path.join(repoRoot, "cloudflare/api-schema-heyclaude-openapi.yaml"),
)
  ? fs.readFileSync(
      path.join(repoRoot, "cloudflare/api-schema-heyclaude-openapi.yaml"),
      "utf8",
    )
  : "";
for (const route of [
  "/api/registry/manifest:",
  "/api/registry/categories:",
  "/api/registry/search:",
  "/api/registry/entries/{category}/{slug}:",
  "/api/registry/entries/{category}/{slug}/llms:",
  "/api/listing-leads:",
  "/api/admin/listing-leads:",
]) {
  if (!openApiSchema.includes(route)) {
    failures.push(`OpenAPI schema is missing ${route.replace(/:$/, "")}`);
  }
}

const wranglerConfig = fs.existsSync(
  path.join(repoRoot, "apps/web/wrangler.jsonc"),
)
  ? fs.readFileSync(path.join(repoRoot, "apps/web/wrangler.jsonc"), "utf8")
  : "";
if (!wranglerConfig.includes('"binding": "SITE_DB"')) {
  failures.push("Wrangler config is missing SITE_DB binding");
}
if (wranglerConfig.includes("VOTES_DB")) {
  failures.push("Wrangler config still references VOTES_DB");
}

const deploymentDocs = fs.existsSync(
  path.join(repoRoot, "apps/web/DEPLOYMENT.md"),
)
  ? fs.readFileSync(path.join(repoRoot, "apps/web/DEPLOYMENT.md"), "utf8")
  : "";
const migrationsDir = path.join(repoRoot, "apps/web/migrations");
if (fs.existsSync(migrationsDir)) {
  for (const migration of fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))) {
    if (!deploymentDocs.includes(migration)) {
      failures.push(`Deployment docs do not mention migration: ${migration}`);
    }
  }
}

if (failures.length) {
  console.error("Codebase cleanup validation failed:");
  for (const failure of failures.slice(0, 100)) console.error(`- ${failure}`);
  if (failures.length > 100)
    console.error(`...and ${failures.length - 100} more failures`);
  process.exit(1);
}

console.log("Codebase cleanup validation passed.");
