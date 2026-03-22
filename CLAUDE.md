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
A two-device system where doctor and patient each use their own screen during a medical visit. The app:
1. **Session model:** Doctor creates a session (picks languages) → gets a 6-digit join code → patient enters code on their device to join
2. **Live translated subtitles:** Both sides see a real-time bilingual transcript powered by Claude API — each person speaks in their language and reads the translation on screen
3. **Cultural bridging:** Detects culturally specific health concepts (화병, nervios, etc.) and flags them with clinical context for the provider
4. **Jargon simplification:** Patient-facing translations simplify medical jargon; provider-facing translations preserve clinical precision
5. **Dual reports on session end:** Doctor gets a SOAP note; patient gets a simplified summary with medications, follow-ups, and warning signs — each in their own language
6. **Memory layer:** Doctors sign in with Google OAuth. All visits are saved to their account. A dashboard shows visit history, and an AI chat lets users ask questions about past visits in their preferred language
7. **Hold-to-speak:** Push-to-talk interaction model for clear turn-taking

### Deferred / Future
- **Voice output (ElevenLabs TTS):** Code exists in `src/lib/elevenlabs.ts` but is disabled. The `/api/translate` route returns `audioUrl: null`. Will re-enable when we integrate streaming TTS
- **Presage emotional sensing:** Stretch goal — camera-based patient stress detection via Presage API
- **Audio player component:** `src/components/visit/audio-player.tsx` exists but is not active without TTS

## Supported Languages (MVP)
- English (en-US)
- Korean (ko-KR)
- Spanish (es-ES)

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui
- **Backend/DB:** Supabase (Postgres, real-time subscriptions for live transcript sync)
- **Auth:** Supabase Auth (Google OAuth + email/password sign-in)
- **AI Translation:** Claude API (medical-context translation, cultural bridging, jargon simplification, dual report generation, visit history chat)
- **Speech Recognition:** Web Speech API (browser-native, no external STT service)
- **Deploy:** Vercel
- **Package Manager:** npm

**Deferred:**
- **Voice Output:** ElevenLabs Streaming TTS API (code in `src/lib/elevenlabs.ts`, disabled)
- **Emotional Sensing:** Presage API (stretch goal)

## Prize Tracks We're Submitting To
1. **Health & Wellness** (primary track)
2. **Accessibility & Empowerment** (secondary track)
3. **Best Use of Presage** (sponsor prize — if we integrate it)

## Team & File Ownership
- **Leo:** Backend, infra, API routes, Supabase, Claude API integration, Auth setup, `src/app/api/`, `src/lib/`, `CLAUDE.md`
- **Daniel:** Integration, API client wiring, hooks, state management, `src/lib/api.ts`, `src/hooks/`, `src/components/shared/`
- **Hailey:** Frontend UI, `src/components/visit/`, `src/app/page.tsx` (landing), `src/app/login/` (login page)
- **Elliot:** Frontend UI, `src/components/summary/`, `src/components/dashboard/`, `src/app/visit/`, `src/app/dashboard/`, `src/app/summary/`, `src/app/session/`

## Session Flow
1. Doctor signs in → dashboard → creates session (picks patient + provider languages) → gets 6-digit join code
2. Patient navigates to `/join` → enters join code (+ optional name/email) → joins session
3. Session status transitions: `waiting` → `active` (patient joins) → `ended` (doctor ends)
4. Both sides see live translated transcript via Supabase real-time subscriptions on `transcript_entries`
5. Hold-to-speak: user holds button → Web Speech API captures speech → sent to `/api/translate` → result inserted into `transcript_entries` → both devices update in real-time
6. Doctor ends session → `/api/session/end` generates both reports in parallel (SOAP for doctor, simplified for patient) → saved to `visit_summaries`

