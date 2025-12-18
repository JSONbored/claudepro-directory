import { StatusPageSkeleton } from './status-page-skeleton';

export default function StatusPageLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="bg-muted mb-2 h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <StatusPageSkeleton />
    </div>
  );
}
