import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  buildSubmissionIssueDraft,
  validateSubmission,
} from "@heyclaude/registry/submission";

import {
  getClientIp,
  hasBodyWithinLimit,
  hasJsonContentType,
  isAllowedOrigin,
  isRateLimited,
} from "@/lib/api-security";
import { logApiError, logApiInfo, logApiWarn } from "@/lib/api-logs";
import { getDirectoryEntries } from "@/lib/content";

const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPO = "JSONbored/claudepro-directory";
const SUBMISSION_RATE_LIMIT = 8;
const SUBMISSION_WINDOW_MS = 60_000;

type SubmissionPayload = {
  fields?: Record<string, unknown>;
  turnstileToken?: string;
  honeypot?: string;
};

function envValue(env: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = String(env[name] ?? process.env[name] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function getEnvRecord() {
  try {
    const { env } = getCloudflareContext();
    return env as unknown as Record<string, unknown>;
  } catch {
    return {};
  }
}

function githubIssueFallbackUrl(issue: { title: string; body: string }) {
  const url = new URL(`https://github.com/${DEFAULT_REPO}/issues/new`);
  url.searchParams.set("title", issue.title);
  url.searchParams.set("body", issue.body);
  return url.toString();
}

async function verifyTurnstile(params: {
  request: Request;
  token: string;
  secret: string;
}) {
  const { request, token, secret } = params;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false };

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  const ip = getClientIp(request);
  if (ip !== "unknown") body.set("remoteip", ip);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!response.ok) return { ok: false, skipped: false };
    const result = (await response.json()) as { success?: boolean };
    return { ok: result.success === true, skipped: false };
  } catch {
    return { ok: false, skipped: false };
  }
}

async function hasDuplicateEntry(category: string, slug: string) {
  try {
    const entries = await getDirectoryEntries();
    return entries.some(
      (entry) => entry.category === category && entry.slug === slug,
    );
  } catch {
    return false;
  }
}

async function createGitHubIssue(params: {
  repo: string;
  token: string;
  title: string;
  body: string;
  labels: string[];
}) {
  const response = await fetch(
    `https://api.github.com/repos/${params.repo}/issues`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${params.token}`,
        "content-type": "application/json",
        "x-github-api-version": GITHUB_API_VERSION,
      },
      body: JSON.stringify({
        title: params.title,
        body: params.body,
        labels: params.labels,
      }),
      signal: AbortSignal.timeout(8000),
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    html_url?: string;
    number?: number;
    message?: string;
  };

  return {
    ok: response.ok,
    status: response.status,
    issueUrl: String(body.html_url || ""),
    issueNumber: typeof body.number === "number" ? body.number : undefined,
    message: String(body.message || ""),
  };
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    logApiWarn(request, "submissions.forbidden_origin");
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  if (!hasBodyWithinLimit(request, 64 * 1024)) {
    logApiWarn(request, "submissions.payload_too_large");
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!hasJsonContentType(request)) {
    logApiWarn(request, "submissions.invalid_content_type");
    return NextResponse.json(
      { error: "invalid_content_type" },
      { status: 415 },
    );
  }

  if (
    isRateLimited({
      request,
      scope: "submissions",
      limit: SUBMISSION_RATE_LIMIT,
      windowMs: SUBMISSION_WINDOW_MS,
    })
  ) {
    logApiWarn(request, "submissions.rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: SubmissionPayload = {};
  try {
    payload = (await request.json()) as SubmissionPayload;
  } catch {
    logApiWarn(request, "submissions.invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (String(payload.honeypot ?? "").trim()) {
    logApiInfo(request, "submissions.honeypot_discarded");
    return NextResponse.json(
      { ok: true, queued: false },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const fields =
    payload.fields && typeof payload.fields === "object" ? payload.fields : {};
  const issue = buildSubmissionIssueDraft(fields);
  const report = validateSubmission({
    title: issue.title,
    body: issue.body,
    labels: issue.labels,
  });
  const fallbackUrl = githubIssueFallbackUrl(issue);

  if (report.skipped || !report.ok) {
    logApiWarn(request, "submissions.invalid_payload", {
      category: report.category,
      errors: report.errors,
    });
    return NextResponse.json(
      {
        error: "invalid_submission",
        errors: report.errors,
        warnings: report.warnings,
        fallbackUrl,
      },
      { status: 400 },
    );
  }

  const category = report.category;
  const slug = String(report.fields.slug || "");
  if (await hasDuplicateEntry(category, slug)) {
    logApiWarn(request, "submissions.duplicate_slug", { category, slug });
    return NextResponse.json(
      { error: "duplicate_slug", category, slug, fallbackUrl },
      { status: 409 },
    );
  }

  const env = getEnvRecord();
  const turnstileSecret = envValue(env, ["TURNSTILE_SECRET_KEY"]);
  const turnstile = await verifyTurnstile({
    request,
    token: String(payload.turnstileToken || ""),
    secret: turnstileSecret,
  });
  if (!turnstile.ok) {
    logApiWarn(request, "submissions.turnstile_failed", { category, slug });
    return NextResponse.json(
      { error: "turnstile_failed", fallbackUrl },
      { status: 400 },
    );
  }

  const token = envValue(env, [
    "GITHUB_SUBMISSIONS_TOKEN",
    "GITHUB_SUBMISSION_TOKEN",
    "GITHUB_TOKEN",
  ]);
  const repo =
    envValue(env, [
      "GITHUB_SUBMISSIONS_REPO",
      "GITHUB_SUBMISSION_REPO",
      "GITHUB_REPOSITORY",
    ]) || DEFAULT_REPO;

  if (!token) {
    logApiError(request, "submissions.github_not_configured", {
      category,
      slug,
    });
    return NextResponse.json(
      { error: "submissions_not_configured", fallbackUrl },
      { status: 503 },
    );
  }

  const created = await createGitHubIssue({
    repo,
    token,
    title: issue.title,
    body: issue.body,
    labels: issue.labels,
  });

  if (!created.ok) {
    logApiError(request, "submissions.github_provider_error", {
      category,
      slug,
      status: created.status,
    });
    return NextResponse.json(
      {
        error: "provider_error",
        status: created.status,
        fallbackUrl,
      },
      { status: 502 },
    );
  }

  logApiInfo(request, "submissions.issue_created", {
    category,
    slug,
    issueNumber: created.issueNumber,
  });
  return NextResponse.json(
    {
      ok: true,
      category,
      slug,
      issueUrl: created.issueUrl,
      issueNumber: created.issueNumber,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
