import type { MetadataRoute } from "next";

import { getDirectoryEntries } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getDirectoryEntries();

  return [
    "",
    "/browse",
    "/about",
    "/jobs",
    "/submit",
    "/advertise",
    ...entries.map((entry) => `/${entry.category}/${entry.slug}`)
  ].map((pathname) => ({
    url: `${siteConfig.url}${pathname}`
  }));
}
