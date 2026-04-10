import type { MetadataRoute } from "next";

import { getDirectoryEntries } from "@/lib/content";
import { getJobs } from "@/lib/jobs";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, jobs] = await Promise.all([getDirectoryEntries(), getJobs()]);
  const staticPaths = [
    "",
    "/browse",
    "/about",
    "/jobs",
    "/jobs/post",
    "/submit",
    "/advertise",
    ...siteConfig.categoryOrder.map((category) => `/${category}`)
  ];

  const staticItems = staticPaths.map((pathname) => ({
    url: `${siteConfig.url}${pathname}`,
    lastModified: new Date()
  }));

  const entryItems = entries.map((entry) => ({
    url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
    lastModified: entry.dateAdded ? new Date(entry.dateAdded) : undefined
  }));

  const jobItems = jobs.map((job) => ({
    url: `${siteConfig.url}/jobs/${job.slug}`,
    lastModified: job.postedAt ? new Date(job.postedAt) : undefined
  }));

  return [...staticItems, ...entryItems, ...jobItems];
}
