import {
  Action,
  ActionPanel,
  Cache,
  Clipboard,
  Color,
  Icon,
  List,
  LocalStorage,
  Toast,
  getPreferenceValues,
  showToast,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import {
  FAVORITE_JOBS_KEY,
  buildJobMarkdown,
  buildJobSummary,
  buildPostJobUrl,
  filterJobs,
  jobKey,
  parseFavoriteJobKeys,
  resolveJobsUrl,
  serializeFavoriteJobKeys,
  sortedJobFilterOptions,
  type RaycastJob,
} from "./jobs-feed";
import {
  fetchFreshJobs,
  loadCachedJobs as loadCachedJobsFromRuntime,
} from "./jobs-runtime";

const cache = new Cache();

type JobsPreferences = {
  feedUrlOverride?: string;
};

function getConfiguredJobs() {
  const preferences = getPreferenceValues<JobsPreferences>();
  try {
    const jobsUrl = resolveJobsUrl(preferences.feedUrlOverride);
    return {
      jobsUrl,
      feedUrlOverride: preferences.feedUrlOverride,
      error: "",
    };
  } catch (error) {
    return {
      jobsUrl: "",
      feedUrlOverride: preferences.feedUrlOverride,
      error:
        error instanceof Error ? error.message : "Feed override was invalid",
    };
  }
}

function loadCachedJobs(jobsUrl: string) {
  return loadCachedJobsFromRuntime(cache, jobsUrl);
}

async function loadFavoriteJobs() {
  const raw = await LocalStorage.getItem<string>(FAVORITE_JOBS_KEY);
  if (!raw) return new Set<string>();

  try {
    return new Set(parseFavoriteJobKeys(raw));
  } catch {
    await LocalStorage.removeItem(FAVORITE_JOBS_KEY);
    return new Set<string>();
  }
}

async function persistFavoriteJobs(favorites: Set<string>) {
  await LocalStorage.setItem(
    FAVORITE_JOBS_KEY,
    serializeFavoriteJobKeys(favorites),
  );
}

function jobIcon(job: RaycastJob) {
  if (job.sponsored || job.featured) return Icon.Star;
  return Icon.Document;
}

function jobAccessories(job: RaycastJob, isFavorite: boolean) {
  const accessories: List.Item.Accessory[] = [
    { text: job.location },
    { text: job.compensation ? "Comp listed" : job.type || "Role" },
  ];

  if (isFavorite) {
    accessories.unshift({
      icon: { source: Icon.Star, tintColor: Color.Yellow },
    });
  }
  if (job.sponsored) {
    accessories.push({ text: "Sponsored" });
  } else if (job.featured) {
    accessories.push({ text: "Featured" });
  }
  if (job.claimedEmployer) {
    accessories.push({
      icon: { source: Icon.CheckCircle, tintColor: Color.Green },
    });
  }

  return accessories;
}

export default function Command() {
  const configuredJobs = getConfiguredJobs();
  const cachedJobs = configuredJobs.error
    ? { entries: [], generatedAt: "", count: 0 }
    : loadCachedJobs(configuredJobs.jobsUrl);
  const [jobs, setJobs] = useState<RaycastJob[]>(cachedJobs.entries);
  const [generatedAt, setGeneratedAt] = useState(cachedJobs.generatedAt);
  const [isLoading, setIsLoading] = useState(
    !configuredJobs.error && jobs.length === 0,
  );
  const [filter, setFilter] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  async function refreshJobs(showSuccess = false) {
    if (configuredJobs.error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid feed override",
        message: configuredJobs.error,
      });
      return;
    }

    setIsLoading(true);
    try {
      const nextFeed = await fetchFreshJobs({
        cache,
        feedUrlOverride: configuredJobs.feedUrlOverride,
      });
      setJobs(nextFeed.entries);
      setGeneratedAt(nextFeed.generatedAt);
      if (showSuccess) {
        await showToast({
          style: Toast.Style.Success,
          title: "HeyClaude jobs refreshed",
          message: `${nextFeed.entries.length} active jobs`,
        });
      }
    } catch (error) {
      if (jobs.length === 0 || showSuccess) {
        await showToast({
          style: Toast.Style.Failure,
          title: showSuccess ? "Could not refresh jobs" : "Could not load jobs",
          message:
            error instanceof Error ? error.message : "Unknown jobs feed error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshJobs(false);
    // Run only once on command open. Manual refresh is exposed as an action.
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeFavorites() {
      const loaded = await loadFavoriteJobs();
      if (!cancelled) setFavorites(loaded);
    }

    void initializeFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(() => sortedJobFilterOptions(), []);
  const displayedJobs = useMemo(
    () => filterJobs(jobs, filter, favorites),
    [filter, jobs, favorites],
  );

  async function copyRoleSummary(job: RaycastJob) {
    await Clipboard.copy(buildJobSummary(job));
    await showToast({
      style: Toast.Style.Success,
      title: "Copied role summary",
      message: job.title,
    });
  }

  async function toggleFavorite(job: RaycastJob) {
    const key = jobKey(job);
    const next = new Set(favorites);
    const isFavorite = next.has(key);

    if (isFavorite) next.delete(key);
    else next.add(key);

    setFavorites(next);
    await persistFavoriteJobs(next);
    await showToast({
      style: Toast.Style.Success,
      title: isFavorite ? "Removed favorite" : "Added favorite",
      message: job.title,
    });
  }

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Search Claude, MCP, AI, and agent jobs..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Filter jobs"
          value={filter}
          onChange={setFilter}
        >
          {filterOptions.map((option) => (
            <List.Dropdown.Item
              key={option.value}
              value={option.value}
              title={option.title}
            />
          ))}
        </List.Dropdown>
      }
    >
      {configuredJobs.error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Invalid feed URL override"
          description={configuredJobs.error}
        />
      ) : null}
      {displayedJobs.map((job) => {
        const isFavorite = favorites.has(jobKey(job));
        const detailMarkdown = buildJobMarkdown(job, generatedAt);

        return (
          <List.Item
            key={jobKey(job)}
            title={job.title}
            subtitle={job.company}
            keywords={[
              job.company,
              job.location,
              job.type || "",
              job.compensation || "",
              job.sourceLabel,
              ...(job.labels ?? []),
            ].filter(Boolean)}
            icon={jobIcon(job)}
            accessories={jobAccessories(job, isFavorite)}
            detail={<List.Item.Detail markdown={detailMarkdown} />}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  title="Apply on Employer Site"
                  url={job.applyUrl}
                  icon={Icon.ArrowRight}
                  shortcut={{ modifiers: ["cmd"], key: "return" }}
                />
                <Action.OpenInBrowser
                  title="Open on HeyClaude"
                  url={job.webUrl}
                  icon={Icon.Globe}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
                <Action
                  title="Copy Role Summary"
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                  onAction={() => void copyRoleSummary(job)}
                />
                <Action.CopyToClipboard
                  title="Copy Apply URL"
                  content={job.applyUrl}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
                {job.companyUrl ? (
                  <Action.OpenInBrowser
                    title="Open Company Site"
                    url={job.companyUrl}
                  />
                ) : null}
                {job.sourceUrl ? (
                  <Action.OpenInBrowser
                    title="Open Source Listing"
                    url={job.sourceUrl}
                  />
                ) : null}
                <Action.OpenInBrowser
                  title="Post a Job"
                  url={buildPostJobUrl(configuredJobs.jobsUrl)}
                  icon={Icon.Plus}
                />
                <Action
                  title={isFavorite ? "Remove Favorite" : "Add Favorite"}
                  icon={isFavorite ? Icon.StarDisabled : Icon.Star}
                  shortcut={{ modifiers: ["cmd"], key: "f" }}
                  onAction={() => void toggleFavorite(job)}
                />
                <ActionPanel.Section>
                  <Action
                    title="Refresh Jobs"
                    icon={Icon.ArrowClockwise}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                    onAction={() => void refreshJobs(true)}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
      {!isLoading && displayedJobs.length === 0 ? (
        <List.EmptyView
          icon={Icon.Document}
          title={
            filter === "favorites" ? "No favorite jobs yet" : "No jobs found"
          }
          description={
            filter === "favorites"
              ? "Add favorite roles from any job listing to keep them here."
              : "Try another query or filter, or post a role for review."
          }
          actions={
            <ActionPanel>
              <Action
                title="Refresh Jobs"
                icon={Icon.ArrowClockwise}
                onAction={() => void refreshJobs(true)}
              />
              <Action.OpenInBrowser
                title="Post a Job"
                url={
                  configuredJobs.jobsUrl
                    ? buildPostJobUrl(configuredJobs.jobsUrl)
                    : "https://heyclau.de/jobs/post"
                }
                icon={Icon.Plus}
              />
            </ActionPanel>
          }
        />
      ) : null}
    </List>
  );
}
