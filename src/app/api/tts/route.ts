import { NextResponse } from 'next/server';
import { textToSpeech, audioToBase64DataUrl } from '@/lib/elevenlabs';
import type { SupportedLanguage } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: { text: string; language: SupportedLanguage } = await request.json();
    const { text, language } = body;

    if (!text || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: text, language' },
        { status: 400 }
      );
    }

    const audioBuffer = await textToSpeech(text, language);
    if (!audioBuffer) {
      return NextResponse.json(
        { error: 'TTS generation failed. Check that ELEVENLABS_API_KEY is set in .env.local' },
        { status: 503 }
      );
    }

    const audioUrl = audioToBase64DataUrl(audioBuffer);
    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'TTS failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
