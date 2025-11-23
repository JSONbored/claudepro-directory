import { generatePageMetadata } from '@heyclaude/web-runtime';
import type { Metadata } from 'next';
import { NotFoundEmpty } from '@/src/components/primitives/feedback/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/404');
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <NotFoundEmpty />
    </div>
  );
}
