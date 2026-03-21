import { NextResponse } from 'next/server';
import { translateWithContext } from '@/lib/claude';
import { textToSpeech, audioToBase64DataUrl } from '@/lib/elevenlabs';
import type { TranslationRequest, TranslationResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, sourceLanguage, targetLanguage, speaker, visitContext } = body;

    if (!text || !sourceLanguage || !targetLanguage || !speaker) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceLanguage, targetLanguage, speaker' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local' },
        { status: 503 }
      );
    }

    // Call Claude for translation + cultural flag detection
    const { translatedText, culturalFlag } = await translateWithContext(
      text,
      sourceLanguage,
      targetLanguage,
      speaker,
      visitContext
    );

    // Call ElevenLabs TTS for the translated text
    let audioUrl: string | null = null;
    try {
      const audioBuffer = await textToSpeech(translatedText, targetLanguage);
      if (audioBuffer) {
        audioUrl = audioToBase64DataUrl(audioBuffer);
      }
    } catch (ttsError) {
      console.error('TTS failed, returning text-only response:', ttsError);
    }

    const response: TranslationResponse = {
      originalText: text,
      translatedText,
      speaker,
      culturalFlag,
      audioUrl,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
