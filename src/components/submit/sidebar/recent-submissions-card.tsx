import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { CheckCircle } from '@/src/lib/icons';
import type { RecentMerged } from '@/src/lib/schemas/submission-stats.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface RecentSubmissionsCardProps {
  submissions: RecentMerged[];
}

const TYPE_LABELS: Record<string, string> = {
  agents: 'Agent',
  mcp: 'MCP',
  rules: 'Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
};

/**
 * Format relative time (e.g., "2h ago", "3d ago")
 * Lightweight alternative to date-fns
 */
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export function RecentSubmissionsCard({ submissions }: RecentSubmissionsCardProps) {
  if (submissions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
          🔥 Recently Merged
        </CardTitle>
      </CardHeader>
      <CardContent className={UI_CLASSES.SPACE_Y_3}>
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className={`flex items-start gap-2 pb-3 ${UI_CLASSES.BORDER_B} border-border/50 last:border-0 last:pb-0`}
          >
            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} truncate`}>
                {submission.content_name}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {TYPE_LABELS[submission.content_type]}
                </Badge>
                {submission.user && (
                  <span className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                    by{' '}
                    <Link
                      href={`/u/${submission.user.slug}`}
                      className="hover:text-foreground transition-colors"
                    >
                      @{submission.user.name}
                    </Link>
                  </span>
                )}
              </div>
              <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                {formatTimeAgo(submission.merged_at)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
