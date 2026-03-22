import { Skeleton } from '@/components/ui/skeleton';

export function SummarySkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Skeleton className="h-6 w-52" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Summary card */}
        <div className="rounded-xl border bg-card">
          <div className="p-6 pb-2">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="px-6 pb-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>

        {/* Medications card */}
        <div className="rounded-xl border bg-card">
          <div className="p-6 pb-2">
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="px-6 pb-6 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border-l-2 border-muted pl-3 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        </div>

        {/* Follow-ups card */}
        <div className="rounded-xl border bg-card">
          <div className="p-6 pb-2">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="px-6 pb-6 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Warning signs card */}
        <div className="rounded-xl border border-muted bg-card">
          <div className="p-6 pb-2">
            <Skeleton className="h-6 w-52" />
          </div>
          <div className="px-6 pb-6 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>

        {/* SOAP section */}
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-5 w-44" />
        <div className="rounded-xl border bg-card">
          <div className="p-6 space-y-4">
            {['w-20', 'w-16', 'w-24', 'w-12'].map((w, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className={`h-3 ${w}`} />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
