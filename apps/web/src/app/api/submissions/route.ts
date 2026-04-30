import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  buildSubmissionIssueDraft,
  validateSubmission,
} from "@heyclaude/registry/submission";

import { submissionBodySchema } from "@/lib/api/contracts";
import { getClientIp } from "@/lib/api-security";
import {
  apiError,
  apiJson,
  createApiHandler,
  type InferApiBody,
} from "@/lib/api/router";
import { logApiError, logApiInfo, logApiWarn } from "@/lib/api-logs";
import { getDirectoryEntries } from "@/lib/content";

const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPO = "JSONbored/claudepro-directory";
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

async function findPendingSubmissionIssue(params: {
  repo: string;
  token: string;
  category: string;
  slug: string;
}) {
  const query = [
    `repo:${params.repo}`,
    "is:issue",
    "is:open",
    "label:content-submission",
    `"${params.slug}"`,
  ].join(" ");
  const url = new URL("https://api.github.com/search/issues");
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", "10");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${params.token}`,
        "x-github-api-version": GITHUB_API_VERSION,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as {
      items?: Array<{
        html_url?: string;
        number?: number;
        title?: string;
        body?: string;
        pull_request?: unknown;
      }>;
    };
    const needleSlug = params.slug.toLowerCase();
    const needleCategory = params.category.toLowerCase();
    const duplicate = payload.items?.find((item) => {
      if (item.pull_request) return false;
      const haystack = `${item.title || ""}\n${item.body || ""}`.toLowerCase();
      return haystack.includes(needleSlug) && haystack.includes(needleCategory);
    });

    return duplicate
      ? {
          issueUrl: String(duplicate.html_url || ""),
          issueNumber:
            typeof duplicate.number === "number" ? duplicate.number : undefined,
        }
      : null;
  } catch {
    return null;
  }
}

function requiresTurnstile(env: Record<string, unknown>) {
  const value = envValue(env, [
    "SUBMISSIONS_REQUIRE_TURNSTILE",
    "REQUIRE_TURNSTILE",
  ]).toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export const POST = createApiHandler(
  "submissions.create",
  async ({ request, body, requestId }) => {
    const payload = body as InferApiBody<typeof submissionBodySchema>;
    if (String(payload.honeypot ?? "").trim()) {
      logApiInfo(request, "submissions.honeypot_discarded");
      return apiJson(
        { ok: true, queued: false },
        { headers: { "cache-control": "no-store" } },
      );
    }

    const fields =
      payload.fields && typeof payload.fields === "object"
        ? payload.fields
        : {};
    const issue = buildSubmissionIssueDraft({
      ...fields,
      submitted_via: "website",
    });
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
      return apiError("invalid_submission", 400, {
        requestId,
        details: {
          errors: report.errors,
          warnings: report.warnings,
          fallbackUrl,
        },
      });
    }

    const category = report.category;
    const slug = String(report.fields.slug || "");
    if (await hasDuplicateEntry(category, slug)) {
      logApiWarn(request, "submissions.duplicate_slug", { category, slug });
      return apiError("duplicate_slug", 409, {
        requestId,
        details: { category, slug, fallbackUrl },
      });
    }

    const env = getEnvRecord();
    const turnstileSecret = envValue(env, ["TURNSTILE_SECRET_KEY"]);
    if (!turnstileSecret && requiresTurnstile(env)) {
      logApiError(request, "submissions.turnstile_not_configured", {
        category,
        slug,
      });
      return apiError("turnstile_not_configured", 503, {
        requestId,
        details: { fallbackUrl },
      });
    }

    const turnstile = await verifyTurnstile({
      request,
      token: String(payload.turnstileToken || ""),
      secret: turnstileSecret,
    });
    if (!turnstile.ok) {
      logApiWarn(request, "submissions.turnstile_failed", { category, slug });
      return apiError("turnstile_failed", 400, {
        requestId,
        details: { fallbackUrl },
      });
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
      return apiError("submissions_not_configured", 503, {
        requestId,
        details: { fallbackUrl },
      });
    }

    const pendingDuplicate = await findPendingSubmissionIssue({
      repo,
      token,
      category,
      slug,
    });
    if (pendingDuplicate) {
      logApiWarn(request, "submissions.duplicate_pending_issue", {
        category,
        slug,
        issueNumber: pendingDuplicate.issueNumber,
      });
      return apiError("duplicate_pending_issue", 409, {
        requestId,
        details: {
          category,
          slug,
          issueUrl: pendingDuplicate.issueUrl,
          issueNumber: pendingDuplicate.issueNumber,
          fallbackUrl,
        },
      });
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
      return apiError("provider_error", 502, {
        requestId,
        details: {
          status: created.status,
          fallbackUrl,
        },
      });
    }

    logApiInfo(request, "submissions.issue_created", {
      category,
      slug,
      issueNumber: created.issueNumber,
    });
    return apiJson(
      {
        ok: true,
        category,
        slug,
        issueUrl: created.issueUrl,
        issueNumber: created.issueNumber,
      },
      { headers: { "cache-control": "no-store" } },
    );
  },
);
