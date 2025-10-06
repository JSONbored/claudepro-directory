import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { CheckCircle, Clock, TrendingUp } from '@/src/lib/icons';
import type { SubmissionStats } from '@/src/lib/schemas/submission-stats.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

interface SubmitStatsCardProps {
  stats: SubmissionStats;
}

export function SubmitStatsCard({ stats }: SubmitStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>
          📊 Live Stats
        </CardTitle>
      </CardHeader>
      <CardContent className={UI_CLASSES.SPACE_Y_3}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Total Configs
            </span>
          </div>
          <span className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD}`}>{stats.total}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Pending Review
            </span>
          </div>
          <span className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} text-yellow-400`}>
            {stats.pending}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
              Merged This Week
            </span>
          </div>
          <span className={`${UI_CLASSES.TEXT_LG} ${UI_CLASSES.FONT_SEMIBOLD} text-green-400`}>
            {stats.mergedThisWeek}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
