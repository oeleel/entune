'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useDeepgramTranscript } from '@/hooks/use-deepgram-transcript';
import { createClient } from '@/lib/supabase/client';
import { updatePatientSessionLanguage } from '@/lib/api';
import { PatientLanguageSelect } from '@/components/marketing/patient-language-select';
import { toPatientUiLanguage, type PatientUiLanguage } from '@/lib/patient-languages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { SupportedLanguage, PatientReport } from '@/lib/types';

function PatientSessionContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');

  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);

  const { status, error: statusError } = useSessionStatus(visitId);
  const { transcript, error: transcriptError } = useRealtimeTranscript(visitId);
  const {
    transcript: deepgramEntries,
    interimText,
    isConnected,
    error: deepgramError,
    startListening,
    stopListening,
  } = useDeepgramTranscript(visitId);

  const processedIndexRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Fetch visit details on mount
  useEffect(() => {
    if (!visitId) return;
    const supabase = createClient();
    supabase
      .from('visits')
      .select('language_patient, language_provider')
      .eq('id', visitId)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data.language_patient as SupportedLanguage;
          setPatientLang((p === 'es-ES' ? 'es-ES' : 'ko-KR') as SupportedLanguage);
          setProviderLang(data.language_provider as SupportedLanguage);
        }
      });
  }, [visitId]);

  // Auto-start Deepgram when session is active
  useEffect(() => {
    if (status === 'active' && !startedRef.current) {
      startedRef.current = true;
      startListening();
    }
    if (status === 'ended' && startedRef.current) {
      stopListening();
    }
  }, [status, startListening, stopListening]);

  // Process new Deepgram entries → send to /api/session/transcript (tagged as patient)
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
          speaker: 'patient',
          detectedLanguage: entry.detectedLanguage,
        }),
      }).catch((err) => console.error('Transcript submit error:', err));
    }
  }, [deepgramEntries, visitId, status]);

  // Fetch patient report when session ends
  useEffect(() => {
    if (status !== 'ended' || !visitId) return;
    const supabase = createClient();
    supabase
      .from('visit_summaries')
      .select('patient_report')
      .eq('visit_id', visitId)
      .single()
      .then(({ data }) => {
        if (data?.patient_report) {
          setPatientReport(data.patient_report as PatientReport);
        }
      });
  }, [status, visitId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [transcript, interimText]);

  async function handlePatientLanguageChange(next: PatientUiLanguage) {
    setPatientLang(next);
    setLanguageError(null);
    if (!visitId || status === 'ended') return;
    try {
      await updatePatientSessionLanguage(visitId, next);
    } catch (e) {
      setLanguageError(e instanceof Error ? e.message : 'Could not update language');
    }
  }

  const providerMessages = transcript.filter((t) => t.speaker === 'provider');
  const connectionError = statusError || transcriptError || deepgramError;
  const languageLocked = status === 'ended';

  if (!visitId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No visit ID provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entune</h1>
            <p className="text-sm text-muted-foreground">Patient Session</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <PatientLanguageSelect
                id="sessionPatientLanguage"
                label="Your language"
                value={toPatientUiLanguage(patientLang)}
                onChange={handlePatientLanguageChange}
                disabled={languageLocked}
              />
              {languageError && (
                <p className="mt-1 text-xs text-destructive">{languageError}</p>
              )}
            </div>
            <Badge variant={isConnected ? 'default' : status === 'active' ? 'secondary' : 'outline'} className="gap-1.5">
              {status === 'active' && (
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`}
                />
              )}
              {status === 'waiting'
                ? 'Connecting...'
                : status === 'active'
                  ? isConnected ? 'Listening' : 'Connecting...'
                  : 'Ended'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {connectionError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-6 text-destructive text-sm">
            {connectionError}
          </div>
        )}

        {/* Waiting */}
        {status === 'waiting' && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">Connecting to doctor...</p>
            </CardContent>
          </Card>
        )}

        {/* Active session */}
        {status === 'active' && (
          <div className="space-y-6">
            {/* Doctor subtitles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Doctor is speaking</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  <div>
                    {providerMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Waiting for doctor to speak...
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {providerMessages.map((entry, i) => (
                          <div key={i} className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                            <p className="text-sm">{entry.translatedText}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Separator />

            {/* Ambient mic status */}
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
                {isConnected ? (
                  <>
                    <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      Your microphone is active — speak naturally
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-3 w-3 rounded-full bg-gray-400" />
                    <span className="text-sm text-muted-foreground">
                      Connecting microphone...
                    </span>
                  </>
                )}
              </div>
              {interimText && (
                <p className="mt-2 text-sm text-muted-foreground italic">
                  {interimText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Session ended */}
        {status === 'ended' && (
          <div className="space-y-6">
            {patientReport ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Visit Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{patientReport.summary}</p>
                  </CardContent>
                </Card>

                {patientReport.medications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Medications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {patientReport.medications.map((med, i) => (
                          <li key={i} className="border-l-2 border-primary pl-3">
                            <p className="font-medium text-sm">{med.name}</p>
                            <p className="text-sm text-muted-foreground">{med.instructions}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {patientReport.followUps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Follow-Ups</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {patientReport.followUps.map((fu, i) => (
                          <li key={i} className="flex justify-between items-start text-sm">
                            <span>{fu.item}</span>
                            {fu.date && (
                              <span className="text-muted-foreground ml-4 whitespace-nowrap">
                                {fu.date}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {patientReport.warningSignsToWatchFor.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-base text-red-700">Warning Signs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 list-disc list-inside text-sm">
                        {patientReport.warningSignsToWatchFor.map((sign, i) => (
                          <li key={i}>{sign}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-muted-foreground">Loading your report...</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function PatientSessionPage() {
  return (
    <Suspense fallback={<p className="p-8 text-muted-foreground">Loading...</p>}>
      <PatientSessionContent />
    </Suspense>
  );
}
