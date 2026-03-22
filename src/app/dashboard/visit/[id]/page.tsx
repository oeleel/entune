'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/shared/auth-guard';
import { useUser } from '@/hooks/use-user';
import { useChat } from '@/hooks/use-chat';
import { ChatInterface } from '@/components/dashboard/chat-interface';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import type { PatientReport, DoctorReport } from '@/lib/types';

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

  const { messages, isLoading: chatLoading, sendMessage } = useChat(
    user?.id ?? '',
    user?.preferredLanguage ?? 'en-US',
    visitId
  );

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

  async function handleDeleteVisit() {
    setIsDeleting(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from('visits')
      .delete()
      .eq('id', visitId);

    if (deleteError) {
      setError('Failed to delete visit.');
      setIsDeleting(false);
      return;
    }

    router.push('/dashboard');
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading visit...</p>
      </div>
    );
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
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {new Date(visit.started_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h1>
                <span className="text-muted-foreground">
                  {new Date(visit.started_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {LANGUAGE_LABELS[visit.language_patient] || visit.language_patient}
                </Badge>
                <span>&rarr;</span>
                <Badge variant="outline" className="text-xs">
                  {LANGUAGE_LABELS[visit.language_provider] || visit.language_provider}
                </Badge>
                {visit.patient_name && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span>{visit.patient_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[visit.status] || 'outline'}>
              {visit.status}
            </Badge>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Reports + Transcript */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reports */}
            {visit.status === 'ended' && (patientReport || doctorReport) && (
              <div className="space-y-6">
                {/* Patient Summary (English for doctor) */}
                {patientReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                              <li key={i} className="flex justify-between items-start text-sm">
                                <span>{fu.itemEnglish || fu.item}</span>
                                {fu.date && (
                                  <span className="text-muted-foreground ml-4 whitespace-nowrap">
                                    {fu.date}
                                  </span>
                                )}
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
                    </CardContent>
                  </Card>
                )}

                {/* Doctor SOAP Note */}
                {doctorReport && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Provider Notes (SOAP)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Subjective</p>
                        <p className="text-sm">{doctorReport.subjective}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Objective</p>
                        <p className="text-sm">{doctorReport.objective}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Assessment</p>
                        <p className="text-sm">{doctorReport.assessment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Plan</p>
                        <p className="text-sm">{doctorReport.plan}</p>
                      </div>
                      {doctorReport.culturalConsiderations && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Cultural Considerations</p>
                          <p className="text-sm">{doctorReport.culturalConsiderations}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Transcript */}
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                {transcript.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No transcript entries for this visit.
                  </p>
                ) : (
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-4 pr-4">
                      {transcript.map((entry) => {
                        // original_text = English, translated_text = patient language
                        const patientLangLabel = LANGUAGE_LABELS[visit.language_patient] || visit.language_patient;

                        return (
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
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — Chat */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Visit Chat</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ask questions about this visit.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 p-0 min-h-0">
                <ChatInterface
                  messages={messages}
                  isLoading={chatLoading}
                  onSendMessage={sendMessage}
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
