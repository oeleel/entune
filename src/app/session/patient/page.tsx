'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSessionStatus } from '@/hooks/use-session-status';
import { useHoldToSpeak } from '@/hooks/use-hold-to-speak';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
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

  const { status, error: statusError } = useSessionStatus(visitId);
  const { transcript, error: transcriptError } = useRealtimeTranscript(visitId);
  const { isHolding, isTranslating, startHolding, stopHolding } = useHoldToSpeak(
    visitId,
    patientLang,
    providerLang
  );

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
          setPatientLang(data.language_patient as SupportedLanguage);
          setProviderLang(data.language_provider as SupportedLanguage);
        }
      });
  }, [visitId]);

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

  const providerMessages = transcript.filter((t) => t.speaker === 'provider');
  const connectionError = statusError || transcriptError;

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
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'waiting' ? 'Connecting...' : status === 'active' ? 'In Session' : 'Ended'}
          </Badge>
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
                </ScrollArea>
              </CardContent>
            </Card>

            <Separator />

            {/* Hold-to-speak button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                variant={isHolding ? 'default' : 'outline'}
                className="h-20 w-64 text-lg"
                onMouseDown={startHolding}
                onMouseUp={stopHolding}
                onTouchStart={startHolding}
                onTouchEnd={stopHolding}
                disabled={isTranslating}
              >
                {isTranslating
                  ? 'Translating...'
                  : isHolding
                    ? 'Listening... (release to send)'
                    : 'Hold to Speak'}
              </Button>
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
