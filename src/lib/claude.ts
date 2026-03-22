import Anthropic from '@anthropic-ai/sdk';
import { getTermsList, getGlossaryByLanguage } from './cultural-glossary';
import type {
  SupportedLanguage,
  TranscriptEntry,
  VisitSummary,
  LanguagePair,
  CulturalFlag,
  DoctorReport,
  PatientReport,
} from './types';

const anthropic = new Anthropic();

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en-US': 'English',
  'ko-KR': 'Korean',
  'es-ES': 'Spanish',
};

/**
 * Strip markdown code fences from Claude responses that sometimes wrap JSON
 */
function stripMarkdown(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return cleaned.trim();
}

/**
 * Parse JSON from Claude response with retry on markdown-wrapped responses
 */
function parseClaudeJSON<T>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    // Try stripping markdown fences
    const stripped = stripMarkdown(text);
    return JSON.parse(stripped);
  }
}

export async function translateWithContext(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  speaker: 'patient' | 'provider',
  visitContext?: string
): Promise<{ translatedText: string; culturalFlag: CulturalFlag | null }> {
  const sourceName = LANGUAGE_NAMES[sourceLanguage];
  const targetName = LANGUAGE_NAMES[targetLanguage];
  const terms = getTermsList(sourceLanguage);
  const glossaryEntries = getGlossaryByLanguage(sourceLanguage);

  const termsList = terms.length > 0
    ? terms.join(', ')
    : 'No specific cultural terms registered for this language, but still watch for cultural health concepts.';

  const glossaryContext = glossaryEntries.length > 0
    ? glossaryEntries.map(e =>
      `- ${e.term} (${e.literal}): ${e.clinicalContext}`
    ).join('\n')
    : '';

  const systemPrompt = `You are a medical interpreter translating between ${sourceName} and ${targetName} in a healthcare visit.

RULES:
1. Translate the spoken content accurately, preserving medical meaning.
2. When the PATIENT speaks: simplify any medical jargon in the translation so it is understandable at a 6th grade reading level.
3. When the PROVIDER speaks: preserve clinical precision in the translation.
4. NEVER add medical advice or diagnosis. Only translate and flag cultural concepts.

CULTURAL HEALTH CONCEPT DETECTION:
Watch for these culturally specific health terms and related expressions: ${termsList}

${glossaryContext ? `GLOSSARY REFERENCE:\n${glossaryContext}\n` : ''}
When you detect a cultural health concept, idiom of distress, or folk illness term, return a cultural_flag object. Also watch for METAPHORICAL symptom descriptions that carry cultural meaning even if not in the list above.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "translatedText": "the translated text",
  "culturalFlag": null | {
    "term": "the original cultural term detected",
    "literal": "literal English translation",
    "clinicalContext": "brief clinical explanation for the provider",
    "screenFor": ["condition1", "condition2"],
    "safetyNote": null | "safety concern if any"
  }
}`;

  const userMessage = visitContext
    ? `[Context from ongoing visit:\n${visitContext}\n]\n\nThe ${speaker.toUpperCase()} says: "${text}"`
    : `The ${speaker.toUpperCase()} says: "${text}"`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const parsed = parseClaudeJSON<{
    translatedText: string;
    culturalFlag: {
      term: string;
      literal: string;
      clinicalContext: string;
      screenFor: string[];
      safetyNote: string | null;
    } | null;
  }>(content.text);

  const culturalFlag: CulturalFlag | null = parsed.culturalFlag
    ? {
        ...parsed.culturalFlag,
        originalLanguage: sourceLanguage,
      }
    : null;

  return {
    translatedText: parsed.translatedText,
    culturalFlag,
  };
}

