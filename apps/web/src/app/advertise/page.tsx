import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Advertise on HeyClaude",
  description:
    "Promote roles and opportunities to developers shipping Claude-native products and infrastructure.",
  path: "/advertise"
});

export default function AdvertisePage() {
  redirect("/jobs/post");
}
