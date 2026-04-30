import { getCloudflareContext } from "@opennextjs/cloudflare";

import { apiError, apiJson, createApiHandler } from "@/lib/api/router";
import { logApiError, logApiInfo, logApiWarn, sample } from "@/lib/api-logs";
import { siteConfig } from "@/lib/site";

const GITHUB_API_VERSION = "2022-11-28";
const REQUEST_TIMEOUT_MS = 5000;
const GITHUB_USER_AGENT = "heyclau.de-github-stats";

type GitHubStats = {
  stars: number | null;
  forks: number | null;
  updatedAt: string | null;
};

function parseRepo(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

function getGithubToken() {
  try {
    const { env } = getCloudflareContext();
    const envRecord = env as unknown as Record<string, unknown>;
    return String(
      envRecord["GITHUB_TOKEN"] ?? process.env.GITHUB_TOKEN ?? "",
    ).trim();
  } catch {
    return String(process.env.GITHUB_TOKEN ?? "").trim();
  }
}

async function fetchGitHubStats(
  owner: string,
  repo: string,
): Promise<GitHubStats> {
  const headers: HeadersInit = {
    accept: "application/vnd.github+json",
    "x-github-api-version": GITHUB_API_VERSION,
    "user-agent": GITHUB_USER_AGENT,
  };

  const token = getGithubToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`github_api_${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const stars =
    typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  const forks = typeof data.forks_count === "number" ? data.forks_count : null;
  const updatedAt =
    typeof data.updated_at === "string" ? data.updated_at : null;

  return { stars, forks, updatedAt };
}

function parseAbbreviatedCount(value: unknown) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return null;

  let numberText = "";
  let suffix = "";
  for (const char of text) {
    if ((char >= "0" && char <= "9") || char === ".") {
      numberText += char;
      continue;
    }
    if (char === "k" || char === "m" || char === "b") {
      suffix = char;
      break;
    }
  }

  const numeric = Number.parseFloat(numberText);
  if (!Number.isFinite(numeric)) return null;
  const multiplier =
    suffix === "b"
      ? 1_000_000_000
      : suffix === "m"
        ? 1_000_000
        : suffix === "k"
          ? 1_000
          : 1;
  return Math.round(numeric * multiplier);
}

async function fetchShieldsFallback(
  owner: string,
  repo: string,
): Promise<GitHubStats | null> {
  try {
    const response = await fetch(
      `https://img.shields.io/github/stars/${owner}/${repo}.json`,
      {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      value?: string;
      message?: string;
    };
    const raw = String(payload.value ?? payload.message ?? "").trim();
    const stars = parseAbbreviatedCount(raw);
    if (stars === null) return null;
    return { stars, forks: null, updatedAt: null };
  } catch {
    return null;
  }
}

export const GET = createApiHandler(
  "githubStats.read",
  async ({ request, requestId }) => {
    const repo = parseRepo(siteConfig.githubUrl);
    if (!repo) {
      logApiError(request, "github.stats.invalid_repo_url");
      return apiError("invalid_repo_url", 500, { requestId });
    }

    try {
      let payload = await fetchGitHubStats(repo.owner, repo.repo).catch(
        async () => {
          const fallback = await fetchShieldsFallback(repo.owner, repo.repo);
          if (!fallback) throw new Error("github_and_shields_failed");
          return fallback;
        },
      );

      if (sample(0.05)) {
        logApiInfo(request, "github.stats.sample", {
          stars: payload.stars,
          forks: payload.forks,
        });
      }

      return apiJson(
        {
          repo: `${repo.owner}/${repo.repo}`,
          ...payload,
        },
        {
          headers: {
            "cache-control":
              "public, max-age=300, s-maxage=21600, stale-while-revalidate=86400",
          },
        },
      );
    } catch (error) {
      logApiError(request, "github.stats.fetch_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return apiError("upstream_unavailable", 502, { requestId });
    }
  },
);
