/**
 * ComparisonTable - Feature comparison table for products/services
 * Used in 16+ MDX files across the codebase
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import type { ComparisonTableProps } from '@heyclaude/web-runtime/types/component.types';
import { iconSize } from '@heyclaude/web-runtime/design-system';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

/**
 * Renders a styled feature comparison table inside a Card.
 *
 * Displays a header (title and description) when provided, and a table with a "Feature" column
 * plus one column per header. For option cells, boolean values render a green check icon for
 * `true` and a muted dash for `false`; non-boolean values render as-is. If no headers or no items
 * are provided, nothing is rendered.
 *
 * @param props - Component props.
 * @param props.title - Optional title shown in the card header.
 * @param props.description - Optional description shown under the title.
 * @param props.headers - Array of column header labels (excluding the leading "Feature" column).
 * @param props.items - Array of rows; each item must include `feature` and up to `option1`, `option2`, `option3`.
 * @returns The rendered comparison table element, or `null` when there are no headers or items.
 *
 * @see ComparisonTableProps
 * @see Card
 * @see iconSize
 */
export function ComparisonTable(props: ComparisonTableProps) {
  // Database CHECK constraint validates structure - no runtime validation needed
  const { title, description, headers, items } = props;
  const validHeaders = headers;
  const validItems = items || [];

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className={'p-4 text-left font-medium'}>Feature</th>
                {validHeaders.map((header) => (
                  <th key={header} className={'p-4 text-left font-medium'}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validItems.map((item) => (
                <tr key={item.feature} className="border-b last:border-0">
                  <td className={'p-4 font-medium'}>{item.feature}</td>
                  <td className="p-4">
                    {typeof item.option1 === 'boolean' ? (
                      item.option1 ? (
                        <CheckCircle className={`${iconSize.md} text-green-500`} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      item.option1
                    )}
                  </td>
                  <td className="p-4">
                    {typeof item.option2 === 'boolean' ? (
                      item.option2 ? (
                        <CheckCircle className={`${iconSize.md} text-green-500`} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )
                    ) : (
                      item.option2
                    )}
                  </td>
                  {item.option3 !== undefined && (
                    <td className="p-4">
                      {typeof item.option3 === 'boolean' ? (
                        item.option3 ? (
                          <CheckCircle className={`${iconSize.md} text-green-500`} />
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