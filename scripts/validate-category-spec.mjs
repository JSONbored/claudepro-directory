import fs from "node:fs";
import path from "node:path";

import categorySpec from "../content/category-spec.json" with { type: "json" };

const repoRoot = process.cwd();
const templateRoot = path.join(repoRoot, ".github/ISSUE_TEMPLATE");
const contentRoot = path.join(repoRoot, "content");
const failures = [];

function fail(message) {
  failures.push(message);
}

for (const category of categorySpec.categoryOrder) {
  const spec = categorySpec.categories?.[category];
  if (!spec) {
    fail(`Missing category spec for ${category}`);
    continue;
  }

  if (!fs.existsSync(path.join(contentRoot, category))) {
    fail(`Missing content directory for ${category}`);
  }

  if (!Array.isArray(spec.quickstart) || spec.quickstart.length < 2) {
    fail(`${category}: quickstart must include at least two steps`);
  }

  if (!spec.template) {
    fail(`${category}: missing issue template name`);
    continue;
  }

  const templatePath = path.join(templateRoot, spec.template);
  if (!fs.existsSync(templatePath)) {
    fail(`${category}: issue template not found: ${spec.template}`);
    continue;
  }

  const template = fs.readFileSync(templatePath, "utf8");
  if (!template.includes("content-submission")) {
    fail(`${category}: issue template must include content-submission label`);
  }
}

for (const [alias, target] of Object.entries(categorySpec.aliases ?? {})) {
  if (!categorySpec.categoryOrder.includes(target)) {
    fail(`Alias ${alias} points to unknown category ${target}`);
  }
}

if (failures.length) {
  console.error("Category spec validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Category spec validation passed.");
