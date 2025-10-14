import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { getUserSubmissions } from '@/src/lib/actions/business.actions';
import { ROUTES } from '@/src/lib/constants';
import { CheckCircle, Clock, ExternalLink, GitPullRequest, Send, XCircle } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { BADGE_COLORS, type SubmissionStatusType, UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = await generatePageMetadata('/account/submissions');

export default async function SubmissionsPage() {
  const submissions = await getUserSubmissions();

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { icon: Clock, label: 'Pending Review' },
      approved: { icon: CheckCircle, label: 'Approved' },
      merged: { icon: CheckCircle, label: 'Merged ✓' },
      rejected: { icon: XCircle, label: 'Rejected' },
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;
    const colorClass =
      BADGE_COLORS.submissionStatus[status as SubmissionStatusType] ||
      BADGE_COLORS.submissionStatus.pending;

    return (
      <Badge variant="outline" className={colorClass}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agents: 'Claude Agent',
      mcp: 'MCP Server',
      rules: 'Claude Rule',
      commands: 'Command',
      hooks: 'Hook',
      statuslines: 'Statusline',
    };
    return labels[type] || type;
  };

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="text-3xl font-bold mb-2">My Submissions</h1>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBMIT}>
            <Send className="h-4 w-4 mr-2" />
            New Submission
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
            <Send className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No submissions yet</h3>
            <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md mb-4`}>
              Share your Claude configurations with the community! Your contributions help everyone
              build better AI workflows.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBMIT}>
                <Send className="h-4 w-4 mr-2" />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                  <div className={UI_CLASSES.FLEX_1}>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      {getStatusBadge(submission.status)}
                      <Badge variant="outline" className={UI_CLASSES.TEXT_XS}>
                        {getTypeLabel(submission.content_type)}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{submission.content_name}</CardTitle>
                    <CardDescription className="mt-1">
                      Slug: <code className="text-xs">{submission.content_slug}</code>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div
                  className={`${UI_CLASSES.FLEX_WRAP_GAP_4} ${UI_CLASSES.MB_4} ${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}
                >
                  <div>Submitted {new Date(submission.created_at).toLocaleDateString()}</div>
                  {submission.merged_at && (
                    <>
                      <span>•</span>
                      <div>Merged {new Date(submission.merged_at).toLocaleDateString()}</div>
                    </>
                  )}
                  {submission.pr_number && (
                    <>
                      <span>•</span>
                      <div>PR #{submission.pr_number}</div>
                    </>
                  )}
                </div>

                {submission.status === 'rejected' && submission.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                    <p
                      className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-red-400 mb-1`}
                    >
                      Rejection Reason:
                    </p>
                    <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                      {submission.rejection_reason}
                    </p>
                  </div>
                )}

                {submission.status === 'merged' && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                    <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-green-400`}>
                      🎉 Your contribution is now live on ClaudePro Directory!
                    </p>
                  </div>
                )}

                <div className={UI_CLASSES.FLEX_GAP_2}>
                  {submission.pr_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.pr_url} target="_blank" rel="noopener noreferrer">
                        <GitPullRequest className="h-3 w-3 mr-1" />
                        View PR
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}

                  {submission.status === 'merged' && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${submission.content_type}/${submission.content_slug}`}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Live
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className={UI_CLASSES.FLEX_GAP_3}>
            <GitPullRequest className={`h-5 w-5 text-blue-400 ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
            <div className={UI_CLASSES.FLEX_1}>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM} text-blue-400`}>
                How it works
              </p>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-1`}>
                When you submit a configuration, we automatically create a Pull Request on GitHub.
                Our team reviews it for quality, security, and accuracy. Once approved and merged,
                your contribution goes live for everyone to use!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
