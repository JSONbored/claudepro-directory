import dynamic from "next/dynamic";
import { UI_CLASSES } from "@/src/lib/ui-constants";

/**
 * Lazy-loaded ConfigCard component with skeleton loading state
 */
export const LazyConfigCard = dynamic(
  () =>
    import("../features/content/config-card").then((mod) => ({
      default: mod.ConfigCard,
    })),
  {
    loading: () => (
      <div
        className={`animate-pulse bg-card/50 ${UI_CLASSES.ROUNDED_LG} ${UI_CLASSES.P_6} ${UI_CLASSES.SPACE_Y_4}`}
      >
        <div className="h-6 bg-card/70 rounded w-3/4" />
        <div className={`h-4 bg-card/70 rounded ${UI_CLASSES.W_FULL}`} />
        <div className="h-4 bg-card/70 rounded w-2/3" />
      </div>
    ),
  },
);
