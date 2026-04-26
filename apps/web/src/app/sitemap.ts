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
    "/llms.txt",
    "/llms-full.txt",
    ...siteConfig.categoryOrder.map((category) => `/${category}`)
  ];

  const staticItems = staticPaths.map((pathname) => ({
    url: `${siteConfig.url}${pathname}`
  }));

  const entryItems = entries.map((entry) => ({
    url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
    lastModified:
      entry.dateAdded && !Number.isNaN(new Date(entry.dateAdded).getTime())
        ? new Date(entry.dateAdded)
        : undefined
  }));
  const entryLlmsItems = entries.map((entry) => ({
    url: `${siteConfig.url}/${entry.category}/${entry.slug}/llms.txt`
  }));

  const jobItems = jobs
    .filter((job) => !job.isPlaceholder)
    .map((job) => ({
      url: `${siteConfig.url}/jobs/${job.slug}`,
      lastModified:
        job.postedAt && !Number.isNaN(new Date(job.postedAt).getTime())
          ? new Date(job.postedAt)
          : undefined
    }));

  return [...staticItems, ...entryItems, ...entryLlmsItems, ...jobItems];
}
