# CLAUDE.md — Entune Project Context

<!-- AGENT INSTRUCTION: Skill auto-invocation
     This project uses skills in .claude/skills/. When auto_invoke_skills is true
     in .pm/config.json (default), you should:

     1. INVOKE skills automatically based on user intent — don't wait for slash commands.
        Match the user's message against each skill's YAML description field.
     2. PATTERN SKILLS (react-best-practices, web-design-guidelines) are ambient:
        automatically consult them as reference when writing or reviewing relevant code.
        They provide passive guidance — no need for the user to invoke them explicitly.
     3. MULTIPLE SKILLS can apply at once. Prefer false positives over false negatives —
        it's better to consult a skill that wasn't needed than to miss one that was.
     4. Check .pm/config.json: if auto_invoke_skills is false, only invoke skills
        via explicit /slash-commands. If a skill name appears in the disabled_skills
        array, skip it even when it would otherwise match.
     5. Agent skills (pm-agent, tdd-agent, bug-workflow) take over the conversation
        with a full workflow. Pattern skills add context without disrupting flow. -->

## Framework

This project uses the N2O workflow system. Skills in `.claude/skills/` are auto-invoked based on context:

**Agent skills** (invoked on matching intent):
- `/pm-agent` — sprint planning, scoping, task breakdown
- `/tdd-agent` — TDD implementation of sprint tasks
- `/bug-workflow` — bug investigation and root cause analysis
- `/frontend-review` — multi-agent UI quality review (programmatic + vision + interaction)
- `/code-health` — codebase quality audit (file length, dead exports, circular deps)

**Pattern skills** (ambient — consulted automatically during relevant work):
- `/react-best-practices` — React/Next.js performance patterns
- `/web-design-guidelines` — UI accessibility and design patterns
- `/ux-heuristics` — 28 principle-based UX heuristic rules

Auto-invocation can be toggled in `.pm/config.json` (`auto_invoke_skills`, `disabled_skills`).

Task database: `.pm/tasks.db`
Config: `.pm/config.json`

## Project
Entune — Real-time, medically-aware, bilingual translation for healthcare visits.
HooHacks 2026 hackathon project. Track: Health & Wellness.

## What It Does
Patient and provider speak naturally in their own language during a medical visit. The app:
1. Provides live translated subtitles on screen in both languages
2. Speaks the translation aloud in a natural human voice via ElevenLabs streaming TTS
3. Detects culturally specific health concepts and flags them with clinical context for the provider
4. Simplifies medical jargon in the patient-facing direction
5. Generates a bilingual visit summary (PDF) at the end with medications, follow-ups, and instructions
6. **Memory layer:** Users sign in with Google, and all visits are saved to their account. A personal health dashboard shows visit history, and an AI chat lets patients ask questions about their past visits in their preferred language (e.g., "What medication did the doctor prescribe last week?" or "What were the warning signs I was told to watch for?")
7. **Stretch goal:** Monitors patient emotional state via camera (Presage API) and alerts provider to elevated stress

## Supported Languages (MVP)
- English (en-US)
- Korean (ko-KR)
- Spanish (es-ES)

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (Postgres, real-time)
- **Auth:** Supabase Auth (Google OAuth sign-in)
- **AI Translation:** Claude API (medical-context translation, cultural bridging, jargon simplification, summary generation, visit history chat)
- **Voice Output:** ElevenLabs Streaming TTS API (natural-sounding multilingual voice synthesis)
- **Speech Recognition:** Web Speech API (browser-native, no external STT service)
- **Stretch Goal — Emotional Sensing:** Presage API (camera-based patient stress/emotional state detection)
- **Deploy:** Vercel
- **Package Manager:** npm

## Prize Tracks We're Submitting To
1. **Health & Wellness** (primary track)
2. **Accessibility & Empowerment** (secondary track)
3. **Best Use of ElevenLabs** (sponsor prize — Beats Solo Earbuds)
4. **Best Use of Presage** (sponsor prize — if we integrate it)

