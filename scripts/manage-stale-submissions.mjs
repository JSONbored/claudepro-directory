import {
  buildSubmissionQueue,
  issueLabels,
  looksLikeSubmissionIssue,
  validateSubmission,
} from "@heyclaude/registry/submission";
import {
  SUBMISSION_NEEDS_AUTHOR_INPUT_LABEL,
  SUBMISSION_SOURCE_NEEDS_VERIFICATION_LABEL,
  SUBMISSION_STALE_LABEL,
  SUBMISSION_STALE_LABEL_DEFINITIONS,
} from "@heyclaude/registry/submission-labels";

const apiBaseUrl = "https://api.github.com";
const marker = "<!-- heyclaude-stale-submission -->";
const managedLabels = new Set([
  SUBMISSION_NEEDS_AUTHOR_INPUT_LABEL,
  SUBMISSION_SOURCE_NEEDS_VERIFICATION_LABEL,
  SUBMISSION_STALE_LABEL,
]);

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return "";
  return process.argv[idx + 1] ?? "";
}

function repoParts() {
  const raw = argValue("--repo") || process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = raw.split("/");
  if (!owner || !repo) {
    throw new Error("Set GITHUB_REPOSITORY or pass --repo owner/name.");
  }
  return { owner, repo };
}

async function githubJson(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required.");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "heyclaude-submission-stale-manager",
      "x-github-api-version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  if (response.status === 204) return null;
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(
      `GitHub API ${options.method || "GET"} ${path} failed with ${response.status}: ${text}`,
    );
  }
  return payload;
}

async function githubPaginate(path) {
  const output = [];
  for (let page = 1; ; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const payload = await githubJson(
      `${path}${separator}per_page=100&page=${page}`,
    );
    if (!Array.isArray(payload) || payload.length === 0) break;
    output.push(...payload);
    if (payload.length < 100) break;
  }
  return output;
}

async function ensureLabels(owner, repo) {
  for (const [name, definition] of Object.entries(
    SUBMISSION_STALE_LABEL_DEFINITIONS,
  )) {
    const path = `/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`;
    try {
      await githubJson(path, {
        method: "PATCH",
        body: JSON.stringify(definition),
      });
    } catch (error) {
      if (!String(error.message).includes("404")) throw error;
      await githubJson(`/repos/${owner}/${repo}/labels`, {
        method: "POST",
        body: JSON.stringify({ name, ...definition }),
      });
    }
  }
}

async function addLabels(owner, repo, issueNumber, labels) {
  if (!labels.length) return;
  await githubJson(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

async function listComments(owner, repo, issueNumber) {
  return githubPaginate(
    `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
  );
}

async function upsertReminder(owner, repo, issueNumber, body) {
  const comments = await listComments(owner, repo, issueNumber);
  const existing = comments.find((comment) => comment.body?.includes(marker));
  if (existing) {
    await githubJson(`/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    return;
  }
  await githubJson(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function closeIssue(owner, repo, issueNumber) {
  await githubJson(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({
      state: "closed",
      state_reason: "not_planned",
    }),
  });
}

function reminderBody(entry) {
  const lines = [
    marker,
    "Thanks for submitting this entry. The validation queue still needs author input before maintainers can review it for import.",
    "",
    "Please update the issue with the missing or corrected fields shown in the validation report. After you update the issue, the submission validator will rerun automatically.",
  ];
  if (entry.errors.length) {
    lines.push("", "Current blockers:");
    for (const error of entry.errors) lines.push(`- ${error}`);
  }
  lines.push(
    "",
    "If there is no update after the stale window, maintainers may close this issue as not planned. You can reopen or resubmit when the missing details are ready.",
  );
  return lines.join("\n");
}

function closeBody(entry) {
  const lines = [
    marker,
    "Closing this submission as not planned because it has been waiting on author input past the stale window.",
    "",
    "This is not a rejection of the project. Please reopen this issue or submit a new one when the missing fields or source details are ready.",
  ];
  if (entry.errors.length) {
    lines.push("", "Last known blockers:");
    for (const error of entry.errors) lines.push(`- ${error}`);
  }
  return lines.join("\n");
}

function normalizeIssue(issue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body || "",
    url: issue.html_url,
    updatedAt: issue.updated_at,
    createdAt: issue.created_at,
    author: issue.user?.login || "",
    labels: issue.labels || [],
  };
}

async function urlNeedsVerification(url) {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      if (response.status === 405 || response.status === 403) {
        response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
        });
      }
      return response.status === 404 || response.status === 410;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return false;
  }
}

async function submissionSourceCheckLabels(issue) {
  const report = validateSubmission(issue);
  const urls = [
    report.fields.github_url,
    report.fields.docs_url,
    report.fields.download_url,
  ].filter(Boolean);
  for (const url of urls) {
    if (await urlNeedsVerification(url)) {
      return [SUBMISSION_SOURCE_NEEDS_VERIFICATION_LABEL];
    }
  }
  return [];
}

async function main() {
  const apply = hasFlag("--apply");
  const now = argValue("--now") || new Date().toISOString();
  const { owner, repo } = repoParts();
  const issues = (
    await githubPaginate(`/repos/${owner}/${repo}/issues?state=open`)
  )
    .filter((issue) => !issue.pull_request)
    .map(normalizeIssue)
    .filter(looksLikeSubmissionIssue);
  const queue = buildSubmissionQueue(issues, { now });
  const issuesByNumber = new Map(issues.map((issue) => [issue.number, issue]));

  if (apply) await ensureLabels(owner, repo);

  const actions = [];
  for (const entry of queue.entries) {
    const existingLabels = new Set(entry.labels);
    const sourceCheckLabels = entry.number
      ? await submissionSourceCheckLabels(issuesByNumber.get(entry.number))
      : [];
    const labels = new Set([...entry.recommendedLabels, ...sourceCheckLabels]);
    const nextLabels = [...labels].filter(
      (label) => managedLabels.has(label) && !existingLabels.has(label),
    );
    const staleDue =
      entry.status === "stale_reminder_due" ||
      entry.status === "close_eligible";
    const shouldRemind =
      staleDue && !existingLabels.has(SUBMISSION_STALE_LABEL);
    const shouldClose = staleDue && existingLabels.has(SUBMISSION_STALE_LABEL);

    actions.push({
      issue: entry.number,
      status: entry.status,
      labels: nextLabels,
      remind: shouldRemind,
      close: shouldClose,
    });

    if (!apply || !entry.number) continue;
    await addLabels(owner, repo, entry.number, nextLabels);
    if (shouldRemind) {
      await upsertReminder(owner, repo, entry.number, reminderBody(entry));
    }
    if (shouldClose) {
      await upsertReminder(owner, repo, entry.number, closeBody(entry));
      await closeIssue(owner, repo, entry.number);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: apply ? "apply" : "dry-run",
        now,
        count: queue.count,
        summary: queue.summary,
        actions,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
