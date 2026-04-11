import { getAllEntries } from "@/lib/content";
import { renderCorpusLlms } from "@/lib/llms-export";

export const revalidate = 3600;

export async function GET() {
  const entries = await getAllEntries();
  const body = renderCorpusLlms(entries);

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
