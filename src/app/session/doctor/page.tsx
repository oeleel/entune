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

  const { status } = useSessionStatus(visitId);
  const { transcript } = useRealtimeTranscript(visitId);
  const {
    isListening,
    transcript: spokenText,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition(providerLang, 'continuous');

  const lastProcessedRef = useRef('');

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

  // Auto-start listening when session becomes active
  useEffect(() => {
    if (status === 'active' && !isListening) {
      startListening();
    }
  }, [status, isListening, startListening]);

  // Process finalized speech — translate and insert into Supabase
  useEffect(() => {
    if (!spokenText || !visitId || spokenText === lastProcessedRef.current) return;

    const newText = spokenText.slice(lastProcessedRef.current.length).trim();
    if (!newText) return;

    lastProcessedRef.current = spokenText;

    // Translate and insert
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

  if (!visitId) {
    return <div style={{ padding: 40 }}>Missing visitId in URL.</div>;
  }

  const culturalFlags = transcript
    .map((e) => e.culturalFlag)
    .filter((f): f is CulturalFlag => f !== null);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Doctor Session</h1>

      {/* Join code display — shown until patient joins */}
      {status === 'waiting' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>Waiting for patient to join...</p>
          <div style={{ fontSize: 48, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 8, margin: '20px 0' }}>
            {joinCode}
          </div>
          <p style={{ color: '#666' }}>Share this code with the patient</p>
        </div>
      )}

      {/* Active session */}
      {status === 'active' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span>
              {isListening ? '🎤 Listening...' : 'Mic off'}
              {interimTranscript && (
                <span style={{ color: '#999', marginLeft: 8 }}>{interimTranscript}</span>
              )}
            </span>
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              style={{ background: '#ef4444', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              {isEnding ? 'Ending...' : 'End Session'}
            </button>
          </div>

          {/* Transcript */}
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxHeight: 400, overflowY: 'auto' }}>
            <h3>Transcript</h3>
            {transcript.length === 0 && (
              <p style={{ color: '#999' }}>Start speaking to see the transcript...</p>
            )}
            {transcript.map((entry, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 8, background: entry.speaker === 'provider' ? '#f0f9ff' : '#fef3c7', borderRadius: 6 }}>
                <strong>{entry.speaker === 'provider' ? 'Doctor' : 'Patient'}:</strong>{' '}
                {entry.originalText}
                <br />
                <span style={{ color: '#666' }}>→ {entry.translatedText}</span>
              </div>
            ))}
          </div>

          {/* Cultural flags */}
          {culturalFlags.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Cultural Flags</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {culturalFlags.map((flag, i) => (
                  <CulturalFlagCard key={i} flag={flag} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Session ended */}
      {status === 'ended' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>Session has ended.</p>
          <button onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}

export default function DoctorSessionPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<p>Loading...</p>}>
        <DoctorSessionContent />
      </Suspense>
    </AuthGuard>
  );
}
