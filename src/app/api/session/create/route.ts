import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupportedLanguage } from '@/lib/types';

function generateJoinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const MAX_JOIN_CODE_RETRIES = 5;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { patientLanguage, providerLanguage } = body as {
      patientLanguage: SupportedLanguage;
      providerLanguage: SupportedLanguage;
    };

    if (!patientLanguage || !providerLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: patientLanguage, providerLanguage' },
        { status: 400 }
      );
    }

    // Retry loop for join code uniqueness collisions
    for (let attempt = 0; attempt < MAX_JOIN_CODE_RETRIES; attempt++) {
      const joinCode = generateJoinCode();

      const { data, error } = await supabase
        .from('visits')
        .insert({
          user_id: user.id,
          join_code: joinCode,
          status: 'waiting',
          language_patient: patientLanguage,
          language_provider: providerLanguage,
        })
        .select('id, join_code')
        .single();

      if (!error && data) {
        return NextResponse.json({ visitId: data.id, joinCode: data.join_code });
      }

      // Postgres unique violation = code 23505
      if (error.code === '23505') {
        continue;
      }

      // Non-collision error — fail immediately
      console.error('Failed to create session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Exhausted retries
    return NextResponse.json(
      { error: 'Failed to generate unique join code. Please try again.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
