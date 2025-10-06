import type { Metadata } from 'next';
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
import { getUserSubmissions } from '@/src/lib/actions/submission-actions';
import { CheckCircle, Clock, ExternalLink, GitPullRequest, Send, XCircle } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'My Submissions - ClaudePro Directory',
  description: 'Track your community content submissions',
};

export default async function SubmissionsPage() {
  const submissions = await getUserSubmissions();

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        icon: Clock,
        label: 'Pending Review',
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      },
      approved: {
        icon: CheckCircle,
        label: 'Approved',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      },
      merged: {
        icon: CheckCircle,
        label: 'Merged ✓',
        className: 'bg-green-500/10 text-green-400 border-green-500/20',
      },
      rejected: {
        icon: XCircle,
        label: 'Rejected',
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
      },
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge variant="outline" className={variant.className}>
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
          <Link href="/submit">
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
              <Link href="/submit">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
          <div className="flex gap-3">
            <GitPullRequest className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
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
