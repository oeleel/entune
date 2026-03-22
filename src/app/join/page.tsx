'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { joinSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function JoinPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const { visitId } = await joinSession(
        joinCode.trim(),
        patientName.trim() || undefined,
        patientEmail.trim() || undefined
      );
      router.push(`/session/patient?visitId=${visitId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      setIsJoining(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          ← Back
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join a Session</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your doctor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Join Code</Label>
                <Input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="text-2xl font-mono tracking-[0.3em] text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientName">Name (optional)</Label>
                <Input
                  id="patientName"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Email (optional)</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={isJoining}>
                {isJoining ? 'Joining...' : 'Join Session'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Are you a doctor?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in instead
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