export async function generateSummary(
  visitId: string,
  transcript: TranscriptEntry[],
  languagePair: LanguagePair
): Promise<VisitSummary> {
  const patientLang = LANGUAGE_NAMES[languagePair.patient];
  const providerLang = LANGUAGE_NAMES[languagePair.provider];

  const transcriptText = transcript
    .map(
      (entry) =>
        `[${entry.speaker.toUpperCase()}] (${LANGUAGE_NAMES[entry.culturalFlag?.originalLanguage || languagePair.patient]}): ${entry.originalText}\n→ Translation: ${entry.translatedText}${entry.culturalFlag ? `\n⚠ Cultural flag: ${entry.culturalFlag.term} — ${entry.culturalFlag.clinicalContext}` : ''}`
    )
    .join('\n\n');

  const systemPrompt = `You are a medical documentation assistant. Generate a structured bilingual visit summary from the following transcript.

The visit was between a ${patientLang}-speaking patient and a ${providerLang}-speaking provider.

Extract and return a JSON object with these fields:
{
  "chiefComplaint": "main reason for visit in ${providerLang}",
  "chiefComplaintTranslated": "main reason for visit in ${patientLang}",
  "medications": [
    {"name": "medication name", "instructions": "dosage/instructions in ${providerLang}", "instructionsTranslated": "instructions in ${patientLang}"}
  ],
  "followUps": [
    {"item": "follow-up item in ${providerLang}", "itemTranslated": "in ${patientLang}", "date": "if mentioned"}
  ],
  "warningSignsToWatchFor": [
    {"sign": "warning sign in ${providerLang}", "signTranslated": "in ${patientLang}"}
  ],
  "additionalNotes": "any other important notes in ${providerLang}",
  "additionalNotesTranslated": "notes in ${patientLang}"
}

If no medications, follow-ups, or warning signs were discussed, use empty arrays.
Respond ONLY with valid JSON, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: transcriptText }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const parsed = parseClaudeJSON<{
    chiefComplaint: string;
    chiefComplaintTranslated: string;
    medications: { name: string; instructions: string; instructionsTranslated: string }[];
    followUps: { item: string; itemTranslated: string; date?: string }[];
    warningSignsToWatchFor: { sign: string; signTranslated: string }[];
    additionalNotes: string;
    additionalNotesTranslated: string;
  }>(content.text);

  return {
    visitId,
    patientLanguage: languagePair.patient,
    providerLanguage: languagePair.provider,
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}

export async function chatWithHistory(
  message: string,
  preferredLanguage: SupportedLanguage,
  visitHistory: string
): Promise<{ reply: string; referencedVisitIds: string[] }> {
  const langName = LANGUAGE_NAMES[preferredLanguage];

  const systemPrompt = `You are a personal health assistant for a patient who uses Entune.
You have access to their past visit transcripts and summaries below.

RULES:
1. Answer questions using ONLY information from the visit history provided.
2. Respond in ${langName}.
3. Do NOT diagnose, prescribe, or give medical advice beyond what the providers stated in the visits.
4. If asked about something not in the visit history, say "I don't have that information from your visits. Please consult your healthcare provider." (in ${langName}).
5. When referencing a visit, mention the date and provider language so the patient can identify it.
6. Be warm and supportive, but stay strictly within the bounds of documented visit information.
7. At the end of your response, include a JSON line with referenced visit IDs:
   |||REFS:["visit-id-1","visit-id-2"]|||

VISIT HISTORY:
${visitHistory}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const text = content.text;
  // Extract referenced visit IDs from the |||REFS:[...]||| marker
  const refsMatch = text.match(/\|\|\|REFS:(\[.*?\])\|\|\|/);
  let referencedVisitIds: string[] = [];
  let reply = text;

  if (refsMatch) {
    try {
      referencedVisitIds = JSON.parse(refsMatch[1]);
    } catch {
      // Ignore parse errors for refs
    }
    reply = text.replace(/\|\|\|REFS:.*?\|\|\|/, '').trim();
  }

  return { reply, referencedVisitIds };
}

export async function generateDoctorReport(
  transcript: TranscriptEntry[],
  culturalFlags: CulturalFlag[],
  languagePair: LanguagePair
): Promise<Omit<DoctorReport, 'visitId'>> {
  const transcriptText = transcript
    .map(
      (e) =>
        `[${e.speaker.toUpperCase()}] ${e.originalText}\n→ ${e.translatedText}`
    )
    .join('\n\n');

  const flagsText =
    culturalFlags.length > 0
      ? culturalFlags
          .map(
            (f) =>
              `- ${f.term} (${f.literal}): ${f.clinicalContext}. Screen for: ${f.screenFor.join(', ')}${f.safetyNote ? `. Safety: ${f.safetyNote}` : ''}`
          )
          .join('\n')
      : 'None detected.';

  const systemPrompt = `You are a medical documentation assistant. Generate a SOAP-style clinical note from this bilingual visit transcript.

Return ONLY valid JSON:
{
  "subjective": "Patient's reported symptoms, concerns, and history (clinical language)",
  "objective": "Observable findings mentioned during the visit",
  "assessment": "Clinical assessment based on the conversation",
  "plan": "Follow-up items, medications, referrals discussed",
  "culturalConsiderations": "Cultural health concepts detected and their clinical relevance"
}

CULTURAL FLAGS DETECTED:
${flagsText}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: transcriptText || 'No transcript entries recorded.' }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  const parsed = parseClaudeJSON<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    culturalConsiderations: string;
  }>(content.text);

  return {
    ...parsed,
    languagePair,
    generatedAt: new Date().toISOString(),
  };
}

export async function generatePatientReport(
  transcript: TranscriptEntry[],
  language: SupportedLanguage
): Promise<Omit<PatientReport, 'visitId'>> {
  const langName = LANGUAGE_NAMES[language];

  const transcriptText = transcript
    .map(
      (e) =>
        `[${e.speaker.toUpperCase()}] ${e.originalText}\n→ ${e.translatedText}`
    )
    .join('\n\n');

  const systemPrompt = `You are a patient education assistant. Generate a simple visit summary for a patient at a 6th-grade reading level.

Provide content in BOTH ${langName} (for the patient) AND English (for the provider's records).

Return ONLY valid JSON:
{
  "summary": "Brief, simple summary in ${langName}",
  "summaryEnglish": "Same summary in English",
  "medications": [{"name": "medication name", "instructions": "simple instructions in ${langName}", "instructionsEnglish": "same instructions in English"}],
  "followUps": [{"item": "what to do next in ${langName}", "itemEnglish": "same in English", "date": "when, if mentioned"}],
  "warningSignsToWatchFor": ["simple warning sign in ${langName}"],
  "warningSignsEnglish": ["same warning sign in English"]
}

Use empty arrays if nothing was discussed. Keep language simple and reassuring.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: transcriptText || 'No transcript entries recorded.' }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

  const parsed = parseClaudeJSON<{
    summary: string;
    summaryEnglish?: string;
    medications: { name: string; instructions: string; instructionsEnglish?: string }[];
    followUps: { item: string; itemEnglish?: string; date?: string }[];
    warningSignsToWatchFor: string[];
    warningSignsEnglish?: string[];
  }>(content.text);

  return {
    ...parsed,
    language,
    generatedAt: new Date().toISOString(),
  };
}
