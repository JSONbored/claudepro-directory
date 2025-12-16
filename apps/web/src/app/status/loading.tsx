import { StatusPageSkeleton } from './status-page-skeleton';
import { paddingX, paddingY, marginX, marginBottom } from "@heyclaude/web-runtime/design-system";

export default function StatusPageLoading() {
  return (
    <div className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
      <div className={`${marginBottom.relaxed}`}>
        <div className={`bg-muted ${marginBottom.compact} h-8 w-48 animate-pulse rounded`} />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <StatusPageSkeleton />
    </div>
  );
}
