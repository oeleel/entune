'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useDeepgramTranscript } from '@/hooks/use-deepgram-transcript';
import { createClient } from '@/lib/supabase/client';
import { endSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SupportedLanguage, CulturalFlag } from '@/lib/types';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'ko-KR': '한국어',
  'es-ES': 'Español',
};

function DoctorSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');
  const joinCodeParam = searchParams.get('joinCode');

  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [isEnding, setIsEnding] = useState(false);
  const [joinCode, setJoinCode] = useState(joinCodeParam || '');

  const { status, error: statusError } = useSessionStatus(visitId);
  const { transcript: realtimeTranscript, error: transcriptError } = useRealtimeTranscript(visitId);
  const {
    transcript: deepgramEntries,
    interimText,
    isConnected,
    error: deepgramError,
    startListening,
    stopListening: stopDeepgram,
  } = useDeepgramTranscript();

  const processedIndexRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Fetch visit details on mount
  useEffect(() => {
    if (!visitId) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select('language_patient, language_provider, join_code')
      .eq('id', visitId)
      .single()
      .then(({ data }) => {
        if (data) {
          setProviderLang(data.language_provider as SupportedLanguage);
          setPatientLang(data.language_patient as SupportedLanguage);
          if (data.join_code) setJoinCode(data.join_code);
        }
      });
  }, [visitId]);

  // Auto-start Deepgram when session becomes active
  useEffect(() => {
    if (status === 'active' && !startedRef.current) {
      startedRef.current = true;
      startListening();
    }
  }, [status, startListening]);

  // Process new Deepgram entries → send to /api/session/transcript
  useEffect(() => {
    if (!visitId || status !== 'active') return;

    const newEntries = deepgramEntries.slice(processedIndexRef.current);
    if (newEntries.length === 0) return;

    processedIndexRef.current = deepgramEntries.length;

    for (const entry of newEntries) {
      if (!entry.isFinal || !entry.text.trim()) continue;

      fetch('/api/session/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          text: entry.text,
          detectedLanguage: entry.detectedLanguage,
        }),
      }).catch((err) => console.error('Transcript submit error:', err));
    }
  }, [deepgramEntries, visitId, status]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [realtimeTranscript, interimText]);

  const handleEndSession = useCallback(async () => {
    if (!visitId) return;
    setIsEnding(true);
    stopDeepgram();

    try {
      await endSession(visitId);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to end session:', err);
      setIsEnding(false);
    }
  }, [visitId, stopDeepgram, router]);

  const connectionError = statusError || transcriptError || deepgramError;

  if (!visitId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Missing visitId in URL.</p>
      </div>
    );
  }

  const culturalFlags = realtimeTranscript
    .map((e) => e.culturalFlag)
    .filter((f): f is CulturalFlag => f !== null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Entune</h1>
              <p className="text-sm text-muted-foreground">Doctor Session</p>
            </div>
            {status === 'active' && (
              <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                {isConnected ? 'Listening' : deepgramError ? 'Error' : 'Connecting...'}
              </Badge>
            )}
          </div>
          {status === 'active' && (
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End Session'}
            </Button>
          )}
          {status === 'ended' && (
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {connectionError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-6 text-destructive text-sm">
            {connectionError}
          </div>
        )}

        {/* Waiting for patient */}
        {status === 'waiting' && (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground">Waiting for patient to join...</p>
              <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
                {joinCode}
              </p>
              <p className="text-sm text-muted-foreground">Share this code with the patient</p>
            </CardContent>
          </Card>
        )}

        {/* Active session — ambient scribe */}
        {status === 'active' && (
          <div className="space-y-6">
            {/* Status bar */}
            <div className="flex items-center gap-3">
              <Badge variant="default">Ambient Scribe</Badge>
              <span className="text-xs text-muted-foreground">
                English / {LANGUAGE_LABELS[patientLang]}
              </span>
              {interimText && (
                <span className="text-sm text-muted-foreground italic truncate flex-1">
                  {interimText}
                </span>
              )}
            </div>

            {/* Live transcript from Supabase realtime */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div>
                    {realtimeTranscript.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Listening... speak naturally.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {realtimeTranscript.map((entry, i) => (
                          <div
                            key={i}
                            className="rounded-lg p-3 bg-muted/40"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{entry.textEnglish}</p>
                            {entry.textEnglish !== entry.textPatientLang && (
                              <p className="text-sm text-muted-foreground mt-1">
                                &rarr; {entry.textPatientLang}
                              </p>
                            )}
                          </div>
                        ))}
                        {/* Interim text — currently speaking */}
                        {interimText && (
                          <div className="rounded-lg p-3 bg-muted/30 border border-dashed border-muted-foreground/20">
                            <p className="text-sm text-muted-foreground italic">
                              {interimText}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Cultural flags */}
            {culturalFlags.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-base">Cultural Flags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {culturalFlags.map((flag, i) => (
                    <CulturalFlagCard key={i} flag={flag} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Session ended */}
        {status === 'ended' && (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground">Session has ended.</p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function DoctorSessionPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
        <DoctorSessionContent />
      </Suspense>
    </AuthGuard>
  );
}
