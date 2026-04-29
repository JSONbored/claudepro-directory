#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import {
  evaluateJobSourceLifecycle,
  validateJobPublicExposure,
} from "@heyclaude/registry/commercial";

function usage() {
  console.log(`Usage:
  pnpm jobs:check-sources -- --base-url https://dev.example.com [--dry-run|--apply]

Checks active and stale D1 jobs through the token-protected admin API. With
--apply, the script revalidates active jobs, reactivates healthy stale jobs,
marks first failures stale, and closes repeated failures.

Options:
  --dry-run              Check sources and print planned transitions only.
  --apply                Apply transitions through the admin API.
  --output <path>        Write the JSON report to a file.
  --allow-unhealthy      Do not exit non-zero for unhealthy sources.
  --fail-on-unhealthy    Exit non-zero when any source fails validation.`);
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? next : "1";
    if (args[key] === next) index += 1;
  }
  return args;
}

function getToken() {
  return String(
    process.env.ADMIN_API_TOKEN ||
      process.env.LEADS_ADMIN_TOKEN ||
      process.env.ADMIN_LEADS_TOKEN ||
      "",
  ).trim();
}

function getBaseUrl(args) {
  const baseUrl = String(
    args["base-url"] ||
      process.env.HEYCLAUDE_ADMIN_BASE_URL ||
      process.env.HEYCLAUDE_BASE_URL ||
      "",
  ).trim();
  if (!baseUrl) {
    throw new Error("Missing --base-url or HEYCLAUDE_ADMIN_BASE_URL.");
  }
  return baseUrl.replace(/\/$/, "");
}

async function adminFetch(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error("Missing ADMIN_API_TOKEN.");
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

export function containsClosurePhrase(text) {
  return [
    "job is no longer available",
    "position has been filled",
    "this role is closed",
    "no longer accepting applications",
    "not accepting applications",
  ].some((phrase) => text.includes(phrase));
}

export function hasApplySignal(text) {
  return [
    "apply",
    "submit application",
    "application form",
    "ashby",
    "greenhouse",
    "lever",
    "workable",
    "smartrecruiters",
  ].some((phrase) => text.includes(phrase));
}

export function includesToken(text, value) {
  const token = String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .find((item) => item.length >= 3);
  return token ? text.includes(token) : true;
}

export async function checkJob(job) {
  const targetUrl = job.sourceUrl || job.applyUrl;
  if (!targetUrl || !targetUrl.startsWith("https://")) {
    return {
      ok: false,
      reason: "missing_https_source",
      titleMatched: false,
      companyMatched: false,
      closureDetected: false,
      applyDetected: false,
    };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { "user-agent": "HeyClaude job source checker" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return {
        ok: false,
        reason: `http_${response.status}`,
        titleMatched: false,
        companyMatched: false,
        closureDetected: false,
        applyDetected: false,
      };
    }
    const text = (await response.text()).toLowerCase();
    const titleMatched = includesToken(text, job.title);
    const companyMatched = includesToken(text, job.company);
    const closureDetected = containsClosurePhrase(text);
    const applyDetected = hasApplySignal(text);
    const ok =
      titleMatched && companyMatched && !closureDetected && applyDetected;
    return {
      ok,
      reason: ok
        ? "source_available"
        : closureDetected
          ? "closed_copy"
          : !titleMatched
            ? "title_not_found"
            : !companyMatched
              ? "company_not_found"
              : "apply_not_found",
      titleMatched,
      companyMatched,
      closureDetected,
      applyDetected,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "fetch_failed",
      titleMatched: false,
      companyMatched: false,
      closureDetected: false,
      applyDetected: false,
    };
  }
}

async function fetchJobs(baseUrl, status) {
  const url = new URL(`${baseUrl}/api/admin/jobs`);
  url.searchParams.set("status", status);
  url.searchParams.set("limit", "100");
  const payload = await adminFetch(url.toString());
  return Array.isArray(payload.entries) ? payload.entries : [];
}

export function summarizeResults(results) {
  const summary = {
    sourceAvailable: 0,
    stale: 0,
    closed: 0,
    revalidated: 0,
    reactivated: 0,
    blockedByPublicExposureGate: 0,
  };
  for (const result of results) {
    if (result.reason === "source_available") summary.sourceAvailable += 1;
    if (result.action === "stale") summary.stale += 1;
    if (result.action === "close") summary.closed += 1;
    if (result.action === "revalidate") summary.revalidated += 1;
    if (result.action === "reactivate") summary.reactivated += 1;
    if (result.reason === "public_exposure_gate_failed") {
      summary.blockedByPublicExposureGate += 1;
    }
  }
  return summary;
}

export function evaluateCheckedJob(job, sourceResult, checkedAt) {
  const publicExposure = validateJobPublicExposure(
    {
      ...job,
      status: "active",
    },
    {
      sourceTruth: {
        sourceOk: sourceResult.ok,
        titleMatched: sourceResult.titleMatched,
        companyMatched: sourceResult.companyMatched,
        closureDetected: sourceResult.closureDetected,
        applyDetected: sourceResult.applyDetected,
      },
    },
  );
  const result = publicExposure.ok
    ? sourceResult
    : {
        ...sourceResult,
        ok: false,
        reason: "public_exposure_gate_failed",
        qualityErrors: publicExposure.errors,
      };
  const lifecycle = evaluateJobSourceLifecycle(
    {
      currentStatus: job.status,
      staleCheckCount: job.staleCheckCount,
      expiresAt: job.expiresAt,
      sourceOk: result.ok,
      titleMatched: result.titleMatched,
      companyMatched: result.companyMatched,
      closureDetected: result.closureDetected,
      applyDetected: result.applyDetected,
    },
    new Date(checkedAt),
  );
  const action =
    lifecycle.status === "active"
      ? job.status === "stale_pending_review"
        ? "reactivate"
        : "revalidate"
      : lifecycle.status === "closed"
        ? "close"
        : "stale";

  return {
    slug: job.slug,
    title: job.title,
    status: job.status,
    nextStatus: lifecycle.status,
    action,
    lifecycleReason: lifecycle.reason,
    ...result,
  };
}

export async function runJobSourceCheck(args) {
  const baseUrl = getBaseUrl(args);
  const apply = args.apply === "1";
  const failOnUnhealthy =
    args["fail-on-unhealthy"] === "1" ||
    (args["allow-unhealthy"] !== "1" && !apply);
  const entries = [
    ...(await fetchJobs(baseUrl, "active")),
    ...(await fetchJobs(baseUrl, "stale_pending_review")),
  ];
  const checkedAt = new Date().toISOString();
  const results = [];

  for (const job of entries) {
    const result = evaluateCheckedJob(job, await checkJob(job), checkedAt);
    results.push(result);
    if (apply) {
      await adminFetch(`${baseUrl}/api/admin/jobs`, {
        method: "PATCH",
        body: JSON.stringify({
          slug: job.slug,
          action: result.action,
          checkedAt,
        }),
      });
    }
  }

  const report = {
    checkedAt,
    baseUrl,
    count: results.length,
    apply,
    dryRun: !apply,
    summary: summarizeResults(results),
    results,
  };
  const serialized = JSON.stringify(report, null, 2);
  if (args.output) fs.writeFileSync(args.output, `${serialized}\n`);
  console.log(serialized);

  if (failOnUnhealthy && results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  await runJobSourceCheck(args);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
