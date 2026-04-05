import type { MetadataRoute } from "next";

import { getAllEntries } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllEntries();

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
