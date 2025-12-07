/**
 * ComparisonTable - Feature comparison table for products/services
 * Used in 16+ MDX files across the codebase
 */

import { CheckCircle } from '@heyclaude/web-runtime/icons';
import { type ComparisonTableProps } from '@heyclaude/web-runtime/types/component.types';
import {
  UI_CLASSES,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

/**
 * Renders a responsive feature comparison table for two or three columns with an optional title and description.
 *
 * The table displays a "Feature" column plus one header cell for each entry in `headers`. Each item in `items`
 * becomes a row; boolean option values render a green check icon for `true` and a muted em dash (`—`) for `false`,
 * while non-boolean values are rendered as-is. If `headers` is empty or `items` is empty/undefined, the component renders `null`.
 *
 * @param props - Component props
 * @param props.title - Optional title shown above the table
 * @param props.description - Optional descriptive text shown below the title
 * @param props.headers - Array of column headers (excluding the leading "Feature" column)
 * @param props.items - Array of rows where each row must include `feature`, `option1`, `option2`, and optionally `option3`
 * @returns A JSX element containing the comparison table, or `null` when there are no headers or no items.
 *
 * @see ComparisonTableProps
 * @see Card
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
      {title || description ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="p-4 text-left font-medium">Feature</th>
                {validHeaders.map((header) => (
                  <th key={header} className="p-4 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validItems.map((item) => (
                <tr key={item.feature} className="border-b last:border-0">
                  <td className="p-4 font-medium">{item.feature}</td>
                  <td className="p-4">
                    {typeof item.option1 === 'boolean' ? (
                      item.option1 ? (
                        <CheckCircle className={`${UI_CLASSES.ICON_MD} text-green-500`} />
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
                        <CheckCircle className={`${UI_CLASSES.ICON_MD} text-green-500`} />
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
                          <CheckCircle className={`${UI_CLASSES.ICON_MD} text-green-500`} />
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