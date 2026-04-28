#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import {
  domainFromUrl,
  isHostingOrRegistryDomain,
  normalizeBrandDomain,
} from "@heyclaude/registry/brand-assets";
import { orderFrontmatter } from "@heyclaude/registry/content-schema";

const repoRoot = process.cwd();
const contentRoot = path.join(repoRoot, "content");
const apply = process.argv.includes("--apply");

function walkMdx(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMdx(entryPath);
    return entry.name.endsWith(".mdx") ? [entryPath] : [];
  });
}

function clean(value) {
  return String(value || "").trim();
}

function candidateDomain(data) {
  const explicit = normalizeBrandDomain(data.brandDomain);
  if (explicit) return { domain: explicit, source: "explicit" };

  const websiteDomain = domainFromUrl(data.websiteUrl);
  if (websiteDomain && !isHostingOrRegistryDomain(websiteDomain)) {
    return { domain: websiteDomain, source: "websiteUrl" };
  }

  const docsDomain = domainFromUrl(data.documentationUrl);
  if (docsDomain && !isHostingOrRegistryDomain(docsDomain)) {
    return { domain: docsDomain, source: "documentationUrl-review-only" };
  }

  return { domain: "", source: "missing" };
}

const rows = [];
const changed = [];

for (const filePath of walkMdx(contentRoot)) {
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const data = parsed.data;
  const title = clean(data.title) || path.basename(filePath, ".mdx");
  const category =
    clean(data.category) || path.basename(path.dirname(filePath));
  const existingDomain = normalizeBrandDomain(data.brandDomain);
  const candidate = candidateDomain(data);
  const safeAutoApply = candidate.source === "websiteUrl" && !existingDomain;

  rows.push({
    path: path.relative(repoRoot, filePath),
    category,
    title,
    existingDomain,
    candidateDomain: candidate.domain,
    candidateSource: candidate.source,
    action: safeAutoApply ? "applyable" : existingDomain ? "ok" : "review",
  });

  if (apply && safeAutoApply && candidate.domain) {
    const nextData = orderFrontmatter({
      ...data,
      brandName: clean(data.brandName) || title,
      brandDomain: candidate.domain,
      brandAssetSource: "brandfetch",
    });
    fs.writeFileSync(filePath, matter.stringify(parsed.content, nextData));
    changed.push(filePath);
  }
}

const report = {
  mode: apply ? "apply" : "dry-run",
  total: rows.length,
  withBrandDomain: rows.filter((row) => row.existingDomain).length,
  applyableWebsiteDomains: rows.filter((row) => row.action === "applyable")
    .length,
  reviewNeeded: rows.filter((row) => row.action === "review").length,
  changed: changed.map((filePath) => path.relative(repoRoot, filePath)),
  rows,
};

console.log(JSON.stringify(report, null, 2));
