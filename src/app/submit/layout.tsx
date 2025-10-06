import type { ReactNode } from "react";
import { generatePageMetadata } from "@/src/lib/seo/metadata-generator";

export const metadata = await generatePageMetadata("/submit");

export default function SubmitLayout({ children }: { children: ReactNode }) {
  return children;
}
