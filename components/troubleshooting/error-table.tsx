'use client';

/**
 * ErrorTable - Specialized error display table
 * Used in 1 MDX file across the codebase - Specialized for troubleshooting documentation
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info } from '@/lib/icons';
import { type ErrorTableProps, errorTablePropsSchema } from '@/lib/schemas/shared.schema';

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left p-4 font-medium">Error Code</th>
                <th className="text-left p-4 font-medium">Severity</th>
                <th className="text-left p-4 font-medium">Message</th>
                <th className="text-left p-4 font-medium">Solution</th>
              </tr>
            </thead>
            <tbody>
              {validErrors.map((error, index) => (
                <tr
                  key={error.code}
                  className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-muted/10' : ''}`}
                >
                  <td className="p-4 font-mono text-sm">{error.code}</td>
                  <td className="p-4">
                    <Badge className={severityColors[error.severity]} variant="secondary">
                      <span className="flex items-center gap-1">
                        {severityIcons[error.severity]}
                        {error.severity}
                      </span>
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">{error.message}</td>
                  <td className="p-4 text-sm text-muted-foreground">{error.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
