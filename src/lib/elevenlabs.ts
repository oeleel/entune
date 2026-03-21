import type { SupportedLanguage } from './types';

// Voice IDs for ElevenLabs multilingual voices
// To find your preferred voices, run: GET https://api.elevenlabs.io/v1/voices
// Then update these IDs with voices that sound natural in each language.
const VOICE_MAP: Record<SupportedLanguage, string> = {
  'en-US': 'EXAVITQu4vr4xnSDxMaL', // Sarah - clear, professional American English
  'ko-KR': 'FGY2WhTYpPnrIDTdsKH5', // Laura - multilingual, works well with Korean
  'es-ES': 'TX3LPaxmHKxFdv7VOQHJ', // Liam - multilingual, natural Latin American Spanish
};

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function textToSpeech(
  text: string,
  language: SupportedLanguage
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your-elevenlabs-api-key') {
    console.warn('ElevenLabs API key not configured, skipping TTS');
    return null;
  }

  const voiceId = VOICE_MAP[language];

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`ElevenLabs TTS error: ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('ElevenLabs TTS failed:', error);
    return null;
  }
}

export function audioToBase64DataUrl(buffer: Buffer): string {
  const base64 = buffer.toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}
