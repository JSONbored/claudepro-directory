import type { MetadataRoute } from "next";

import { getDirectoryEntries } from "@/lib/content";
import { getContributors } from "@/lib/contributors";
import { getJobs } from "@/lib/jobs";
import { getSeoClusterDefinitions } from "@/lib/seo-clusters";
import { getTools } from "@/lib/tools";
import { siteConfig } from "@/lib/site";
import {
  isSitemapIndexableEntry,
  safeSitemapDate,
  sitemapEntryLastModified,
} from "@/lib/sitemap-policy";

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
    "/quality",
    "/trending",
    "/llms.txt",
    "/llms-full.txt",
    "/feed.xml",
    ...getSeoClusterDefinitions().map((cluster) => `/best/${cluster.slug}`),
    ...siteConfig.categoryOrder
      .filter((category) => category !== "tools")
      .map((category) => `/${category}`),
  ];

  const staticItems = staticPaths.map((pathname) => ({
    url: `${siteConfig.url}${pathname}`,
    lastModified: new Date(),
    changeFrequency:
      pathname.includes(".txt") || pathname.includes(".xml")
        ? ("daily" as const)
        : ("weekly" as const),
    priority: pathname === "" ? 1 : pathname === "/browse" ? 0.9 : 0.7,
  }));

  const entryItems = entries.filter(isSitemapIndexableEntry).map((entry) => ({
    url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
    lastModified: sitemapEntryLastModified(entry),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const entryLlmsItems = entries
    .filter(isSitemapIndexableEntry)
    .map((entry) => ({
      url: `${siteConfig.url}/${entry.category}/${entry.slug}/llms.txt`,
      lastModified: sitemapEntryLastModified(entry),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  const jobItems = jobs.map((job) => ({
    url: `${siteConfig.url}/jobs/${job.slug}`,
    lastModified: safeSitemapDate(job.postedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const toolItems = tools.map((tool) => ({
    url: `${siteConfig.url}/tools/${tool.slug}`,
    lastModified: safeSitemapDate(tool.dateAdded),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const contributorItems = contributors.map((contributor) => ({
    url: `${siteConfig.url}/contributors/${contributor.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
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
