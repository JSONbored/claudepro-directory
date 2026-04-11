import { notFound } from "next/navigation";

import { getEntry } from "@/lib/content";
import { renderEntryLlms } from "@/lib/llms-export";

type EntryLlmsRouteProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const revalidate = 3600;

export async function GET(_request: Request, { params }: EntryLlmsRouteProps) {
  const { category, slug } = await params;
  const entry = await getEntry(category, slug);

  if (!entry) {
    notFound();
  }

  return new Response(renderEntryLlms(entry), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
