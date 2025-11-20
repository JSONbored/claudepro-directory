import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/submit');
}

export default function SubmitLayout({ children }: { children: ReactNode }) {
  return children;
}
