'use client';

/**
 * ErrorTable - Specialized error display table
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting documentation
 */

import { AlertTriangle, Info } from '@heyclaude/web-runtime/icons';
import type { ErrorTableProps } from '@heyclaude/web-runtime/types/component.types';
import { cluster, iconSize, muted    } from '@heyclaude/web-runtime/design-system';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

/**
 * Render a styled table that displays a list of errors with codes, severity, messages, and solutions.
 *
 * Renders a Card containing a table with columns: Error Code, Severity, Message, and Solution. Each row is keyed by error.code and shows a severity badge (styled and iconified for `critical`, `warning`, or `info`), the error message, and a suggested solution. If `description` is provided it is shown under the title.
 *
 * @param props - Component props
 * @param props.title - Heading displayed in the card title
 * @param props.errors - Array of error objects to display. Each error should include `code`, `severity` (one of `"critical" | "warning" | "info"`), `message`, and `solution`
 * @param props.description - Optional descriptive text shown below the title
 * @returns The rendered ErrorTable JSX element
 *
 * @see UnifiedBadge
 * @see Card
 */
export function ErrorTable(props: ErrorTableProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, errors, description } = props;
  const validErrors = errors;

  const severityColors = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  };

  const severityIcons = {
    critical: <AlertTriangle className={iconSize.sm} />,
    warning: <Info className={iconSize.sm} />,
    info: <Info className={iconSize.sm} />,
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className={'p-4 text-left ${weight.medium}'}>Error Code</th>
                <th className={'p-4 text-left ${weight.medium}'}>Severity</th>
                <th className={'p-4 text-left ${weight.medium}'}>Message</th>
                <th className={'p-4 text-left ${weight.medium}'}>Solution</th>
              </tr>
            </thead>
            <tbody>
              {validErrors.map((error, index) => (
                <tr
                  key={error.code}
                  className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className={'p-4 font-mono ${size.sm}'}>{error.code}</td>
                  <td className="p-4">
                    <UnifiedBadge
                      variant="base"
                      style="secondary"
                      className={severityColors[error.severity || 'info']}
                    >
                      <span className={cluster.tight}>
                        {severityIcons[error.severity || 'info']}
                        {error.severity}
                      </span>
                    </UnifiedBadge>
                  </td>
                  <td className={'p-4 ${size.sm}'}>{error.message}</td>
                  <td className={`p-4 ${muted.sm}`}>{error.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}