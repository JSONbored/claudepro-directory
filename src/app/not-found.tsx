import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import { Card } from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { Home, Search } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * **PERFORMANCE**: Synchronous metadata generation
 * No await needed - generatePageMetadata is now synchronous for optimal Next.js 15 performance
 */
export const metadata = generatePageMetadata('/404');

export default function NotFound() {
  return (
    <div className={'min-h-screen flex items-center justify-center bg-background px-4'}>
      <Card className={'max-w-lg w-full p-8 text-center'}>
        <div className="mb-6">
          <h1 className={'text-6xl font-bold mb-4 text-primary'}>404</h1>
          <h2 className={'text-2xl font-semibold mb-2'}>Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className={'flex flex flex-col gap-3 sm:flex-row sm:justify-center'}>
          <Link href={ROUTES.HOME}>
            <Button size="lg">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href={ROUTES.GUIDES}>
            <Button variant="outline" size="lg">
              <Search className="h-4 w-4 mr-2" />
              Browse Guides
            </Button>
          </Link>
        </div>

        <div className={'mt-8 text-sm text-muted-foreground'}>
          <p className="mb-2">Popular pages:</p>
          <div className={`flex ${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center`}>
            <Link href={ROUTES.AGENTS} className="hover:text-primary">
              Agents
            </Link>
            <span>•</span>
            <Link href={ROUTES.MCP} className="hover:text-primary">
              MCP Servers
            </Link>
            <span>•</span>
            <Link href={ROUTES.RULES} className="hover:text-primary">
              Rules
            </Link>
            <span>•</span>
            <Link href={ROUTES.COMMANDS} className="hover:text-primary">
              Commands
            </Link>
            <span>•</span>
            <Link href={ROUTES.HOOKS} className="hover:text-primary">
              Hooks
            </Link>
            <span>•</span>
            <Link href={ROUTES.STATUSLINES} className="hover:text-primary">
              Statuslines
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
