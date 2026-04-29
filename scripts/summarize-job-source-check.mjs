#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export function formatJobSourceCheckSummary(report) {
  const results = Array.isArray(report?.results) ? report.results : [];
  const summary = report?.summary || {};
  const lines = [
    "## Jobs Source Revalidation",
    "",
    `- Mode: ${report?.apply ? "apply" : "dry-run"}`,
    `- Base URL: ${report?.baseUrl || "unknown"}`,
    `- Checked at: ${report?.checkedAt || "unknown"}`,
    `- Jobs checked: ${results.length}`,
    `- Revalidated: ${summary.revalidated ?? 0}`,
    `- Reactivated: ${summary.reactivated ?? 0}`,
    `- Marked stale: ${summary.stale ?? 0}`,
    `- Closed: ${summary.closed ?? 0}`,
    `- Blocked by public exposure gate: ${summary.blockedByPublicExposureGate ?? 0}`,
    "",
  ];

  if (!results.length) {
    lines.push(
      "No active or stale-review jobs were returned by the admin API.",
    );
    return `${lines.join("\n")}\n`;
  }

  lines.push("| Job | Previous | Action | Next | Source | Reason |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const result of results) {
    lines.push(
      `| ${escapeTableCell(result.slug || result.title || "unknown")} | ${escapeTableCell(result.status || "")} | ${escapeTableCell(result.action || "")} | ${escapeTableCell(result.nextStatus || "")} | ${result.ok ? "ok" : "blocked"} | ${escapeTableCell(result.reason || result.lifecycleReason || "")} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function escapeTableCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim();
}

export function main(argv = process.argv.slice(2)) {
  const [file] = argv;
  if (!file) {
    throw new Error(
      "Usage: node scripts/summarize-job-source-check.mjs <report.json>",
    );
  }
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  process.stdout.write(formatJobSourceCheckSummary(report));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
