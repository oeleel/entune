import { NextResponse } from 'next/server';
import { translateWithContext } from '@/lib/claude';
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

    const response: TranslationResponse = {
      originalText: text,
      translatedText,
      speaker,
      culturalFlag,
      audioUrl: null, // TTS deferred
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
