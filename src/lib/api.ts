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
import type { PatientUiLanguage } from '@/lib/patient-languages';

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

// Session API client functions

export async function createSession(
  patientLanguage: SupportedLanguage,
  providerLanguage: SupportedLanguage
): Promise<{ visitId: string; joinCode: string }> {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientLanguage, providerLanguage }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Create session failed: ${res.statusText}`);
  }
  return res.json();
}

export async function joinSession(
  joinCode: string,
  patientName: string,
  patientEmail: string,
  patientLanguage: PatientUiLanguage
): Promise<{ visitId: string; patientLanguage: string; providerLanguage: string }> {
  const res = await fetch('/api/session/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ joinCode, patientName, patientEmail, patientLanguage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err.error === 'string' ? err.error : `Join session failed: ${res.statusText}`
    );
  }
  return res.json();
}

export async function updatePatientSessionLanguage(
  visitId: string,
  patientLanguage: PatientUiLanguage
): Promise<void> {
  const res = await fetch('/api/session/patient-language', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitId, patientLanguage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      typeof err.error === 'string' ? err.error : `Language update failed: ${res.statusText}`
    );
  }
}

export async function endSession(
  visitId: string
): Promise<{ visitId: string }> {
  const res = await fetch('/api/session/end', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitId }),
  });
  if (!res.ok) throw new Error(`End session failed: ${res.statusText}`);
  return res.json();
}

export async function deleteVisits(
  visitIds: string[]
): Promise<{ deleted: string[]; count: number }> {
  const res = await fetch('/api/visits/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitIds }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Delete visits failed: ${res.statusText}`);
  }
  return res.json();
}
