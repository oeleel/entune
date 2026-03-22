'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { createClient } from '@/lib/supabase/client';
import { endSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SupportedLanguage, CulturalFlag } from '@/lib/types';

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
  const { transcript, error: transcriptError } = useRealtimeTranscript(visitId);
  const {
    isListening,
    transcript: spokenText,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition(providerLang, 'continuous');

  const lastProcessedRef = useRef('');

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

  useEffect(() => {
    if (status === 'active' && !isListening) {
      startListening();
    }
  }, [status, isListening, startListening]);

  useEffect(() => {
    if (!spokenText || !visitId || spokenText === lastProcessedRef.current) return;

    const newText = spokenText.slice(lastProcessedRef.current.length).trim();
    if (!newText) return;

    lastProcessedRef.current = spokenText;

    (async () => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newText,
            sourceLanguage: providerLang,
            targetLanguage: patientLang,
            speaker: 'provider',
          }),
        });
        if (!res.ok) return;

        const result = await res.json();

        const supabase = createClient();
        await supabase.from('transcript_entries').insert({
          visit_id: visitId,
          speaker: 'provider',
          original_text: result.originalText,
          translated_text: result.translatedText,
          cultural_flag: result.culturalFlag,
        });
      } catch (err) {
        console.error('Doctor translate/insert error:', err);
      }
    })();
  }, [spokenText, visitId, providerLang, patientLang]);

  const handleEndSession = useCallback(async () => {
    if (!visitId) return;
    setIsEnding(true);
    stopListening();

    try {
      await endSession(visitId);
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to end session:', err);
      setIsEnding(false);
    }
  }, [visitId, stopListening, router]);

  const connectionError = statusError || transcriptError;

  if (!visitId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Missing visitId in URL.</p>
      </div>
    );
  }

  const culturalFlags = transcript
    .map((e) => e.culturalFlag)
    .filter((f): f is CulturalFlag => f !== null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entune</h1>
            <p className="text-sm text-muted-foreground">Doctor Session</p>
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

        {/* Active session */}
        {status === 'active' && (
          <div className="space-y-6">
            {/* Mic status */}
            <div className="flex items-center gap-3">
              <Badge variant={isListening ? 'default' : 'secondary'}>
                {isListening ? 'Listening' : 'Mic Off'}
              </Badge>
              {interimTranscript && (
                <span className="text-sm text-muted-foreground italic truncate">
                  {interimTranscript}
                </span>
              )}
            </div>

            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Start speaking to see the transcript...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transcript.map((entry, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 ${
                            entry.speaker === 'provider'
                              ? 'bg-blue-50 dark:bg-blue-950/30'
                              : 'bg-amber-50 dark:bg-amber-950/30'
                          }`}
                        >
                          <p className="text-sm">
                            <span className="font-medium">
                              {entry.speaker === 'provider' ? 'Doctor' : 'Patient'}:
                            </span>{' '}
                            {entry.originalText}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            → {entry.translatedText}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Cultural flags */}
            {culturalFlags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Cultural Flags</h3>
                {culturalFlags.map((flag, i) => (
                  <CulturalFlagCard key={i} flag={flag} />
                ))}
              </div>
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
      <Suspense fallback={<p className="p-8 text-muted-foreground">Loading...</p>}>
        <DoctorSessionContent />
      </Suspense>
    </AuthGuard>
  );
}
