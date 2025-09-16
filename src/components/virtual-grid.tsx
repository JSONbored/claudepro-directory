import { forwardRef, memo } from 'react';
import { Grid } from 'react-window';
import { ConfigCard } from '@/components/config-card';
import type { ContentMetadata } from '@/types/content';

interface VirtualGridProps {
  items: ContentMetadata[];
  width: number;
  height: number;
  itemsPerRow: number;
  itemHeight: number;
  type: 'rule' | 'mcp' | 'agent' | 'command' | 'hook';
}

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: ContentMetadata[];
    itemsPerRow: number;
    type: 'rule' | 'mcp' | 'agent' | 'command' | 'hook';
  };
}

const GridCell = memo(({ columnIndex, rowIndex, style, data }: GridCellProps) => {
  const { items, itemsPerRow, type } = data;
  const index = rowIndex * itemsPerRow + columnIndex;
  const item = items[index];

  if (!item) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-3">
      <ConfigCard key={item.id} {...item} type={type} />
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

      const itemData = {
        items,
        itemsPerRow,
        type,
      };

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
          <Grid
            columnCount={itemsPerRow}
            columnWidth={columnWidth}
            height={height}
            rowCount={rowCount}
            rowHeight={rowHeight}
            width={width}
            itemData={itemData}
            overscanRowCount={2}
            overscanColumnCount={1}
          >
            {GridCell}
          </Grid>
        </div>
      );
    }
  )
);

VirtualGrid.displayName = 'VirtualGrid';
