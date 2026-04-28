#!/usr/bin/env node
import { evaluateJobSourceLifecycle } from "@heyclaude/registry/commercial";

function usage() {
  console.log(`Usage:
  pnpm jobs:check-sources -- --base-url https://dev.example.com [--apply]

Checks active and stale D1 jobs through the token-protected admin API. With
--apply, the script revalidates active jobs, reactivates healthy stale jobs,
marks first failures stale, and closes repeated failures.`);
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
      process.env.HEYCLOUD_ADMIN_BASE_URL ||
      process.env.HEYCLOUD_BASE_URL ||
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

function containsClosurePhrase(text) {
  return [
    "job is no longer available",
    "position has been filled",
    "this role is closed",
    "no longer accepting applications",
    "not accepting applications",
  ].some((phrase) => text.includes(phrase));
}

function hasApplySignal(text) {
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

function includesToken(text, value) {
  const token = String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .find((item) => item.length >= 3);
  return token ? text.includes(token) : true;
}

async function checkJob(job) {
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = getBaseUrl(args);
  const apply = args.apply === "1";
  const entries = [
    ...(await fetchJobs(baseUrl, "active")),
    ...(await fetchJobs(baseUrl, "stale_pending_review")),
  ];
  const checkedAt = new Date().toISOString();
  const results = [];

  for (const job of entries) {
    const result = await checkJob(job);
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
    results.push({
      slug: job.slug,
      title: job.title,
      status: job.status,
      nextStatus: lifecycle.status,
      action,
      lifecycleReason: lifecycle.reason,
      ...result,
    });
    if (apply) {
      await adminFetch(`${baseUrl}/api/admin/jobs`, {
        method: "PATCH",
        body: JSON.stringify({
          slug: job.slug,
          action,
          checkedAt,
        }),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        checkedAt,
        count: results.length,
        apply,
        results,
      },
      null,
      2,
    ),
  );

  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
