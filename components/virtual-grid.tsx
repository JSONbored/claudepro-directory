import { forwardRef, memo } from 'react';
import { type CellComponentProps, Grid } from 'react-window';
import { ConfigCard } from '@/components/config-card';
import { ErrorBoundary } from '@/components/error-boundary';
import type { ContentMetadata } from '@/types/content';

interface VirtualGridProps {
  items: ContentMetadata[];
  width: number;
  height: number;
  itemsPerRow: number;
  itemHeight: number;
  type: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks';
}

interface GridCellProps {
  items: ContentMetadata[];
  itemsPerRow: number;
  type: 'rules' | 'mcp' | 'agents' | 'commands' | 'hooks';
}

// Grid cell component properly typed for new react-window API
const GridCell = memo(function GridCellComponent(props: CellComponentProps<GridCellProps>) {
  const { items, itemsPerRow, type, columnIndex, rowIndex, style } = props;

  const index = rowIndex * itemsPerRow + columnIndex;
  const item = items[index];

  if (!item) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-3">
      <ErrorBoundary
        fallback={<div className="p-4 text-center text-muted-foreground">Error loading item</div>}
      >
        <ConfigCard key={item.slug} {...item} type={type} />
      </ErrorBoundary>
    </div>
  );
});

GridCell.displayName = 'GridCell';

export const VirtualGrid = memo(
  forwardRef<HTMLDivElement, VirtualGridProps>(
    ({ items, width, height, itemsPerRow, itemHeight, type }, ref) => {
      const rowCount = Math.ceil(items.length / itemsPerRow);

      const columnWidth = Math.floor(width / itemsPerRow);
      const rowHeight = itemHeight;

      if (items.length === 0) {
        return (
          <div
            ref={ref}
            className="flex items-center justify-center h-64 text-muted-foreground"
            style={{ width, height: Math.min(height, 256) }}
          >
            No items to display
          </div>
        );
      }

      return (
        <div ref={ref}>
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Error loading virtual grid
              </div>
            }
          >
            <Grid
              cellComponent={GridCell}
              cellProps={{
                items,
                itemsPerRow,
                type,
              }}
              columnCount={itemsPerRow}
              columnWidth={columnWidth}
              defaultHeight={height}
              defaultWidth={width}
              rowCount={rowCount}
              rowHeight={rowHeight}
              overscanCount={2}
            />
          </ErrorBoundary>
        </div>
      );
    }
  )
);

VirtualGrid.displayName = 'VirtualGrid';
