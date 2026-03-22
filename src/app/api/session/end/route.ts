import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDoctorReport, generatePatientReport } from '@/lib/claude';
import type { TranscriptEntry, SupportedLanguage, CulturalFlag } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { visitId } = body as { visitId: string };

    if (!visitId) {
      return NextResponse.json(
        { error: 'Missing required field: visitId' },
        { status: 400 }
      );
    }

    // Verify the visit belongs to this user and is active
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('id, status, language_patient, language_provider')
      .eq('id', visitId)
      .eq('user_id', user.id)
      .single();

    if (visitError || !visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Idempotent: if already ended, return existing reports
    if (visit.status === 'ended') {
      const { data: existing } = await supabase
        .from('visit_summaries')
        .select('doctor_report, patient_report')
        .eq('visit_id', visitId)
        .single();

      if (existing?.doctor_report && existing?.patient_report) {
        return NextResponse.json({
          doctorReport: existing.doctor_report,
          patientReport: existing.patient_report,
        });
      }
      // Reports missing — fall through to regenerate
    }

    // End the visit
    const { error: updateError } = await supabase
      .from('visits')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', visitId);

    if (updateError) {
      console.error('Failed to end session:', updateError);
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }

    // Fetch transcript entries
    const { data: entries, error: transcriptError } = await supabase
      .from('transcript_entries')
      .select('*')
      .eq('visit_id', visitId)
      .order('timestamp', { ascending: true });

    if (transcriptError) {
      console.error('Failed to fetch transcript:', transcriptError);
      return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
    }

    const transcript: TranscriptEntry[] = (entries || []).map((e) => ({
      textEnglish: e.original_text,
      textPatientLang: e.translated_text,
      speaker: e.speaker as 'patient' | 'provider',
      culturalFlag: e.cultural_flag as CulturalFlag | null,
      audioUrl: null,
      timestamp: e.timestamp,
    }));

    const patientLang = visit.language_patient as SupportedLanguage;
    const providerLang = visit.language_provider as SupportedLanguage;

    const culturalFlags = transcript
      .map((t) => t.culturalFlag)
      .filter((f): f is CulturalFlag => f !== null);

    const languagePair = { patient: patientLang, provider: providerLang };

    // Generate both reports in parallel
    const [doctorReportData, patientReportData] = await Promise.all([
      generateDoctorReport(transcript, culturalFlags, languagePair),
      generatePatientReport(transcript, patientLang),
    ]);

    const doctorReport = { visitId, ...doctorReportData };
    const patientReport = { visitId, ...patientReportData };

    // Save reports to visit_summaries
    const { error: saveError } = await supabase
      .from('visit_summaries')
      .insert({
        visit_id: visitId,
        summary_data: {},
        doctor_report: doctorReport,
        patient_report: patientReport,
      });

    if (saveError) {
      console.error('Failed to save reports:', saveError);
      // Still return reports even if save fails
    }

    return NextResponse.json({ doctorReport, patientReport });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
