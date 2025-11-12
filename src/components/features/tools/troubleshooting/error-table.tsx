'use client';

/**
 * ErrorTable - Specialized error display table
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting documentation
 */

import { UnifiedBadge } from '@/src/components/core/domain/badges/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { AlertTriangle, Info } from '@/src/lib/icons';
import type { ErrorTableProps } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
    critical: <AlertTriangle className={UI_CLASSES.ICON_SM} />,
    warning: <Info className={UI_CLASSES.ICON_SM} />,
    info: <Info className={UI_CLASSES.ICON_SM} />,
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
                <th className={'p-4 text-left font-medium'}>Error Code</th>
                <th className={'p-4 text-left font-medium'}>Severity</th>
                <th className={'p-4 text-left font-medium'}>Message</th>
                <th className={'p-4 text-left font-medium'}>Solution</th>
              </tr>
            </thead>
            <tbody>
              {validErrors.map((error, index) => (
                <tr
                  key={error.code}
                  className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className={'p-4 font-mono text-sm'}>{error.code}</td>
                  <td className="p-4">
                    <UnifiedBadge
                      variant="base"
                      style="secondary"
                      className={severityColors[error.severity || 'info']}
                    >
                      <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        {severityIcons[error.severity || 'info']}
                        {error.severity}
                      </span>
                    </UnifiedBadge>
                  </td>
                  <td className={'p-4 text-sm'}>{error.message}</td>
                  <td className={'p-4 text-muted-foreground text-sm'}>{error.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
