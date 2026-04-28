#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const REQUIRED_COLUMNS = [
  "slug",
  "title",
  "company_name",
  "company_url",
  "location_text",
  "summary",
  "description_md",
  "employment_type",
  "compensation_summary",
  "equity_summary",
  "bonus_summary",
  "benefits_json",
  "responsibilities_json",
  "requirements_json",
  "apply_url",
  "tier",
  "status",
  "source",
  "source_kind",
  "source_url",
  "first_seen_at",
  "last_checked_at",
  "source_checked_at",
  "stale_check_count",
  "curation_note",
  "paid_placement_expires_at",
  "claimed_employer",
  "posted_by_email",
  "posted_at",
  "expires_at",
  "is_remote",
  "is_worldwide",
  "created_at",
  "updated_at",
];

const REQUIRED_INDEXES = [
  "idx_jobs_listings_active_rank",
  "idx_jobs_listings_expiry",
  "idx_jobs_listings_paid_placement",
  "idx_jobs_listings_review_queue",
  "idx_jobs_listings_source",
  "idx_jobs_listings_source_freshness",
  "idx_jobs_listings_compensation_metadata",
];

function parseArgs(argv) {
  const args = {
    local: true,
    remote: false,
    env: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--remote") {
      args.remote = true;
      args.local = false;
    } else if (arg === "--local") {
      args.local = true;
      args.remote = false;
    } else if (arg === "--env") {
      args.env = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: pnpm validate:d1-jobs -- [--local|--remote] [--env dev]

Checks that the SITE_DB jobs schema has the columns and indexes required by
the reviewed D1-backed jobs board. Default target is local D1.`);
      process.exit(0);
    }
  }

  return args;
}

function runD1(command, options) {
  const wranglerArgs = [
    "--filter",
    "web",
    "exec",
    "wrangler",
    "d1",
    "execute",
    "SITE_DB",
    options.remote ? "--remote" : "--local",
    "--json",
    "--command",
    command,
  ];
  if (options.env) {
    wranglerArgs.splice(7, 0, "--env", options.env);
  }

  const result = spawnSync("pnpm", wranglerArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }

  try {
    const parsed = JSON.parse(result.stdout);
    return Array.isArray(parsed) ? parsed[0]?.results || [] : [];
  } catch (error) {
    console.error("Could not parse wrangler JSON output.");
    console.error(result.stdout);
    throw error;
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const columns = runD1("PRAGMA table_info(jobs_listings);", options);
  const columnNames = new Set(columns.map((row) => String(row.name)));
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !columnNames.has(column),
  );

  const indexes = runD1("PRAGMA index_list(jobs_listings);", options);
  const indexNames = new Set(indexes.map((row) => String(row.name)));
  const missingIndexes = REQUIRED_INDEXES.filter(
    (index) => !indexNames.has(index),
  );

  if (missingColumns.length || missingIndexes.length) {
    console.error("D1 jobs schema validation failed.");
    if (missingColumns.length) {
      console.error(`Missing columns: ${missingColumns.join(", ")}`);
    }
    if (missingIndexes.length) {
      console.error(`Missing indexes: ${missingIndexes.join(", ")}`);
    }
    process.exit(1);
  }

  const target = options.remote
    ? `remote${options.env ? `:${options.env}` : ""}`
    : "local";
  console.log(
    `D1 jobs schema validation passed for ${target} (${REQUIRED_COLUMNS.length} columns, ${REQUIRED_INDEXES.length} indexes).`,
  );
}

main();
