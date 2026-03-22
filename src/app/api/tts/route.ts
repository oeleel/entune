import { NextResponse } from 'next/server';

// TTS deferred — endpoint kept as a stub for future ElevenLabs integration.
export async function POST() {
  return NextResponse.json({ audioUrl: null, message: 'TTS is not enabled' });
}
