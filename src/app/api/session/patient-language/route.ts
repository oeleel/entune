import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupportedLanguage } from '@/lib/types';
import { isPatientUiLanguage } from '@/lib/patient-languages';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { visitId, patientLanguage } = body as {
      visitId: string;
      patientLanguage: string;
    };

    if (!visitId?.trim()) {
      return NextResponse.json({ error: 'visitId is required' }, { status: 400 });
    }

    if (!patientLanguage || !isPatientUiLanguage(patientLanguage)) {
      return NextResponse.json({ error: 'Invalid patient language' }, { status: 400 });
    }

    const { data: visit, error: findError } = await supabase
      .from('visits')
      .select('id, status')
      .eq('id', visitId)
      .single();

    if (findError || !visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    if (visit.status !== 'waiting' && visit.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not open for language changes' },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from('visits')
      .update({ language_patient: patientLanguage as SupportedLanguage })
      .eq('id', visitId);

    if (updateError) {
      console.error('Patient language update:', updateError);
      return NextResponse.json({ error: 'Failed to update language' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, patientLanguage });
  } catch (e) {
    console.error('patient-language route:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
