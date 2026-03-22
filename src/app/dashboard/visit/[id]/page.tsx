'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useUser } from '@/hooks/use-user';
import { ChatInterface } from '@/components/dashboard/chat-interface';
import { createClient } from '@/lib/supabase/client';
import { deleteVisits } from '@/lib/api';
import { DownloadPdfButton } from '@/components/shared/download-pdf-button';
import { TranscriptPdf } from '@/lib/pdf/transcript-pdf';
import { DoctorReportPdf } from '@/lib/pdf/doctor-report-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Markdown from 'react-markdown';
import { VisitDetailSkeleton } from '@/components/skeletons/visit-detail-skeleton';
import type { PatientReport, DoctorReport } from '@/lib/types';

const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English',
  'ko-KR': 'Korean',
  'es-ES': 'Spanish',
};

type Visit = {
  id: string;
  user_id: string;
  language_patient: string;
  language_provider: string;
  status: string;
  patient_name: string | null;
  started_at: string;
  ended_at: string | null;
};

type TranscriptEntry = {
  id: string;
  speaker: 'patient' | 'provider';
  original_text: string;
  translated_text: string;
  cultural_flag: Record<string, unknown> | null;
  timestamp: string;
};

function VisitDetailContent() {
  const params = useParams<{ id: string }>();
  const visitId = params.id;
  const router = useRouter();
  const { user } = useUser();

  const [visit, setVisit] = useState<Visit | null>(null);
  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [doctorReport, setDoctorReport] = useState<DoctorReport | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const supabase = createClient();

      // Fetch visit metadata
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('id', visitId)
        .single();

      if (visitError || !visitData) {
        setError('Visit not found.');
        setLoading(false);
        return;
      }

      if (visitData.user_id !== user!.id) {
        setError('You do not have access to this visit.');
        setLoading(false);
        return;
      }

      setVisit(visitData as Visit);

      // Fetch summaries and transcript in parallel
      const [summaryResult, transcriptResult] = await Promise.all([
        supabase
          .from('visit_summaries')
          .select('patient_report, doctor_report')
          .eq('visit_id', visitId)
          .single(),
        supabase
          .from('transcript_entries')
          .select('*')
          .eq('visit_id', visitId)
          .order('timestamp', { ascending: true }),
      ]);

      if (summaryResult.data) {
        setPatientReport(summaryResult.data.patient_report as PatientReport);
        setDoctorReport(summaryResult.data.doctor_report as DoctorReport);
      }

      if (transcriptResult.data) {
        setTranscript(transcriptResult.data as TranscriptEntry[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, visitId]);

  // Poll for reports when visit is ended but reports are missing
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);
  useEffect(() => {
    const reportsReady = doctorReport && patientReport;
    const shouldPoll = visit?.status === 'ended' && !reportsReady && !loading;

    if (!shouldPoll) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('visit_summaries')
        .select('patient_report, doctor_report')
        .eq('visit_id', visitId)
        .single();

      if (data?.doctor_report && data?.patient_report) {
        setDoctorReport(data.doctor_report as DoctorReport);
        setPatientReport(data.patient_report as PatientReport);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [visit?.status, doctorReport, patientReport, loading, visitId]);

  async function handleDeleteVisit() {
    setIsDeleting(true);
    try {
      await deleteVisits([visitId]);
      router.push('/dashboard');
    } catch {
      setError('Failed to delete visit.');
      setIsDeleting(false);
    }
  }

  function renderTranscript() {
    if (transcript.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-8">
          No transcript entries for this visit.
        </p>
      );
    }

    const patientLangLabel = LANGUAGE_LABELS[visit!.language_patient] || visit!.language_patient;

    return (
      <div className="space-y-4">
        {transcript.map((entry) => (
          <div key={entry.id} className="border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">
                {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm">{entry.original_text}</p>
            {entry.original_text !== entry.translated_text && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                {patientLangLabel}: {entry.translated_text}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return <VisitDetailSkeleton />;
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Visit not found.'}</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const hasCulturalFlags = doctorReport?.culturalFlags && doctorReport.culturalFlags.length > 0;
  const hasReports = visit.status === 'ended' && (patientReport || doctorReport);
  const reportsGenerating = visit.status === 'ended' && !doctorReport && !patientReport;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                &larr; Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {visit.patient_name || 'Unknown Patient'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {new Date(visit.started_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' \u00B7 '}
                  {new Date(visit.started_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="outline" className="text-xs">
                  {LANGUAGE_LABELS[visit.language_patient] || visit.language_patient}
                </Badge>
                <span>&rarr;</span>
                <Badge variant="outline" className="text-xs">
                  {LANGUAGE_LABELS[visit.language_provider] || visit.language_provider}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {transcript.length > 0 && (
              <DownloadPdfButton
                document={
                  <TranscriptPdf
                    transcript={transcript}
                    patientName={visit.patient_name}
                    visitDate={visit.started_at}
                    patientLanguage={visit.language_patient}
                    providerLanguage={visit.language_provider}
                  />
                }
                fileName={`entune-transcript-${visit.patient_name || visit.id}.pdf`}
                label="Export Transcript"
              />
            )}
            {doctorReport ? (
              <DownloadPdfButton
                document={
                  <DoctorReportPdf
                    report={doctorReport}
                    patientName={visit.patient_name}
                    culturalFlags={doctorReport.culturalFlags}
                  />
                }
                fileName={`entune-soap-${visit.patient_name || visit.id}.pdf`}
                label="Export SOAP"
              />
            ) : reportsGenerating ? (
              <Button variant="outline" size="sm" disabled>
                Generating SOAP...
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="destructive" size="sm" disabled={isDeleting} />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Visit'}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the visit, including its transcript, reports, and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteVisit}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Reports + Transcript */}
          <div className="lg:col-span-2">
            {hasReports || reportsGenerating ? (
              <Tabs defaultValue={reportsGenerating ? 'transcript' : 'summary'} className="flex flex-col h-[calc(100vh-11rem)]">
                <TabsList className="w-full justify-start shrink-0">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="soap">SOAP</TabsTrigger>
                  {hasCulturalFlags && <TabsTrigger value="flags">Flags</TabsTrigger>}
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                </TabsList>

                {/* Patient Summary */}
                <TabsContent value="summary" className="flex-1 min-h-0 overflow-y-auto p-4">
                  {patientReport ? (
                    <div className="space-y-4">
                      <p>{patientReport.summaryEnglish || patientReport.summary}</p>

                      {patientReport.medications.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Medications</p>
                          <ul className="space-y-2">
                            {patientReport.medications.map((med, i) => (
                              <li key={i} className="border-l-2 border-primary pl-3">
                                <p className="font-medium text-sm">{med.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {med.instructionsEnglish || med.instructions}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {patientReport.followUps.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Follow-ups</p>
                          <ul className="space-y-1">
                            {patientReport.followUps.map((fu, i) => (
                              <li key={i} className="text-sm">
                                {fu.itemEnglish || fu.item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(patientReport.warningSignsEnglish || patientReport.warningSignsToWatchFor).length > 0 && (
                        <div className="rounded-md border border-red-200 p-3">
                          <p className="text-sm font-medium text-red-700 mb-1">Warning Signs</p>
                          <ul className="space-y-1 list-disc list-inside text-sm">
                            {(patientReport.warningSignsEnglish || patientReport.warningSignsToWatchFor).map((sign, i) => (
                              <li key={i}>{sign}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-muted-foreground animate-pulse">Generating patient summary...</p>
                    </div>
                  )}
                </TabsContent>

                {/* Doctor SOAP Note */}
                <TabsContent value="soap" className="flex-1 min-h-0 overflow-y-auto p-4">
                  {doctorReport ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Subjective</p>
                        <div className="aui-md text-sm"><Markdown>{doctorReport.subjective}</Markdown></div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Objective</p>
                        <div className="aui-md text-sm"><Markdown>{doctorReport.objective}</Markdown></div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Assessment</p>
                        <div className="aui-md text-sm"><Markdown>{doctorReport.assessment}</Markdown></div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Plan</p>
                        <div className="aui-md text-sm"><Markdown>{doctorReport.plan}</Markdown></div>
                      </div>
                      {doctorReport.culturalConsiderations && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Cultural Considerations</p>
                          <div className="aui-md text-sm"><Markdown>{doctorReport.culturalConsiderations}</Markdown></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-muted-foreground animate-pulse">Generating SOAP note...</p>
                    </div>
                  )}
                </TabsContent>

                {/* Cultural Flags (only if flags exist) */}
                {hasCulturalFlags && (
                  <TabsContent value="flags" className="flex-1 min-h-0 overflow-y-auto p-4">
                    <div className="space-y-3">
                      {doctorReport!.culturalFlags.map((flag, i) => (
                        <div key={i} className="rounded-md border border-amber-200 dark:border-amber-800 p-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{flag.term}</span>
                            <span className="text-xs text-muted-foreground">({flag.literal})</span>
                          </div>
                          <p className="text-sm">{flag.clinicalContext}</p>
                          {flag.screenFor.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Screen for: {flag.screenFor.join(', ')}
                            </p>
                          )}
                          {flag.safetyNote && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Safety: {flag.safetyNote}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* Transcript */}
                <TabsContent value="transcript" className="flex-1 min-h-0 overflow-y-auto p-4">
                  {renderTranscript()}
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="h-[calc(100vh-11rem)] flex flex-col">
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-y-auto">
                  {renderTranscript()}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — Chat */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-11rem)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Visit Chat</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ask questions about this visit.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 min-h-0">
                <ChatInterface
                  userId={user.id}
                  preferredLanguage={user.preferredLanguage ?? 'en-US'}
                  visitId={visitId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VisitDetailPage() {
  return (
    <AuthGuard>
      <VisitDetailContent />
    </AuthGuard>
  );
}
