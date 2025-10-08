/**
 * For You Feed Loading State
 */

export default function ForYouLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-3" />
        <div className="h-6 w-96 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
