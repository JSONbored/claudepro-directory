/**
 * ComparisonTable - Feature comparison table for products/services
 * Used in 16+ MDX files across the codebase
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import type { ComparisonTableProps } from '@heyclaude/web-runtime/types/component.types';
import {
  borderBottom,
  iconSize,
  muted,
  padding,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
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
  const validItems = items ?? [];

  if (headers.length === 0 || validItems.length === 0) {
    return null;
  }

  // Helper to render option cell content
  const renderOptionCell = (value: boolean | string | undefined) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') {
      return value ? (
        <CheckCircle className={`${iconSize.md} ${textColor.green}`} />
      ) : (
        <span className={muted.default}>—</span>
      );
    }
    return value;
  };

  return (
    <Card className="my-8">
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={padding.none}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={borderBottom.default}>
              <tr>
                <th className={`${padding.default} text-left ${weight.medium}`}>Feature</th>
                {headers.map((header) => (
                  <th key={header} className={`${padding.default} text-left ${weight.medium}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validItems.map((item) => {
                const options = [item.option1, item.option2, item.option3];
                return (
                  <tr key={item.feature} className={`${borderBottom.default} last:border-0`}>
                    <td className={`${padding.default} ${weight.medium}`}>{item.feature}</td>
                    {headers.map((header, index) => (
                      <td key={header} className={padding.default}>
                        {renderOptionCell(options[index])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}