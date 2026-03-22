import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { joinCode, patientName, patientEmail } = body as {
      joinCode: string;
      patientName?: string;
      patientEmail?: string;
    };

    if (!joinCode) {
      return NextResponse.json(
        { error: 'Missing required field: joinCode' },
        { status: 400 }
      );
    }

    // Atomic update: only succeeds if join_code matches AND status is 'waiting'
    const { data: visit, error: updateError } = await supabase
      .from('visits')
      .update({
        status: 'active',
        patient_name: patientName || null,
        patient_email: patientEmail || null,
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
      patientLanguage: visit.language_patient,
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
