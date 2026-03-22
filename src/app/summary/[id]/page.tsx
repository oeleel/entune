'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import type { PatientReport, DoctorReport } from '@/lib/types';

export default function SummaryPage() {
  const params = useParams<{ id: string }>();
  const visitId = params.id;

  const [patientReport, setPatientReport] = useState<PatientReport | null>(null);
  const [doctorReport, setDoctorReport] = useState<DoctorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('visit_summaries')
        .select('patient_report, doctor_report')
        .eq('visit_id', visitId)
        .single();

      if (fetchError || !data) {
        setError('Summary not found for this visit.');
        setLoading(false);
        return;
      }

      setPatientReport(data.patient_report as PatientReport);
      setDoctorReport(data.doctor_report as DoctorReport);
      setLoading(false);
    }

    fetchSummary();
  }, [visitId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading summary...</p>
      </div>
    );
  }

  if (error || !patientReport) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'No summary available.'}</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Entune — Visit Summary</h1>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Patient Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{patientReport.summary}</p>
          </CardContent>
        </Card>

        {/* Medications */}
        {patientReport.medications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {patientReport.medications.map((med, i) => (
                  <li key={i} className="border-l-2 border-primary pl-3">
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-muted-foreground">{med.instructions}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Follow-ups */}
        {patientReport.followUps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {patientReport.followUps.map((fu, i) => (
                  <li key={i} className="flex justify-between items-start">
                    <span>{fu.item}</span>
                    {fu.date && (
                      <span className="text-sm text-muted-foreground ml-4 whitespace-nowrap">
                        {fu.date}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Warning Signs */}
        {patientReport.warningSignsToWatchFor.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Warning Signs to Watch For</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 list-disc list-inside">
                {patientReport.warningSignsToWatchFor.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Doctor SOAP Note (shown if user is authenticated doctor) */}
        {doctorReport && (
          <>
            <Separator />
            <h2 className="text-lg font-semibold">Provider Notes (SOAP)</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Subjective</p>
                  <p>{doctorReport.subjective}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Objective</p>
                  <p>{doctorReport.objective}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Assessment</p>
                  <p>{doctorReport.assessment}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Plan</p>
                  <p>{doctorReport.plan}</p>
                </div>
                {doctorReport.culturalConsiderations && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Cultural Considerations</p>
                    <p>{doctorReport.culturalConsiderations}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Separator className="my-6" />
        <p className="text-xs text-muted-foreground text-center">
          Generated at {new Date(patientReport.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
