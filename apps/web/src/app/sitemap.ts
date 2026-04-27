import type { MetadataRoute } from "next";

import { getDirectoryEntries } from "@/lib/content";
import { getContributors } from "@/lib/contributors";
import { getJobs } from "@/lib/jobs";
import { getSeoClusterDefinitions } from "@/lib/seo-clusters";
import { getTools } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, jobs, tools, contributors] = await Promise.all([
    getDirectoryEntries(),
    getJobs(),
    getTools(),
    getContributors(),
  ]);
  const staticPaths = [
    "",
    "/browse",
    "/about",
    "/tools",
    "/tools/submit",
    "/jobs",
    "/jobs/post",
    "/submit",
    "/submissions",
    "/advertise",
    "/api-docs",
    "/claim",
    "/contributors",
    "/ecosystem",
    "/trending",
    "/llms.txt",
    "/llms-full.txt",
    ...getSeoClusterDefinitions().map((cluster) => `/best/${cluster.slug}`),
    ...siteConfig.categoryOrder
      .filter((category) => category !== "tools")
      .map((category) => `/${category}`),
  ];

  const staticItems = staticPaths.map((pathname) => ({
    url: `${siteConfig.url}${pathname}`,
  }));

  const entryItems = entries
    .filter((entry) => entry.category !== "tools")
    .map((entry) => ({
      url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
      lastModified:
        entry.dateAdded && !Number.isNaN(new Date(entry.dateAdded).getTime())
          ? new Date(entry.dateAdded)
          : undefined,
    }));
  const entryLlmsItems = entries
    .filter((entry) => entry.category !== "tools")
    .map((entry) => ({
      url: `${siteConfig.url}/${entry.category}/${entry.slug}/llms.txt`,
    }));

  const jobItems = jobs.map((job) => ({
    url: `${siteConfig.url}/jobs/${job.slug}`,
    lastModified:
      job.postedAt && !Number.isNaN(new Date(job.postedAt).getTime())
        ? new Date(job.postedAt)
        : undefined,
  }));

  const toolItems = tools.map((tool) => ({
    url: `${siteConfig.url}/tools/${tool.slug}`,
    lastModified:
      tool.dateAdded && !Number.isNaN(new Date(tool.dateAdded).getTime())
        ? new Date(tool.dateAdded)
        : undefined,
  }));

  const contributorItems = contributors.map((contributor) => ({
    url: `${siteConfig.url}/contributors/${contributor.slug}`,
  }));

  return [
    ...staticItems,
    ...entryItems,
    ...entryLlmsItems,
    ...jobItems,
    ...toolItems,
    ...contributorItems,
  ];
}
