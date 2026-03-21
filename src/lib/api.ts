// Frontend API client — Daniel will use these to call backend endpoints
import type {
  TranslationRequest,
  TranslationResponse,
  TranscriptEntry,
  VisitSummary,
  LanguagePair,
  SupportedLanguage,
  ChatRequest,
  ChatResponse,
} from './types';

export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Translation failed: ${res.statusText}`);
  return res.json();
}

export async function textToSpeech(
  text: string,
  language: SupportedLanguage
): Promise<string | null> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.audioUrl;
}

export async function generateSummary(
  visitId: string,
  transcript: TranscriptEntry[],
  languagePair: LanguagePair
): Promise<VisitSummary> {
  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitId, transcript, languagePair }),
  });
  if (!res.ok) throw new Error(`Summary generation failed: ${res.statusText}`);
  return res.json();
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
  return res.json();
}

export async function healthCheck(): Promise<{ status: string; timestamp: number }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}
