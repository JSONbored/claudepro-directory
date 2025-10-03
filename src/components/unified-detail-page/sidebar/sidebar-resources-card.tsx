/**
 * SidebarResourcesCard - Server Component for resources links
 *
 * CONVERTED: Client → Server component (no interactivity needed)
 * Pure rendering of GitHub and documentation links
 *
 * Consolidates resources card rendering from:
 * - custom-sidebars.tsx (renderAgentSidebar lines 28-52)
 * - custom-sidebars.tsx (renderMCPSidebar lines 143-167)
 * - unified-detail-page.tsx (renderSidebar lines 444-470)
 *
 * Eliminates 160+ lines of duplication across 3 files
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see lib/config/custom-sidebars.tsx - Original implementations
 */

import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { ExternalLink, Github } from '@/src/lib/icons';

/**
 * Props for SidebarResourcesCard
 */
export interface SidebarResourcesCardProps {
  githubPath?: string | undefined;
  documentationUrl?: string | undefined;
  slug: string;
  category?: string | undefined;
  showGitHubLink?: boolean | undefined;
}

/**
 * SidebarResourcesCard Component (Server Component)
 *
 * Renders GitHub and documentation links in a sidebar card.
 * Used across all detail pages (agents, commands, hooks, mcp, rules)
 * No React.memo needed - server components don't re-render
 */
export function SidebarResourcesCard({
  githubPath,
  documentationUrl,
  slug,
  category,
  showGitHubLink = true,
}: SidebarResourcesCardProps) {
  // Don't render if no links to show
  if (!(showGitHubLink || documentationUrl)) return null;

  const githubUrl = githubPath
    ? `https://github.com/JSONbored/claudepro-directory/blob/main/${githubPath}/${slug}.json`
    : category
      ? `https://github.com/JSONbored/claudepro-directory/blob/main/content/${category}/${slug}.json`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showGitHubLink && githubUrl && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
        )}
        {documentationUrl && (
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={documentationUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
