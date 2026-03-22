import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupportedLanguage } from '@/lib/types';
import { isPatientUiLanguage } from '@/lib/patient-languages';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { joinCode, patientName, patientEmail, patientLanguage } = body as {
      joinCode: string;
      patientName?: string;
      patientEmail?: string;
      patientLanguage?: string;
    };

    if (!joinCode?.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: joinCode' },
        { status: 400 }
      );
    }

    if (!patientName?.trim() || !patientEmail?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (!patientLanguage || !isPatientUiLanguage(patientLanguage)) {
      return NextResponse.json(
        { error: 'A valid patient language is required' },
        { status: 400 }
      );
    }

    // Find the visit by join code
    const { data: visit, error: findError } = await supabase
      .from('visits')
      .select('id, status, language_patient, language_provider')
      .eq('join_code', joinCode)
      .single();

    if (findError || !visit) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    if (visit.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Session is no longer accepting patients' },
        { status: 409 }
      );
    }

    const langPatient = patientLanguage as SupportedLanguage;

    // Update visit to active with patient info and their chosen language
    const { error: updateError } = await supabase
      .from('visits')
      .update({
        status: 'active',
        patient_name: patientName.trim(),
        patient_email: patientEmail.trim(),
        language_patient: langPatient,
      })
      .eq('id', visit.id);

    if (updateError) {
      console.error('Failed to join session:', updateError);
      return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
    }

    return NextResponse.json({
      visitId: visit.id,
      patientLanguage: langPatient,
      providerLanguage: visit.language_provider,
    });
  } catch (error) {
    console.error('Session join error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
