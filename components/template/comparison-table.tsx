'use client';

/**
 * ComparisonTable - Feature comparison table for products/services
 * Used in 16+ MDX files across the codebase
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from '@/lib/icons';
import { type ComparisonTableProps, comparisonTablePropsSchema } from '@/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/lib/ui-constants';

export function ComparisonTable(props: ComparisonTableProps) {
  const validated = comparisonTablePropsSchema.parse(props);
  const { title, description, headers, items } = validated;
  const validHeaders = headers;
  const validItems = items;

  if (validHeaders.length === 0 || validItems.length === 0) {
    return null;
  }

  return (
    <Card className="my-8">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className={UI_CLASSES.OVERFLOW_X_AUTO}>
          <table className={UI_CLASSES.W_FULL}>
            <thead className="border-b">
              <tr>
                <th className={`text-left ${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}>Feature</th>
                {validHeaders.map((header) => (
                  <th
                    key={header}
                    className={`text-left ${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validItems.map((item) => (
                <tr key={item.feature} className="border-b last:border-0">
                  <td className={`${UI_CLASSES.P_4} ${UI_CLASSES.FONT_MEDIUM}`}>{item.feature}</td>
                  <td className={UI_CLASSES.P_4}>
                    {typeof item.option1 === 'boolean' ? (
                      item.option1 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      item.option1
                    )}
                  </td>
                  <td className={UI_CLASSES.P_4}>
                    {typeof item.option2 === 'boolean' ? (
                      item.option2 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      item.option2
                    )}
                  </td>
                  {item.option3 !== undefined && (
                    <td className={UI_CLASSES.P_4}>
                      {typeof item.option3 === 'boolean' ? (
                        item.option3 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        item.option3
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