## Directory Structure
```
src/
  app/
    layout.tsx                      # Root layout with auth session provider
    page.tsx                        # Landing page (Hailey)
    login/
      page.tsx                      # Login page — email/password + Google OAuth (Hailey)
    join/
      page.tsx                      # Patient join page — enter 6-digit code (Hailey)
    dashboard/
      page.tsx                      # Doctor dashboard — visit history + AI chat (Elliot)
    session/
      doctor/
        page.tsx                    # Doctor session view — transcript + controls (Elliot)
      patient/
        page.tsx                    # Patient session view — transcript + hold-to-speak (Elliot)
    visit/
      page.tsx                      # Legacy visit page (may redirect to session flow)
    summary/
      [id]/
        page.tsx                    # Post-visit bilingual summary (Elliot)
    api/
      session/
        create/
          route.ts                  # POST: doctor creates session, returns joinCode
        join/
          route.ts                  # POST: patient joins session by code
        end/
          route.ts                  # POST: doctor ends session, generates dual reports
      translate/
        route.ts                    # POST: Claude translation + cultural flag (TTS disabled)
      tts/
        route.ts                    # POST: stub — returns { audioUrl: null } (deferred)
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
      audio-player.tsx              # Deferred: TTS audio playback (Hailey)
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
    claude.ts                       # Claude API helper (translation, chat, dual report generation)
    elevenlabs.ts                   # Deferred: ElevenLabs TTS helper (kept for future use)
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
    use-hold-to-speak.ts            # Hook for push-to-talk interaction (Daniel)
    use-realtime-transcript.ts      # Hook for Supabase real-time transcript subscription (Daniel)
    use-session-status.ts           # Hook for tracking session status changes (Daniel)
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
  audioUrl: string | null; // Always null — TTS deferred
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
  id: string;
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
  referencedVisitIds?: string[];
};

export type ChatRequest = {
  message: string;
  userId: string;
  preferredLanguage: SupportedLanguage;
  visitId?: string; // scope to single visit when provided
};

export type ChatResponse = {
  reply: string;
  referencedVisitIds: string[];
};

// --- Two-Device Doctor/Patient Session Model ---

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
-- Visit sessions (linked to authenticated doctor)
create table visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  join_code text,                    -- 6-digit code for patient to join
  status text default 'waiting',     -- 'waiting' | 'active' | 'ended'
  language_patient text not null,
  language_provider text not null,
  patient_name text,                 -- set when patient joins
  patient_email text,                -- set when patient joins
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Transcript entries (synced in real-time via Supabase subscriptions)
create table transcript_entries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  speaker text not null check (speaker in ('patient', 'provider')),
  original_text text not null,
  translated_text text not null,
  cultural_flag jsonb,
  timestamp timestamptz default now()
);

-- Generated reports (doctor SOAP + patient summary)
create table visit_summaries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  summary_data jsonb not null,       -- legacy field (empty object for new sessions)
  doctor_report jsonb,               -- SOAP note for provider
  patient_report jsonb,              -- simplified summary for patient
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
- Email/password sign-in is also enabled
- Set the redirect URL in Google Console to: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
- In the Next.js app, the `/api/auth/callback/route.ts` handles the OAuth code exchange
- The middleware (`src/middleware.ts`) refreshes the session on every request
- Protected pages (dashboard, session) check for auth and redirect to /login if not authenticated

## Key API Routes

### POST /api/session/create
- Auth: requires authenticated user (doctor)
- Input: `{ patientLanguage: SupportedLanguage, providerLanguage: SupportedLanguage }`
- Output: `{ visitId: string, joinCode: string }`
- Creates a new visit with status `waiting` and a random 6-digit join code

### POST /api/session/join
- Auth: none (patient joins without account)
- Input: `{ joinCode: string, patientName?: string, patientEmail?: string }`
- Output: `{ visitId: string, patientLanguage: SupportedLanguage, providerLanguage: SupportedLanguage }`
- Finds visit by join code, updates status to `active`, stores patient info

### POST /api/session/end
- Auth: requires authenticated user (doctor, must own the visit)
- Input: `{ visitId: string }`
- Output: `{ doctorReport: DoctorReport, patientReport: PatientReport }`
- Ends the visit, fetches transcript, generates both reports in parallel via Claude, saves to `visit_summaries`

### POST /api/translate
- Input: TranslationRequest
- Output: TranslationResponse (audioUrl is always null — TTS deferred)
- Calls Claude API with medical translation system prompt
- Returns translation + optional cultural flag

### POST /api/tts
- **Deferred** — returns `{ audioUrl: null, message: "TTS is not enabled" }`
- Will integrate ElevenLabs streaming TTS when re-enabled

### POST /api/summary
- Input: `{ visitId: string, transcript: TranscriptEntry[] }`
- Output: VisitSummary
- Calls Claude API to generate structured bilingual summary from full transcript

### POST /api/chat
- Input: ChatRequest (message, userId, preferredLanguage, optional visitId)
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

## Presage Integration (STRETCH GOAL)
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
1. **Sign in** with Google or email/password (quick, shows auth is real)
2. **Create session** as doctor — pick Korean-English — show the 6-digit code
3. **Patient joins** on second device — enters code → both see the session go active
4. **Korean-English visit**: Patient says "화병인 것 같아요" → cultural flag pops up → translated text appears on both screens in real time
5. **End visit** → dual reports generate (SOAP for doctor, simplified for patient)
6. **Spanish-English visit** (shorter): Patient mentions "nervios" → cultural flag pops up → translation displayed
7. **Dashboard**: Show visit history with both visits listed as cards
8. **AI Chat**: Ask "What did the doctor say about my medication?" in Korean → get a personalized answer pulled from visit history, responded to in Korean
9. If Presage is integrated: show stress indicator rising during a visit

The memory/chat feature is the closing "wow" — judges realize this isn't just a translator, it's a persistent health companion that remembers every visit and speaks your language.

## Important Notes
- Web Speech API only works in Chrome (demo in Chrome)
- Web Speech API requires HTTPS in production (Vercel handles this)
- Keep Claude API calls as fast as possible — use claude-sonnet-4-20250514 for translation, same for report generation
- The cultural glossary is included in the system prompt so Claude knows to watch for these terms specifically
- All translations should feel natural, not robotic — this is a medical conversation, not a phrasebook
- Presage integration is a STRETCH GOAL — do not start it until core features are polished
- TTS (ElevenLabs) is deferred — code exists in `src/lib/elevenlabs.ts` but is not called

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
```

### Optional / Deferred
```
ELEVENLABS_API_KEY=your-elevenlabs-api-key   # Not needed until TTS is re-enabled
```
