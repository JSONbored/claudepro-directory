import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_INDEXNOW_BASE_URL,
  DEFAULT_INDEXNOW_KEY,
  INDEXNOW_ENDPOINT,
  buildIndexNowPayload,
  chunkUrls,
  extractSitemapUrls,
  hostFromSiteUrl,
  isProductionIndexNowHost,
  keyLocationFor,
  normalizeSiteUrl,
  normalizeSubmittedUrls,
} from "./lib/indexnow.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.INDEXNOW_BASE_URL || DEFAULT_INDEXNOW_BASE_URL,
    dryRun: false,
    urls: [],
    urlsFile: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (arg === "--base-url") {
      args.baseUrl = argv[++index] || args.baseUrl;
      continue;
    }
    if (arg === "--url") {
      args.urls.push(argv[++index] || "");
      continue;
    }
    if (arg === "--urls-file") {
      args.urlsFile = argv[++index] || "";
      continue;
    }
  }

  return args;
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: HTTP ${response.status}`);
  }
  return response.text();
}

function readUrlsFile(filePath) {
  if (!filePath) return [];
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(repoRoot, filePath);
  return fs
    .readFileSync(absolute, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function collectUrls(args, siteUrl) {
  const explicitUrls = [...args.urls, ...readUrlsFile(args.urlsFile)];
  if (explicitUrls.length) return explicitUrls;

  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  return extractSitemapUrls(await fetchText(sitemapUrl));
}

async function submitBatch(payload, dryRun) {
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `IndexNow submission failed with HTTP ${response.status}: ${text}`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const siteUrl = normalizeSiteUrl(args.baseUrl);
  const host = hostFromSiteUrl(siteUrl);
  const key = process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY;
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION || keyLocationFor(siteUrl, key);

  if (
    !args.dryRun &&
    process.env.INDEXNOW_SUBMIT !== "1" &&
    process.env.INDEXNOW_SUBMIT !== "true"
  ) {
    console.log(
      "Skipping IndexNow submission because INDEXNOW_SUBMIT is not enabled.",
    );
    return;
  }

  if (
    !args.dryRun &&
    !isProductionIndexNowHost(host) &&
    process.env.INDEXNOW_ALLOW_NON_PRODUCTION !== "1"
  ) {
    console.log(
      `Skipping IndexNow submission for non-production host: ${host}`,
    );
    return;
  }

  const urls = normalizeSubmittedUrls(await collectUrls(args, siteUrl), host);
  if (!urls.length) {
    console.log("No IndexNow URLs to submit.");
    return;
  }

  const batches = chunkUrls(urls, 1000);
  for (const batch of batches) {
    await submitBatch(
      buildIndexNowPayload({
        host,
        key,
        keyLocation,
        urlList: batch,
      }),
      args.dryRun,
    );
  }

  console.log(
    `${args.dryRun ? "Prepared" : "Submitted"} ${urls.length} IndexNow URL(s) in ${batches.length} batch(es).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
