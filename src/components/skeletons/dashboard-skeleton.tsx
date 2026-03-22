import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-6 md:p-8">
      {/* Header: title + button */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-11 w-36 rounded-lg" />
      </div>

      {/* Search bar + select button */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-lg" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-52 rounded-lg mb-4" />

      {/* Calendar + cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 lg:items-start">
        {/* Calendar placeholder */}
        <Skeleton className="h-80 rounded-xl" />

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-3 flex flex-col justify-between h-[130px]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-32 mt-1" />
              <div className="flex items-center gap-1.5 mt-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
