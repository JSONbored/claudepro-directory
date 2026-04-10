"use client";

import { useEffect, useState } from "react";

import { compactCount } from "@/lib/entry-presentation";
import { siteConfig } from "@/lib/site";

type GitHubStatsResponse = {
  stars?: number | null;
};

let cachedStars: number | null | undefined;
let inFlight: Promise<number | null> | null = null;

function parseGitHubRepoPath(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com") return null;
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return `${owner}/${repo.replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}

async function fetchStarsFromShields() {
  const repoPath = parseGitHubRepoPath(siteConfig.githubUrl);
  if (!repoPath) return null;

  try {
    const response = await fetch(`https://img.shields.io/github/stars/${repoPath}.json`, {
      method: "GET",
      cache: "force-cache"
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { value?: string; message?: string };
    const raw = String(payload.value ?? payload.message ?? "").trim();
    const numeric = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? Math.round(numeric) : null;
  } catch {
    return null;
  }
}

async function fetchStarsFromGitHub() {
  const repoPath = parseGitHubRepoPath(siteConfig.githubUrl);
  if (!repoPath) return null;

  try {
    const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
      method: "GET",
      cache: "force-cache",
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28"
      }
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { stargazers_count?: number };
    return typeof payload.stargazers_count === "number" ? payload.stargazers_count : null;
  } catch {
    return null;
  }
}

async function loadStars() {
  if (cachedStars !== undefined) return cachedStars;
  if (inFlight) return inFlight;

  inFlight = fetch("/api/github-stats", {
    method: "GET",
    cache: "force-cache"
  })
    .then(async (response) => {
      let stars: number | null = null;
      if (response.ok) {
        const payload = (await response.json()) as GitHubStatsResponse;
        stars = typeof payload.stars === "number" ? payload.stars : null;
      }
      if (stars === null) stars = await fetchStarsFromShields();
      if (stars === null) stars = await fetchStarsFromGitHub();
      cachedStars = stars;
      return stars;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function GitHubStarsLive({
  fallback = null,
  withPlus = false
}: {
  fallback?: number | null;
  withPlus?: boolean;
}) {
  const [stars, setStars] = useState<number | null>(fallback);

  useEffect(() => {
    let cancelled = false;
    void loadStars().then((value) => {
      if (cancelled || value === null) return;
      setStars(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (stars === null) return <>…</>;
  const compact = compactCount(Math.max(stars, 0));
  return <>{withPlus ? `${compact}+` : compact}</>;
}
