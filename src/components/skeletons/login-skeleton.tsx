import { Skeleton } from '@/components/ui/skeleton';

export function LoginSkeleton() {
  return (
    <main className="entune-page relative flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="bg-[var(--entune-bg2)] border border-[var(--entune-border)] rounded-2xl p-8 text-center">
          {/* Logo area */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Skeleton className="h-14 w-7" />
            <Skeleton className="h-8 w-28" />
          </div>

          {/* Title + subtitle */}
          <Skeleton className="h-7 w-52 mx-auto mb-2" />
          <Skeleton className="h-4 w-56 mx-auto mb-8" />

          {/* Google button */}
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Footer text */}
        <Skeleton className="h-3 w-64 mx-auto mt-6" />
        <Skeleton className="h-3 w-44 mx-auto mt-4" />
      </div>
    </main>
  );
}
