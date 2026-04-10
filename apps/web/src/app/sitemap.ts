import type { MetadataRoute } from "next";

import { getDirectoryEntries } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getDirectoryEntries();
  const staticPaths = [
    "",
    "/browse",
    "/about",
    "/jobs",
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

  return [...staticItems, ...entryItems];
}
