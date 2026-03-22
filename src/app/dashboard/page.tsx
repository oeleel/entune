'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserNav } from '@/components/shared/user-nav';
import type { SupportedLanguage } from '@/lib/types';

const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English',
  'ko-KR': 'Korean',
  'es-ES': 'Spanish',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  waiting: 'outline',
  active: 'default',
  ended: 'secondary',
};

type Visit = {
  id: string;
  language_patient: string;
  language_provider: string;
  status: string;
  patient_name: string | null;
  started_at: string;
  ended_at: string | null;
};

function DashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select('id, language_patient, language_provider, status, patient_name, started_at, ended_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVisits(data);
      });
  }, [user]);

  const filteredVisits = visits.filter((v) =>
    search
      ? v.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.language_patient.toLowerCase().includes(search.toLowerCase()) ||
        v.id.includes(search)
      : true
  );

  async function handleStartSession() {
    setIsCreating(true);
    try {
      const { visitId, joinCode: code } = await createSession(patientLang, providerLang);
      setJoinCode(code);
      setTimeout(() => {
        router.push(`/session/doctor?visitId=${visitId}&joinCode=${code}`);
      }, 3000);
    } catch (err) {
      console.error('Failed to create session:', err);
      setIsCreating(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entune</h1>
            <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button size="lg" />}>
                + New Session
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a New Session</DialogTitle>
                  <DialogDescription>
                    Select languages and share the join code with your patient.
                  </DialogDescription>
                </DialogHeader>

                {!joinCode ? (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Patient Language</label>
                      <Select value={patientLang} onValueChange={(v) => setPatientLang(v as SupportedLanguage)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ko-KR">Korean</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Provider Language</label>
                      <Select value={providerLang} onValueChange={(v) => setProviderLang(v as SupportedLanguage)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English</SelectItem>
                          <SelectItem value="ko-KR">Korean</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleStartSession}
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Create Session'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-sm text-muted-foreground">Share this code with your patient:</p>
                    <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
                      {joinCode}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Redirecting to session...
                    </p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <UserNav user={user} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Past Visits</h2>
            <span className="text-sm text-muted-foreground">
              {visits.length} visit{visits.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Input
            type="text"
            placeholder="Search by patient name, language, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="space-y-2">
            {filteredVisits.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {visits.length === 0
                    ? 'No visits yet. Start a new session to begin.'
                    : 'No visits match your search.'}
                </CardContent>
              </Card>
            ) : (
              filteredVisits.map((v) => (
                <Link key={v.id} href={`/dashboard/visit/${v.id}`}>
                  <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {new Date(v.started_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(v.started_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{LANGUAGE_LABELS[v.language_patient] || v.language_patient}</span>
                            <span>&rarr;</span>
                            <span>{LANGUAGE_LABELS[v.language_provider] || v.language_provider}</span>
                            {v.patient_name && (
                              <>
                                <Separator orientation="vertical" className="h-4" />
                                <span>{v.patient_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant={STATUS_VARIANT[v.status] || 'outline'}>
                          {v.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
