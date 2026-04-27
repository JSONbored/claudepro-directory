import "server-only";

import { cache } from "react";

import { getDirectoryEntries } from "@/lib/content";

export const getGrowthSurfaces = cache(async () => {
  const entries = await getDirectoryEntries();
  const newest = [...entries]
    .filter((entry) => entry.dateAdded)
    .sort((left, right) =>
      String(right.dateAdded).localeCompare(String(left.dateAdded)),
    )
    .slice(0, 12);
  const recentlyUpdated = [...entries]
    .filter((entry) => entry.repoUpdatedAt)
    .sort((left, right) =>
      String(right.repoUpdatedAt).localeCompare(String(left.repoUpdatedAt)),
    )
    .slice(0, 12);
  const popularBySourceSignals = [...entries]
    .filter((entry) => typeof entry.githubStars === "number")
    .sort((left, right) => (right.githubStars ?? 0) - (left.githubStars ?? 0))
    .slice(0, 12);
  const trendingCandidates = [...entries]
    .filter(
      (entry) =>
        Boolean(
          entry.installCommand || entry.downloadUrl || entry.configSnippet,
        ) && Boolean(entry.dateAdded),
    )
    .sort((left, right) => {
      const rightScore =
        (right.githubStars ?? 0) +
        (right.downloadTrust === "first-party" ? 25 : 0) +
        (right.verificationStatus === "production" ? 20 : 0);
      const leftScore =
        (left.githubStars ?? 0) +
        (left.downloadTrust === "first-party" ? 25 : 0) +
        (left.verificationStatus === "production" ? 20 : 0);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return String(right.dateAdded).localeCompare(String(left.dateAdded));
    })
    .slice(0, 12);

  return {
    newest,
    recentlyUpdated,
    popularBySourceSignals,
    trendingCandidates,
  };
});
