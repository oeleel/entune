import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold tracking-tight">Entune</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Real-time bilingual translation for healthcare visits
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <Link href="/login" className="flex-1">
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg hover:ring-2 hover:ring-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Doctor</CardTitle>
              <CardDescription>
                Sign in to start a session
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-3xl">
              🩺
            </CardContent>
          </Card>
        </Link>

        <Link href="/join" className="flex-1">
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg hover:ring-2 hover:ring-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Patient</CardTitle>
              <CardDescription>
                Join with a code from your doctor
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-3xl">
              🗣️
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator className="my-8 max-w-xs" />

      <p className="text-sm text-muted-foreground">
        Breaking language barriers in healthcare
      </p>
    </main>
  );
}
