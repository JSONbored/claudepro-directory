import { notFound } from "next/navigation";

import { loadTextDataFile } from "@/lib/content";

type EntryLlmsRouteProps = {
  params: Promise<{ category: string; slug: string }>;
};

export const revalidate = 3600;

export async function GET(_request: Request, { params }: EntryLlmsRouteProps) {
  const { category, slug } = await params;
  if (!/^[a-z0-9-]+$/.test(category) || !/^[a-z0-9-]+$/.test(slug)) {
    notFound();
  }
  const body = await loadTextDataFile(`llms/${category}/${slug}.txt`).catch(
    () => null,
  );
  if (!body) notFound();

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
