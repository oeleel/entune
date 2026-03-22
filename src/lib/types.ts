export type SupportedLanguage = 'en-US' | 'ko-KR' | 'es-ES';

export type LanguagePair = {
  patient: SupportedLanguage;
  provider: SupportedLanguage;
};

export type TranslationRequest = {
  text: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  speaker: 'patient' | 'provider';
  visitContext?: string; // running transcript for context
};

export type CulturalFlag = {
  term: string;
  originalLanguage: SupportedLanguage;
  literal: string;
  clinicalContext: string;
  screenFor: string[];
  safetyNote: string | null;
};

export type TranslationResponse = {
  originalText: string;
  translatedText: string;
  speaker: 'patient' | 'provider';
  culturalFlag: CulturalFlag | null;
  audioUrl: string | null; // ElevenLabs TTS audio URL for the translated text
  timestamp: string;
};

export type TranscriptEntry = TranslationResponse;

export type VisitSession = {
  id: string;
  languagePair: LanguagePair;
  transcript: TranscriptEntry[];
  culturalFlags: CulturalFlag[];
  startedAt: string;
  endedAt: string | null;
};

export type VisitSummary = {
  visitId: string;
  patientLanguage: SupportedLanguage;
  providerLanguage: SupportedLanguage;
  chiefComplaint: string;
  chiefComplaintTranslated: string;
  medications: { name: string; instructions: string; instructionsTranslated: string }[];
  followUps: { item: string; itemTranslated: string; date?: string }[];
  warningSignsToWatchFor: { sign: string; signTranslated: string }[];
  additionalNotes: string;
  additionalNotesTranslated: string;
  generatedAt: string;
};

// Auth
export type UserProfile = {
  id: string; // Supabase auth user ID
  email: string;
  name: string;
  avatarUrl: string | null;
  preferredLanguage: SupportedLanguage;
};

// Chat (visit history AI assistant)
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  referencedVisitIds?: string[]; // which visits the AI cited in its response
};

export type ChatRequest = {
  message: string;
  userId: string;
  preferredLanguage: SupportedLanguage; // respond in this language
};

export type ChatResponse = {
  reply: string;
  referencedVisitIds: string[];
};

// --- Pivot: Two-Device Doctor/Patient Model ---

export type SessionStatus = 'waiting' | 'active' | 'ended';

export type Session = {
  id: string;
  userId: string;
  joinCode: string;
  status: SessionStatus;
  languagePatient: SupportedLanguage;
  languageProvider: SupportedLanguage;
  patientName: string | null;
  patientEmail: string | null;
  startedAt: string;
  endedAt: string | null;
};

export type DoctorReport = {
  visitId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  culturalConsiderations: string;
  languagePair: LanguagePair;
  generatedAt: string;
};

export type PatientReport = {
  visitId: string;
  summary: string;
  medications: { name: string; instructions: string }[];
  followUps: { item: string; date?: string }[];
  warningSignsToWatchFor: string[];
  language: SupportedLanguage;
  generatedAt: string;
};
