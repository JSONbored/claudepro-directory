import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: Metadata["robots"];
};

function normalizePath(path: string) {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path: string) {
  const normalized = normalizePath(path);
  return new URL(normalized, siteConfig.url).toString();
}

function toTwitterHandle(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "x.com" && parsed.hostname !== "twitter.com") return undefined;
    const handle = parsed.pathname.split("/").filter(Boolean)[0];
    if (!handle) return undefined;
    return `@${handle.replace(/^@/, "")}`;
  } catch {
    return undefined;
  }
}

const twitterCreator = toTwitterHandle(siteConfig.twitterUrl);
const defaultSocialImage = absoluteUrl("/og-image.png");

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const title = input.title.trim();
  const description = input.description.trim();

  return {
    title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: defaultSocialImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} Claude directory`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: twitterCreator,
      images: [defaultSocialImage]
    },
    robots: input.robots
  };
}
