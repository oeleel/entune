'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { createClient } from '@/lib/supabase/client';
import { updatePatientSessionLanguage } from '@/lib/api';
import { PatientLanguageSelect } from '@/components/marketing/patient-language-select';
import { toPatientUiLanguage, type PatientUiLanguage } from '@/lib/patient-languages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SupportedLanguage, PatientReport } from '@/lib/types';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'ko-KR': '한국어',
  'es-ES': 'Español',
};

function PatientSessionContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');

  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [languageError, setLanguageError] = useState<string | null>(null);

  const { status, error: statusError } = useSessionStatus(visitId);
  const { transcript, error: transcriptError } = useRealtimeTranscript(visitId);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const { containerRef, showButton, scrollToBottom } = useAutoScroll([transcript]);

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
        }
      });
  }, [visitId]);

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

  const connectionError = statusError || transcriptError;
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
            <Badge variant={status === 'active' ? 'default' : 'outline'} className="gap-1.5">
              {status === 'active' && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
              {status === 'waiting'
                ? 'Connecting...'
                : status === 'active'
                  ? 'Live'
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

        {/* Active session — read-only bilingual transcript */}
        {status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Live Transcript
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {LANGUAGE_LABELS[patientLang]} / English
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div ref={containerRef}>
              <ScrollArea className="h-[60vh]">
                <div>
                  {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Waiting for conversation to begin...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transcript.map((entry, i) => (
                        <div key={i} className="rounded-lg p-3 bg-muted/40">
                          <p className="text-sm font-medium">{entry.textPatientLang}</p>
                          {entry.textEnglish !== entry.textPatientLang && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.textEnglish}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
              </div>
              {showButton && transcript.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 shadow-md"
                  onClick={scrollToBottom}
                >
                  Scroll to latest
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session ended */}
        {status === 'ended' && (
          <div className="space-y-6">
            {/* Collapsible transcript review */}
            {transcript.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setTranscriptOpen(!transcriptOpen)}
                >
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Conversation Transcript</span>
                    <span className="text-muted-foreground text-sm font-normal">
                      {transcriptOpen ? 'Hide' : 'Show'} ({transcript.length} entries)
                    </span>
                  </CardTitle>
                </CardHeader>
                {transcriptOpen && (
                  <CardContent>
                    <ScrollArea className="h-[40vh]">
                      <div className="space-y-3">
                        {transcript.map((entry, i) => (
                          <div key={i} className="rounded-lg p-3 bg-muted/40">
                            <p className="text-sm font-medium">{entry.textPatientLang}</p>
                            {entry.textEnglish !== entry.textPatientLang && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {entry.textEnglish}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                )}
              </Card>
            )}

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
