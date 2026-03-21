import { NextResponse } from 'next/server';
import { generateSummary } from '@/lib/claude';
import type { TranscriptEntry, LanguagePair } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: {
      visitId: string;
      transcript: TranscriptEntry[];
      languagePair: LanguagePair;
    } = await request.json();

    const { visitId, transcript, languagePair } = body;

    if (!visitId || !transcript || !languagePair) {
      return NextResponse.json(
        { error: 'Missing required fields: visitId, transcript, languagePair' },
        { status: 400 }
      );
    }

    if (transcript.length === 0) {
      return NextResponse.json(
        { error: 'Transcript is empty' },
        { status: 400 }
      );
    }

    const summary = await generateSummary(visitId, transcript, languagePair);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { error: 'Summary generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
