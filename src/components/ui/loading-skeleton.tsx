import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { UI_CLASSES } from "@/src/lib/ui-constants";
import { cn } from "@/src/lib/utils";

const skeletonVariants = cva("animate-pulse bg-muted rounded", {
  variants: {
    variant: {
      default: "bg-muted",
      card: "bg-card",
      accent: "bg-accent/20",
    },
    size: {
      xs: "h-3",
      sm: "h-4",
      md: "h-6",
      lg: "h-8",
      xl: "h-12",
    },
    width: {
      xs: "w-16",
      sm: "w-24",
      md: "w-32",
      lg: "w-48",
      xl: "w-64",
      "2xl": "w-96",
      "3xl": "w-full",
      "1/2": "w-1/2",
      "2/3": "w-2/3",
      "3/4": "w-3/4",
      "4/5": "w-4/5",
      "5/6": "w-5/6",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
    width: "md",
    rounded: "md",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant,
  size,
  width,
  rounded,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        skeletonVariants({ variant, size, width, rounded }),
        className,
      )}
      {...props}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div
      className={`flex ${UI_CLASSES.MIN_H_SCREEN} items-center justify-center`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function PageHeaderSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(`${UI_CLASSES.MB_8} animate-pulse`, className)}
      {...props}
    >
      <Skeleton size="lg" width="lg" className={UI_CLASSES.MB_4} />
      <Skeleton size="sm" width="2xl" />
    </div>
  );
}

function ConfigCardSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border bg-card p-6 animate-pulse", className)}
      {...props}
    >
      <Skeleton size="md" width="3/4" className={UI_CLASSES.MB_3} />
      <Skeleton size="sm" width="3xl" className={UI_CLASSES.MB_2} />
      <Skeleton size="sm" width="5/6" className={UI_CLASSES.MB_4} />
      <div className={UI_CLASSES.FLEX_GAP_2}>
        <Skeleton size="sm" width="xs" rounded="full" />
        <Skeleton size="sm" width="xs" rounded="full" />
      </div>
    </div>
  );
}

function ConfigGridSkeleton({
  count = 6,
  className,
  ...props
}: {
  count?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("container mx-auto px-4 py-8", className)} {...props}>
      <PageHeaderSkeleton />
      <div className={UI_CLASSES.GRID_RESPONSIVE_3_TIGHT}>
        {[...Array(count)].map((_, i) => (
          <ConfigCardSkeleton key={`config-skeleton-${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function ContentListSkeleton({
  count = 8,
  className,
  ...props
}: {
  count?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {[...Array(count)].map((_, i) => (
        <div
          key={`content-skeleton-${i + 1}`}
          className="border rounded-lg p-4 animate-pulse"
        >
          <div
            className={`flex ${UI_CLASSES.ITEMS_START} ${UI_CLASSES.JUSTIFY_BETWEEN} ${UI_CLASSES.MB_3}`}
          >
            <div className="flex-1">
              <Skeleton size="md" width="2/3" className={UI_CLASSES.MB_2} />
              <Skeleton size="sm" width="3xl" />
            </div>
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
          <div className={UI_CLASSES.FLEX_GAP_2}>
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchBarSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex gap-4 mb-6", className)} {...props}>
      <Skeleton size="lg" width="3xl" />
      <Skeleton size="lg" width="lg" />
    </div>
  );
}

function FilterBarSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-card/30 border border-border/50 rounded-lg p-6 space-y-6 animate-pulse",
        className,
      )}
      {...props}
    >
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <Skeleton size="md" width="lg" />
        <Skeleton size="sm" width="sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={`filter-skeleton-${i + 1}`} className="space-y-2">
            <Skeleton size="sm" width="sm" />
            <Skeleton size="lg" width="3xl" />
          </div>
        ))}
      </div>
      <div className={UI_CLASSES.FLEX_WRAP_GAP_2}>
        {[...Array(8)].map((_, i) => (
          <Skeleton
            key={`tag-skeleton-${i + 1}`}
            size="sm"
            width="xs"
            rounded="full"
          />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border rounded-lg animate-pulse", className)}
      {...props}
    >
      <div className="border-b p-4">
        <div
          className={UI_CLASSES.GRID_GAP_4}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={`header-${i + 1}`} size="sm" width="sm" />
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          key={`row-${rowIndex + 1}`}
          className="border-b p-4 last:border-b-0"
        >
          <div
            className={UI_CLASSES.GRID_GAP_4}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex + 1}-${colIndex + 1}`}
                size="sm"
                width="md"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ButtonSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      size="lg"
      width="lg"
      rounded="md"
      className={cn("animate-pulse", className)}
      {...props}
    />
  );
}

function ImageSkeleton({
  aspectRatio = "square",
  className,
  ...props
}: {
  aspectRatio?: "square" | "video" | "wide" | "tall";
} & React.HTMLAttributes<HTMLDivElement>) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[2/1]",
    tall: "aspect-[1/2]",
  };

  return (
    <Skeleton
      className={cn(
        aspectClasses[aspectRatio],
        "w-full animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export {
  Skeleton,
  LoadingSkeleton,
  PageHeaderSkeleton,
  ConfigCardSkeleton,
  ConfigGridSkeleton,
  ContentListSkeleton,
  SearchBarSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
  ButtonSkeleton,
  ImageSkeleton,
  skeletonVariants,
};