## Team & File Ownership
- **Leo:** Backend, infra, API routes, Supabase, Claude API integration, Auth setup, `src/app/api/`, `src/lib/`, `CLAUDE.md`
- **Daniel:** Integration, API client wiring, hooks, state management, `src/lib/api.ts`, `src/hooks/`, `src/components/shared/`
- **Hailey:** Frontend UI, `src/components/visit/`, `src/app/page.tsx` (landing), `src/app/login/` (login page)
- **Elliot:** Frontend UI, `src/components/summary/`, `src/components/dashboard/`, `src/app/visit/`, `src/app/dashboard/`, `src/app/summary/`

## Directory Structure
```
src/
  app/
    layout.tsx                      # Root layout with auth session provider
    page.tsx                        # Landing page (Hailey)
    login/
      page.tsx                      # Login page with Google sign-in (Hailey)
    dashboard/
      page.tsx                      # Visit history + AI chat (Elliot)
    visit/
      page.tsx                      # Main visit/translation page (Elliot)
    summary/
      [id]/
        page.tsx                    # Post-visit bilingual summary (Elliot)
    api/
      translate/
        route.ts                    # POST: sends speech text to Claude for translation + cultural flag detection
      tts/
        route.ts                    # POST: sends translated text to ElevenLabs, returns streaming audio
      summary/
        route.ts                    # POST: generates bilingual visit summary from transcript
      chat/
        route.ts                    # POST: AI chat about past visits (RAG over visit history)
      auth/
        callback/
          route.ts                  # Supabase Auth OAuth callback handler
      health/
        route.ts                    # GET: health check
  components/
    ui/                             # shadcn (auto-generated)
    visit/
      transcript-display.tsx        # Live bilingual subtitle display (Hailey)
      cultural-flag-card.tsx        # Cultural context popup card (Hailey)
      language-selector.tsx         # Language pair picker (Hailey)
      recording-controls.tsx        # Start/stop visit controls (Hailey)
      audio-player.tsx              # Plays ElevenLabs TTS audio for each translation (Hailey)
      stress-indicator.tsx          # Stretch: Presage stress level display (Hailey)
    summary/
      summary-view.tsx              # Bilingual PDF-ready summary (Elliot)
      medication-list.tsx           # Extracted medications display (Elliot)
      followup-list.tsx             # Follow-up items display (Elliot)
    dashboard/
      visit-history-list.tsx        # List of past visits as cards (Elliot)
      visit-card.tsx                # Single visit card (date, languages, chief complaint) (Elliot)
      chat-interface.tsx            # AI chat input + message display (Elliot)
      chat-message.tsx              # Single chat message bubble (Elliot)
    shared/
      loading-spinner.tsx           # Reusable spinner (Daniel)
      error-display.tsx             # Reusable error display (Daniel)
      auth-guard.tsx                # Redirects to /login if not authenticated (Daniel)
      user-nav.tsx                  # User avatar + sign out button for nav bar (Daniel)
  lib/
    supabase/
      client.ts                     # Browser Supabase client
      server.ts                     # Server Supabase client
      middleware.ts                 # Supabase auth middleware helper
    claude.ts                       # Claude API helper (translation, chat, summary generation)
    elevenlabs.ts                   # ElevenLabs TTS helper (streaming audio generation)
    presage.ts                      # Stretch: Presage API helper (stress/emotion detection)
    cultural-glossary.ts            # Cultural health concepts data by language
    speech.ts                       # Web Speech API wrapper (recognition setup per language)
    api.ts                          # Frontend API client (Daniel)
    types.ts                        # Shared types (Leo only writes, everyone reads)
    utils.ts                        # cn utility from shadcn
  middleware.ts                     # Next.js middleware for auth session refresh (root of src/)
  hooks/
    use-speech-recognition.ts       # Hook wrapping Web Speech API (Daniel)
    use-translation.ts              # Hook calling /api/translate (Daniel)
    use-visit-session.ts            # Hook managing visit state and transcript (Daniel)
    use-chat.ts                     # Hook managing chat state and /api/chat calls (Daniel)
    use-user.ts                     # Hook to get current authenticated user (Daniel)
```

