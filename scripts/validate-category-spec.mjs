import fs from "node:fs";
import path from "node:path";

import categorySpec from "@heyclaude/registry/category-spec";
import { buildIssueTemplateSpec } from "@heyclaude/registry/submission-spec";

const repoRoot = process.cwd();
const templateRoot = path.join(repoRoot, ".github/ISSUE_TEMPLATE");
const contentRoot = path.join(repoRoot, "content");
const failures = [];
const submissionCategories = new Set(categorySpec.submissionOrder ?? []);

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

  if (!submissionCategories.has(category)) {
    continue;
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

  if (templatePath.endsWith(".yml") || templatePath.endsWith(".yaml")) {
    const issueTemplateSpec = buildIssueTemplateSpec(category);
    const requiredFields =
      issueTemplateSpec?.fields
        .filter((field) => field.required)
        .map((field) => field.id) ?? [];
    for (const field of requiredFields) {
      if (!template.includes(`id: ${field}`)) {
        fail(`${category}: issue template missing required field id ${field}`);
      }
    }
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
