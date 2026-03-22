import { Skeleton } from '@/components/ui/skeleton';

export function VisitDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — tabs + content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            {/* Content area */}
            <div className="space-y-4 p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-20 w-full rounded-md mt-4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-16 w-full rounded-md mt-4" />
            </div>
          </div>

          {/* Right column — chat card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-card h-[calc(100vh-11rem)] flex flex-col">
              <div className="p-6 pb-3 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-44" />
              </div>
              <div className="border-t" />
              <div className="flex-1 p-4 space-y-3">
                <Skeleton className="h-10 w-3/4 rounded-lg" />
                <Skeleton className="h-10 w-2/3 rounded-lg ml-auto" />
                <Skeleton className="h-10 w-4/5 rounded-lg" />
              </div>
              <div className="p-4 pt-0">
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