## Core Data Types (types.ts)
```typescript
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
```

## Claude API System Prompt (for /api/translate)
The translation endpoint sends each utterance to Claude with a system prompt that:
1. Translates accurately preserving medical meaning
2. When patient speaks: simplifies medical jargon in translation
3. When provider speaks: preserves clinical precision
4. Watches for cultural health concepts and returns a cultural_flag if detected
5. Returns structured JSON (translation + optional cultural flag)

## Supabase Schema
```sql
-- Visit sessions (linked to authenticated user)
create table visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  language_patient text not null,
  language_provider text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Transcript entries
create table transcript_entries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  speaker text not null check (speaker in ('patient', 'provider')),
  original_text text not null,
  translated_text text not null,
  cultural_flag jsonb,
  timestamp timestamptz default now()
);

-- Generated summaries
create table visit_summaries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  summary_data jsonb not null,
  generated_at timestamptz default now()
);

-- User preferences (preferred language, etc.)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text default 'en-US',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies: users can only access their own data
alter table visits enable row level security;
alter table transcript_entries enable row level security;
alter table visit_summaries enable row level security;
alter table user_profiles enable row level security;

create policy "Users can view own visits" on visits for select using (auth.uid() = user_id);
create policy "Users can insert own visits" on visits for insert with check (auth.uid() = user_id);
create policy "Users can update own visits" on visits for update using (auth.uid() = user_id);

create policy "Users can view own transcripts" on transcript_entries for select
  using (visit_id in (select id from visits where user_id = auth.uid()));
create policy "Users can insert own transcripts" on transcript_entries for insert
  with check (visit_id in (select id from visits where user_id = auth.uid()));

create policy "Users can view own summaries" on visit_summaries for select
  using (visit_id in (select id from visits where user_id = auth.uid()));
create policy "Users can insert own summaries" on visit_summaries for insert
  with check (visit_id in (select id from visits where user_id = auth.uid()));

create policy "Users can view own profile" on user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on user_profiles for insert with check (auth.uid() = id);
```

## Supabase Auth Setup
- Enable Google OAuth in Supabase Dashboard → Authentication → Providers → Google
- You need a Google Cloud OAuth client ID and secret (create at console.cloud.google.com)
- Set the redirect URL in Google Console to: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- In the Next.js app, the `/api/auth/callback/route.ts` handles the OAuth code exchange
- The middleware (`src/middleware.ts`) refreshes the session on every request
- Protected pages (dashboard, visit) should check for auth and redirect to /login if not authenticated

## Key API Routes

### POST /api/translate
- Input: TranslationRequest
- Output: TranslationResponse (including audioUrl from ElevenLabs)
- Calls Claude API with medical translation system prompt
- Returns translation + optional cultural flag
- After getting translation, calls ElevenLabs to generate TTS audio
- Returns audio as a base64 data URL or a temporary URL the client can play

### POST /api/tts
- Input: { text: string, language: SupportedLanguage }
- Output: Audio stream or base64 audio data
- Standalone TTS endpoint using ElevenLabs streaming API
- Used if we want to decouple TTS from translation (e.g., for replaying)
- Voice selection: use a different ElevenLabs voice per language for natural feel

### POST /api/summary
- Input: { visitId: string, transcript: TranscriptEntry[] }
- Output: VisitSummary
- Calls Claude API to generate structured bilingual summary from full transcript

### POST /api/chat
- Input: ChatRequest (message, userId, preferredLanguage)
- Auth: requires authenticated user (verify via Supabase session)
- Process:
  1. Fetch the user's past visit summaries and recent transcript entries from Supabase
  2. Serialize them as context for Claude
  3. Send to Claude with a system prompt that instructs it to answer ONLY from the user's visit history, in their preferred language, without giving medical advice beyond what providers already told them
  4. Return ChatResponse with the reply and which visit IDs were referenced
