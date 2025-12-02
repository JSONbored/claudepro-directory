'use client';

/**
 * ErrorTable - Specialized error display table
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting documentation
 */

import { AlertTriangle, Info } from '@heyclaude/web-runtime/icons';
import type { ErrorTableProps } from '@heyclaude/web-runtime/types/component.types';
import {
  bgColor,
  borderBottom,
  cluster,
  iconSize,
  muted,
  padding,
  size,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

/**
 * Display a styled card table of errors with columns for code, severity, message, and solution.
 *
 * Renders each error as a table row keyed by `error.code`, showing a monospace code, a colored
 * severity badge with an icon, the error message, and a suggested solution. If `description` is
 * provided it is rendered below the title.
 *
 * @param props.title - Heading displayed in the card title
 * @param props.errors - Array of errors to display. Each item must include `code`, `severity` (one of `"critical" | "warning" | "info"`), `message`, and `solution`
 * @param props.description - Optional descriptive text shown below the title
 * @returns The rendered ErrorTable element
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
      <CardContent className={padding.none}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${borderBottom.default} ${bgColor['muted/30']}`}>
              <tr>
                <th className={`${padding.default} text-left ${weight.medium}`}>Error Code</th>
                <th className={`${padding.default} text-left ${weight.medium}`}>Severity</th>
                <th className={`${padding.default} text-left ${weight.medium}`}>Message</th>
                <th className={`${padding.default} text-left ${weight.medium}`}>Solution</th>
              </tr>
            </thead>
            <tbody>
              {validErrors.map((error, index) => (
                <tr
                  key={error.code}
                  className={`${borderBottom.default} last:border-0 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className={`${padding.default} font-mono ${size.sm}`}>{error.code}</td>
                  <td className={padding.default}>
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
                  <td className={`${padding.default} ${size.sm}`}>{error.message}</td>
                  <td className={`${padding.default} ${muted.sm}`}>{error.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}