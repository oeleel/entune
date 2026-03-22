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

    // Update visit to active with patient info
    const { error: updateError } = await supabase
      .from('visits')
      .update({
        status: 'active',
        patient_name: patientName || null,
        patient_email: patientEmail || null,
      })
      .eq('id', visit.id);

    if (updateError) {
      console.error('Failed to join session:', updateError);
      return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
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
