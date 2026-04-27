import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // This directory is fully pre-rendered and does not rely on ISR/path/tag revalidation.
  // Keep cache backend as "dummy" (OpenNext default) to avoid generating large
  // static incremental-cache assets that can exceed Workers' 25 MiB per-asset limit.
  enableCacheInterception: false,
});
