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

    const langPatient = patientLanguage as SupportedLanguage;

    // Atomic update: only succeeds if join_code matches AND status is 'waiting'
    const { data: visit, error: updateError } = await supabase
      .from('visits')
      .update({
        status: 'active',
        patient_name: patientName.trim(),
        patient_email: patientEmail.trim(),
        language_patient: langPatient,
      })
      .eq('join_code', joinCode)
      .eq('status', 'waiting')
      .select('id, language_patient, language_provider')
      .single();

    if (updateError || !visit) {
      return NextResponse.json(
        { error: 'Invalid join code or session is no longer accepting patients' },
        { status: 409 }
      );
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
