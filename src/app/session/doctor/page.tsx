'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/shared/auth-guard';
import { CulturalFlagCard } from '@/components/visit/cultural-flag-card';
import { SessionTopBar } from '@/components/visit/session-top-bar';
import { TranscriptContainer } from '@/components/visit/transcript-container';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useDeepgramTranscript } from '@/hooks/use-deepgram-transcript';
import { createClient } from '@/lib/supabase/client';
import { endSession } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  // Waiting for patient
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardContent className="py-16 text-center space-y-4">
            <p className="text-muted-foreground">Waiting for patient to join...</p>
            <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
              {joinCode}
            </p>
            <p className="text-sm text-muted-foreground">Share this code with the patient</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session ended
  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="w-full max-w-sm">
          <CardContent className="py-16 text-center space-y-4">
            <p className="text-muted-foreground">Session has ended.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active session
  return (
    <div className="min-h-screen bg-background">
      <SessionTopBar
        patientLanguage={patientLang}
        providerLanguage={providerLang}
        isRecording={isConnected}
        onEndVisit={handleEndSession}
        isEnding={isEnding}
      />

      {connectionError && (
        <div className="fixed top-12 left-0 right-0 z-30 bg-destructive/10 border-b border-destructive/30 px-6 py-2 text-destructive text-sm text-center">
          {connectionError}
        </div>
      )}

      <div className="pt-12">
        <TranscriptContainer
          transcript={realtimeTranscript}
          patientLanguage={patientLang}
          providerLanguage={providerLang}
          emptyMessage="Listening... speak naturally."
          interimText={interimText}
        />
      </div>

      {/* Cultural flags overlay */}
      {culturalFlags.length > 0 && (
        <div className="fixed bottom-4 right-4 z-30 w-80 space-y-2">
          {culturalFlags.slice(-2).map((flag, i) => (
            <CulturalFlagCard key={i} flag={flag} />
          ))}
        </div>
      )}
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
