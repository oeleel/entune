import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-lg px-4">
        <h1 className="text-5xl font-bold tracking-tight">Entune</h1>
        <p className="text-xl text-muted-foreground">
          Where every patient is understood.
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Real-time, medically-aware, bilingual translation for healthcare visits.
          Cultural context included.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link href="/login">
            <Button size="lg">Sign in with Google</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
