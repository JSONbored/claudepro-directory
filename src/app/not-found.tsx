import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { Home, Search } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = await generatePageMetadata('/404');

export default function NotFound() {
  return (
    <div
      className={`${UI_CLASSES.MIN_H_SCREEN} ${UI_CLASSES.FLEX} items-center justify-center bg-background px-4`}
    >
      <Card className={`${UI_CLASSES.MAX_W_LG} ${UI_CLASSES.W_FULL} ${UI_CLASSES.P_8} text-center`}>
        <div className={UI_CLASSES.MB_6}>
          <h1 className={`text-6xl ${UI_CLASSES.FONT_BOLD} ${UI_CLASSES.MB_4} text-primary`}>
            404
          </h1>
          <h2 className={`text-2xl ${UI_CLASSES.FONT_SEMIBOLD} ${UI_CLASSES.MB_2}`}>
            Page Not Found
          </h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div
          className={`${UI_CLASSES.FLEX} ${UI_CLASSES.FLEX_COL} ${UI_CLASSES.GAP_3} sm:flex-row sm:justify-center`}
        >
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

        <div className={`${UI_CLASSES.MT_8} ${UI_CLASSES.TEXT_SM} text-muted-foreground`}>
          <p className={UI_CLASSES.MB_2}>Popular pages:</p>
          <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center`}>
            <Link href={ROUTES.AGENTS} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
              Agents
            </Link>
            <span>•</span>
            <Link href={ROUTES.MCP} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
              MCP Servers
            </Link>
            <span>•</span>
            <Link href={ROUTES.RULES} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
              Rules
            </Link>
            <span>•</span>
            <Link href={ROUTES.COMMANDS} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
              Commands
            </Link>
            <span>•</span>
            <Link href={ROUTES.HOOKS} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
              Hooks
            </Link>
            <span>•</span>
            <Link href={ROUTES.STATUSLINES} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
              Statuslines
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
