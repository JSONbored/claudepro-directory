import { loadTextDataFile } from "@/lib/content";
import { applySecurityHeaders } from "@/lib/security-headers";

export const revalidate = 3600;

export async function GET() {
  const body = await loadTextDataFile("llms-full.txt");

  return new Response(body, {
    headers: applySecurityHeaders(
      new Headers({
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      }),
    ),
  });
}
