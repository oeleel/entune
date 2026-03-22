'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useUser } from '@/hooks/use-user';
import { useChat } from '@/hooks/use-chat';
import { createClient } from '@/lib/supabase/client';
import { createSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [dialogOpen, setDialogOpen] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useChat(
    user?.id ?? '',
    user?.preferredLanguage ?? 'en-US',
    selectedVisitId ?? undefined
  );

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

  function handleVisitClick(visitId: string) {
    if (selectedVisitId === visitId) {
      setSelectedVisitId(null);
      clearMessages();
    } else {
      setSelectedVisitId(visitId);
      clearMessages();
    }
  }

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = chatInputRef.current?.value.trim();
    if (value) {
      sendMessage(value);
      if (chatInputRef.current) chatInputRef.current.value = '';
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
            <span className="text-sm text-muted-foreground">
              {user.name}
            </span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                <Button size="lg">
                  + New Session
                </Button>
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
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visits List — takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
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
                  <Card
                    key={v.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedVisitId === v.id ? 'ring-2 ring-primary bg-accent/30' : ''
                    }`}
                    onClick={() => handleVisitClick(v.id)}
                  >
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
                            <span>→</span>
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
                ))
              )}
            </div>
          </div>

          {/* Chat Panel — takes 1 column */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Visit Chat</CardTitle>
                <CardDescription>
                  {selectedVisitId
                    ? 'Ask questions about the selected visit.'
                    : 'Select a visit to start chatting.'}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                {selectedVisitId ? (
                  <>
                    <ScrollArea className="flex-1 px-4 py-3">
                      <div className="space-y-3">
                        {messages.length === 0 && !isLoading && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Ask a question about this visit...
                          </p>
                        )}
                        {messages.map((m) => (
                          <div
                            key={m.id}
                            className={`text-sm rounded-lg px-3 py-2 max-w-[90%] ${
                              m.role === 'user'
                                ? 'ml-auto bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {m.content}
                          </div>
                        ))}
                        {isLoading && (
                          <div className="bg-muted text-sm rounded-lg px-3 py-2 max-w-[90%] animate-pulse">
                            Thinking...
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    <div className="border-t p-3">
                      <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <Input
                          ref={chatInputRef}
                          placeholder="Ask about this visit..."
                          disabled={isLoading}
                        />
                        <Button type="submit" size="sm" disabled={isLoading}>
                          Send
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-sm text-muted-foreground text-center">
                      Click a visit on the left to chat about it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
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
