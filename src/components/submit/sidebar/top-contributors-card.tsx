import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Trophy, Medal } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import Link from 'next/link';
import type { TopContributor } from '@/src/lib/schemas/submission-stats.schema';

interface TopContributorsCardProps {
  contributors: TopContributor[];
}

export function TopContributorsCard({ contributors }: TopContributorsCardProps) {
  if (contributors.length === 0) {
    return null;
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
          🌟 Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className={UI_CLASSES.SPACE_Y_2}>
        {contributors.map((contributor) => (
          <Link
            key={contributor.slug}
            href={`/u/${contributor.slug}`}
            className={`flex items-center justify-between ${UI_CLASSES.PY_2} hover:bg-accent/5 ${UI_CLASSES.PX_2} -mx-2 rounded transition-colors`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-muted-foreground w-4 flex-shrink-0`}>
                {contributor.rank}.
              </span>
              {getMedalIcon(contributor.rank)}
              <span className={`${UI_CLASSES.TEXT_SM} truncate`}>@{contributor.name}</span>
            </div>
            <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_SEMIBOLD} text-green-400 flex-shrink-0 ml-2`}>
              {contributor.mergedCount}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
