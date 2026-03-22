import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { translateWithContext } from '@/lib/claude';
import type { SupportedLanguage } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { visitId, text, speaker, detectedLanguage } = await request.json();

    if (!visitId || !text?.trim() || !speaker) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['provider', 'patient'].includes(speaker)) {
      return NextResponse.json({ error: 'Invalid speaker' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify visit exists and is active
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('id, status, language_patient, language_provider')
      .eq('id', visitId)
      .single();

    if (visitError || !visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    if (visit.status !== 'active') {
      return NextResponse.json({ error: 'Visit is not active' }, { status: 400 });
    }

    const providerLang = visit.language_provider as SupportedLanguage;
    const patientLang = visit.language_patient as SupportedLanguage;
    const sourceLang = detectedLanguage
      ? mapDeepgramLang(detectedLanguage)
      : (speaker === 'provider' ? providerLang : patientLang);
    const targetLang = speaker === 'provider' ? patientLang : providerLang;

    let translatedText = text;
    let culturalFlag = null;

    // Translate if source and target differ
    if (sourceLang !== targetLang) {
      try {
        const result = await translateWithContext(
          text,
          sourceLang,
          targetLang,
          speaker as 'patient' | 'provider'
        );
        translatedText = result.translatedText;
        culturalFlag = result.culturalFlag || null;
      } catch (err) {
        console.error('Translation error (falling back to original):', err);
      }
    }

    // Insert transcript entry (admin client bypasses RLS)
    const { error: insertError } = await supabase.from('transcript_entries').insert({
      visit_id: visitId,
      speaker,
      original_text: text,
      translated_text: translatedText,
      cultural_flag: culturalFlag,
    });

    if (insertError) {
      console.error('Transcript insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }

    return NextResponse.json({ success: true, translatedText, culturalFlag });
  } catch (error) {
    console.error('Transcript route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapDeepgramLang(lang: string): SupportedLanguage {
  if (lang.startsWith('ko')) return 'ko-KR';
  if (lang.startsWith('es')) return 'es-ES';
  return 'en-US';
}