- The system prompt for chat:
  ```
  You are a personal health assistant for a patient who uses Entune.
  You have access to their past visit transcripts and summaries below.

  RULES:
  1. Answer questions using ONLY information from the visit history provided.
  2. Respond in {preferredLanguage}.
  3. Do NOT diagnose, prescribe, or give medical advice beyond what the providers stated in the visits.
  4. If asked about something not in the visit history, say "I don't have that information from your visits. Please consult your healthcare provider."
  5. When referencing a visit, mention the date and provider language so the patient can identify it.
  6. Be warm and supportive, but stay strictly within the bounds of documented visit information.

  VISIT HISTORY:
  {serialized summaries and key transcript excerpts}
  ```

### GET /api/auth/callback
- Handles the Supabase OAuth callback after Google sign-in
- Exchanges the code for a session and redirects to /dashboard

### GET /api/health
- Output: { status: "ok", timestamp: number }

## ElevenLabs Integration
- API Docs: https://elevenlabs.io/docs/api-reference
- Use the streaming TTS endpoint for lowest latency
- Select appropriate voices per language:
  - English: use a clear, professional American English voice
  - Korean: use a Korean voice (ElevenLabs supports Korean)
  - Spanish: use a Latin American Spanish voice
- The /api/translate route should call ElevenLabs AFTER getting the Claude translation, then return both the text and audio together
- On the frontend, the audio-player component auto-plays the audio when a new translation arrives
- IMPORTANT: Set `ELEVENLABS_API_KEY` in `.env.local`
- Use the `eleven_turbo_v2_5` or latest multilingual model for best quality + speed

## Presage Integration (STRETCH GOAL — Only if ahead of schedule by midnight)
- API Docs: https://mlh.link/presage
- Presage uses the user's webcam to detect vital signs and emotional state
- Integration plan:
  1. Add a webcam feed component on the visit page (patient side)
  2. Periodically send frames to Presage API
  3. Display a subtle stress indicator on the provider side
  4. If stress spikes above threshold, show an alert: "Patient stress elevated — consider pausing"
- This does NOT block the core product — it's an enhancement layer

## Cultural Glossary
Located in `src/lib/cultural-glossary.ts`. Contains curated entries for:
- Korean: 화병, 신병, 한, 체했다, 기가 막히다, 홧김, 입맛이 없다, 속이 상하다, 몸이 무겁다, 열이 오르다
- Spanish: nervios, susto, empacho, mal de ojo, ataque de nervios, bilis, cólera, aire, caída de mollera, fatiga

These serve as a trigger list for the demo. The LLM will also catch unlisted cultural terms from its training data.

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint

## Demo Plan
Screen Studio recording (~2.5–3 min):
1. **Sign in** with Google (quick, shows auth is real)
2. **Korean-English visit**: Patient says "화병인 것 같아요" → cultural flag pops up → translation is SPOKEN aloud in natural English via ElevenLabs
3. **End visit** → bilingual summary generates
4. **Spanish-English visit** (shorter): Patient mentions "nervios" → cultural flag pops up → translation spoken
5. **Dashboard**: Show visit history with both visits listed as cards
6. **AI Chat**: Ask "What did the doctor say about my medication?" in Korean → get a personalized answer pulled from visit history, responded to in Korean
7. If Presage is integrated: show stress indicator rising during a visit

The memory/chat feature is the closing "wow" — judges realize this isn't just a translator, it's a persistent health companion that remembers every visit and speaks your language.

## Important Notes
- Web Speech API only works in Chrome (demo in Chrome)
- Web Speech API requires HTTPS in production (Vercel handles this)
- Keep Claude API calls as fast as possible — use claude-sonnet-4-20250514 for translation, same for summary generation
- ElevenLabs streaming TTS should start playing audio before the full response is received — use their streaming endpoint
- The cultural glossary is included in the system prompt so Claude knows to watch for these terms specifically
- All translations should feel natural, not robotic — this is a medical conversation, not a phrasebook
- ElevenLabs API key goes in `.env.local` as `ELEVENLABS_API_KEY`
- Presage integration is a STRETCH GOAL — do not start it until core features are polished

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```
