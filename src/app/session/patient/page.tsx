'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useRealtimeTranscript } from '@/hooks/use-realtime-transcript';
import { useSessionStatus } from '@/hooks/use-session-status';
import { SessionTopBar } from '@/components/visit/session-top-bar';
import { TranscriptContainer } from '@/components/visit/transcript-container';
import { TranscriptEntryCard } from '@/components/visit/transcript-entry';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DownloadPdfButton } from '@/components/shared/download-pdf-button';
import { PatientReportPdf } from '@/lib/pdf/patient-report-pdf';
import { SessionSkeleton } from '@/components/skeletons/session-skeleton';
import type { SupportedLanguage, PatientReport } from '@/lib/types';

function PatientSessionContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');

  const [providerLang, setProviderLang] = useState<SupportedLanguage>('en-US');
  const [patientLang, setPatientLang] = useState<SupportedLanguage>('ko-KR');
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const { status, error: statusError } = useSessionStatus(visitId);
  const { transcript, error: transcriptError } = useRealtimeTranscript(visitId);

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
          setProviderLang(data.language_provider as SupportedLanguage);
          const p = data.language_patient as SupportedLanguage;
          setPatientLang((p === 'es-ES' ? 'es-ES' : 'ko-KR') as SupportedLanguage);
        }
      });
  }, [visitId]);

  // Fetch patient report when session ends (poll until available since reports generate async)
  useEffect(() => {
    if (status !== 'ended' || !visitId) return;

    let cancelled = false;

    async function fetchReport() {
      const supabase = createClient();
      const { data } = await supabase
        .from('visit_summaries')
        .select('patient_report')
        .eq('visit_id', visitId)
        .single();

      if (cancelled) return;

      if (data?.patient_report) {
        setPatientReport(data.patient_report as PatientReport);
      } else {
        // Report not ready yet — retry in 2s
        setTimeout(fetchReport, 2000);
      }
    }

    fetchReport();

    return () => { cancelled = true; };
  }, [status, visitId]);

  const connectionError = statusError || transcriptError;

  if (!visitId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No visit ID provided.</p>
      </div>
    );
  }

  // Waiting
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Connecting to doctor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active session — live transcript with new components
  if (status === 'active') {
    return (
      <div className="min-h-screen bg-background">
        <SessionTopBar
          patientLanguage={patientLang}
          providerLanguage={providerLang}
          isRecording={true}
        />

        {connectionError && (
          <div className="fixed top-12 left-0 right-0 z-30 bg-destructive/10 border-b border-destructive/30 px-6 py-2 text-destructive text-sm text-center">
            {connectionError}
          </div>
        )}

        <div className="pt-12">
          <TranscriptContainer
            transcript={transcript}
            patientLanguage={patientLang}
            providerLanguage={providerLang}
            role="patient"
          />
        </div>
      </div>
    );
  }

  // Session ended — report + collapsible transcript
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/LogoFr.png"
              alt=""
              width={100}
              height={392}
              className="h-7 w-auto shrink-0 dark:invert-0 invert"
            />
            <div>
              <h1 className="text-xl font-bold tracking-[0.08em] lowercase text-foreground">entune</h1>
              <p className="text-sm text-muted-foreground">Visit Complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {patientReport && (
              <DownloadPdfButton
                document={<PatientReportPdf report={patientReport} />}
                fileName={`entune-summary-${visitId}.pdf`}
                label="Download PDF"
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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
                  <div>
                    {transcript.map((entry, i) => (
                      <TranscriptEntryCard
                        key={i}
                        textOriginal={entry.textEnglish}
                        textTranslated={entry.textPatientLang}
                        originalLanguage={providerLang}
                        translatedLanguage={patientLang}
                        role="patient"
                      />
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
      </main>
    </div>
  );
}

export default function PatientSessionPage() {
  return (
    <Suspense fallback={<SessionSkeleton />}>
      <PatientSessionContent />
    </Suspense>
  );
}
