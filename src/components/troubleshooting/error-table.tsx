'use client';

/**
 * ErrorTable - Specialized error display table
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting documentation
 */

import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { AlertTriangle, Info } from '@/src/lib/icons';
import { type ErrorTableProps, errorTablePropsSchema } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export function ErrorTable(props: ErrorTableProps) {
  const validated = errorTablePropsSchema.parse(props);
  const { title, errors, description } = validated;
  const validErrors = errors;

  const severityColors = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  };

  const severityIcons = {
    critical: <AlertTriangle className="h-4 w-4" />,
    warning: <Info className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        <div className={UI_CLASSES.OVERFLOW_X_AUTO}>
          <table className={UI_CLASSES.W_FULL}>
            <thead className="border-b bg-muted/30">
              <tr>
                <th
                  className={`${UI_CLASSES.TEXT_LEFT} ${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}
                >
                  Error Code
                </th>
                <th
                  className={`${UI_CLASSES.TEXT_LEFT} ${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}
                >
                  Severity
                </th>
                <th
                  className={`${UI_CLASSES.TEXT_LEFT} ${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}
                >
                  Message
                </th>
                <th
                  className={`${UI_CLASSES.TEXT_LEFT} ${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}
                >
                  Solution
                </th>
              </tr>
            </thead>
            <tbody>
              {validErrors.map((error, index) => (
                <tr
                  key={error.code}
                  className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className={`${UI_CLASSES.P_4} font-mono ${UI_CLASSES.TEXT_SM}`}>
                    {error.code}
                  </td>
                  <td className={UI_CLASSES.P_4}>
                    <Badge className={severityColors[error.severity]} variant="secondary">
                      <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                        {severityIcons[error.severity]}
                        {error.severity}
                      </span>
                    </Badge>
                  </td>
                  <td className={`${UI_CLASSES.P_4} ${UI_CLASSES.TEXT_SM}`}>{error.message}</td>
                  <td className={`${UI_CLASSES.P_4} ${UI_CLASSES.TEXT_SM} text-muted-foreground`}>
                    {error.solution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
