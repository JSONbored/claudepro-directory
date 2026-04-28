#!/usr/bin/env node
function usage() {
  console.log(`Usage:
  pnpm jobs:check-sources -- --base-url https://dev.example.com [--apply]

Checks active D1 jobs through the token-protected admin API. With --apply, the
script marks failed checks stale and revalidates successful checks.`);
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
      process.env.HEYCLOUD_ADMIN_BASE_URL ||
      process.env.HEYCLOUD_BASE_URL ||
      "",
  ).trim();
  if (!baseUrl) {
    throw new Error("Missing --base-url or HEYCLOUD_ADMIN_BASE_URL.");
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

async function checkJob(job) {
  const targetUrl = job.sourceUrl || job.applyUrl;
  if (!targetUrl || !targetUrl.startsWith("https://")) {
    return { ok: false, reason: "missing_https_source" };
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { "user-agent": "HeyClaude job source checker" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, reason: `http_${response.status}` };
    const text = (await response.text()).toLowerCase();
    const title = String(job.title || "").toLowerCase();
    const company = String(job.company || "").toLowerCase();
    if (containsClosurePhrase(text))
      return { ok: false, reason: "closed_copy" };
    if (title && !text.includes(title.split(/\s+/)[0])) {
      return { ok: false, reason: "title_not_found" };
    }
    if (company && !text.includes(company.split(/\s+/)[0])) {
      return { ok: false, reason: "company_not_found" };
    }
    return { ok: true, reason: "source_available" };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "fetch_failed",
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = getBaseUrl(args);
  const apply = args.apply === "1";
  const url = new URL(`${baseUrl}/api/admin/jobs`);
  url.searchParams.set("status", "active");
  url.searchParams.set("limit", "100");

  const payload = await adminFetch(url.toString());
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  const checkedAt = new Date().toISOString();
  const results = [];

  for (const job of entries) {
    const result = await checkJob(job);
    results.push({ slug: job.slug, title: job.title, ...result });
    if (apply) {
      await adminFetch(`${baseUrl}/api/admin/jobs`, {
        method: "PATCH",
        body: JSON.stringify({
          slug: job.slug,
          action: result.ok ? "revalidate" : "stale",
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
