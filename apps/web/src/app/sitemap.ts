import type { MetadataRoute } from "next";

import { getAllEntries } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllEntries();
  const staticPages = ["", "/browse", "/jobs", "/advertise", "/submit"];

  return [
    ...staticPages.map((path) => ({
      url: `${siteConfig.url}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8
    })),
    ...entries.map((entry) => ({
      url: `${siteConfig.url}/${entry.category}/${entry.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
