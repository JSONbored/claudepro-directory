export const SITE_URL: "https://heyclau.de";

export function platformFeedSlug(platform: string): string;

export function buildSkillPlatformCompatibility(entry: {
  category?: string;
  slug?: string;
  platformCompatibility?: unknown[];
}): unknown[];
