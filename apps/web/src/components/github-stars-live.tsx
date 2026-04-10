"use client";

import { useEffect, useState } from "react";

import { compactCount } from "@/lib/entry-presentation";

type GitHubStatsResponse = {
  stars?: number | null;
};

let cachedStars: number | null = null;
let inFlight: Promise<number | null> | null = null;

async function loadStars() {
  if (cachedStars !== null) return cachedStars;
  if (inFlight) return inFlight;

  inFlight = fetch("/api/github-stats", {
    method: "GET",
    cache: "force-cache"
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = (await response.json()) as GitHubStatsResponse;
      const stars = typeof payload.stars === "number" ? payload.stars : null;
      if (stars !== null) cachedStars = stars;
      return stars;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function GitHubStarsLive({
  fallback = 0,
  withPlus = false
}: {
  fallback?: number;
  withPlus?: boolean;
}) {
  const [stars, setStars] = useState<number>(fallback);

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

  const compact = compactCount(Math.max(stars, 0));
  return <>{withPlus ? `${compact}+` : compact}</>;
}
