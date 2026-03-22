import { Skeleton } from '@/components/ui/skeleton';

export function SessionSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-12 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Transcript area */}
      <div className="pt-12 max-w-3xl mx-auto px-6 py-8 space-y-4">
        {/* Staggered message bubbles */}
        <div className="flex justify-start">
          <Skeleton className="h-12 w-3/5 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-2/5 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-14 w-4/5 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/2 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-2/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
