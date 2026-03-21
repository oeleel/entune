# Claude Code Scaffold Prompt — Entune

Paste everything below the line into Claude Code.

---

I'm building Entune, a real-time medical interpreter web app for HooHacks 2026. I need the full project scaffolded and core backend functional NOW — my team joins at 5 PM and I need them to have working API endpoints and a clear directory structure to build frontend against.

Read the CLAUDE.md file in this directory first for full project context, types, and schema.

## Phase 1: Project Scaffold

### 1. Next.js 15 project with App Router
- Use `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, ESLint, and `src/` directory. Name the project `entune`.
- Use npm (not yarn or pnpm).

### 2. shadcn/ui
- Initialize shadcn/ui with `npx shadcn@latest init`. Default style, neutral colors.
- Install these components: button, card, input, label, dialog, badge, separator, skeleton, select, scroll-area, toast, sonner, tabs

### 3. Supabase client
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Create `src/lib/supabase/client.ts` — browser-side client using `createBrowserClient`
- Create `src/lib/supabase/server.ts` — server-side client using `createServerClient` with Next.js cookies
- Create `.env.local.example` with:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ANTHROPIC_API_KEY=your-claude-api-key
  ELEVENLABS_API_KEY=your-elevenlabs-api-key
  ```

### 4. Install additional dependencies
- `@anthropic-ai/sdk` — Claude API SDK
- `elevenlabs` — ElevenLabs TTS SDK
- `uuid` and `@types/uuid` — for generating visit IDs

### 5. Create the full directory structure with placeholder files

Create every file listed in the CLAUDE.md directory structure. For each file:
- Components: export a simple functional component with the name matching the filename that renders a div with the component name as text
- Hooks: export a simple hook that returns an empty object or placeholder values
- Lib files: export placeholder functions with the correct signatures from types.ts
- API routes: export working route handlers (see Phase 2 for the real implementations)

### 6. Create `src/lib/types.ts`
Copy the EXACT type definitions from the CLAUDE.md "Core Data Types" section. This is the contract between frontend and backend — it must be precise.

### 7. Create `src/lib/cultural-glossary.ts`
I have this file ready — copy it from `entune-cultural-glossary.ts` in this directory into `src/lib/cultural-glossary.ts`.

## Phase 2: Core Backend (Working API Routes)

### POST /api/translate (`src/app/api/translate/route.ts`)
This is the most critical endpoint. It must:
1. Accept a POST body matching `TranslationRequest` from types.ts
2. Import the cultural glossary and build a system prompt that includes:
   - The translation rules (medical accuracy, jargon simplification for patients, clinical precision for providers)
   - The list of cultural health terms for the source language so Claude watches for them
   - Instructions to return JSON with `translation` and optional `cultural_flag`
3. Call the Anthropic Claude API (use `claude-sonnet-4-20250514` model) with the system prompt and user message
4. Parse the Claude response to get translatedText and culturalFlag
5. Call ElevenLabs TTS with the translatedText in the target language to generate audio
6. Convert the audio to a base64 data URL (format: `data:audio/mpeg;base64,{base64data}`)
7. Return a `TranslationResponse` including the audioUrl field
8. Handle errors gracefully — if ElevenLabs fails, still return the text translation with audioUrl: null

The system prompt should be something like:
```
You are a medical interpreter translating between {sourceLanguage} and {targetLanguage} in a healthcare visit.

RULES:
1. Translate the spoken content accurately, preserving medical meaning.
2. When the PATIENT speaks: simplify any medical jargon in the translation so it is understandable at a 6th grade reading level.
3. When the PROVIDER speaks: preserve clinical precision in the translation.
4. NEVER add medical advice or diagnosis. Only translate and flag cultural concepts.

CULTURAL HEALTH CONCEPT DETECTION:
Watch for these culturally specific health terms and related expressions: {termsList}

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
}
```

### POST /api/tts (`src/app/api/tts/route.ts`)
A standalone TTS endpoint for replaying or generating speech independently:
1. Accept a POST body with `{ text: string, language: SupportedLanguage }`
2. Call ElevenLabs TTS API with the text and appropriate voice for the language
3. Return the audio as a streaming response or base64 data URL
4. Voice selection by language:
   - English (en-US): use a clear, professional voice
   - Korean (ko-KR): use a Korean-language voice
   - Spanish (es-ES): use a Latin American Spanish voice
5. Use the `eleven_multilingual_v2` model for best multilingual quality

### POST /api/summary (`src/app/api/summary/route.ts`)
1. Accept a POST body with `{ visitId: string, transcript: TranscriptEntry[], languagePair: LanguagePair }`
2. Send the full transcript to Claude (use `claude-sonnet-4-20250514`) with a system prompt asking it to generate a structured bilingual visit summary
3. The summary should extract: chief complaint (both languages), any medications mentioned (with instructions in both languages), follow-up items (both languages), and warning signs (both languages)
4. Return a `VisitSummary` object
5. Optionally save to Supabase `visit_summaries` table

### GET /api/health (`src/app/api/health/route.ts`)
Return `{ status: "ok", timestamp: Date.now() }`

### Create `src/lib/claude.ts`
A helper module that:
- Initializes the Anthropic client
- Exports a `translateWithContext()` function that builds the system prompt (including cultural glossary terms for the relevant language), calls Claude, and parses the response
- Exports a `generateSummary()` function that takes a transcript and generates a VisitSummary
- Handles JSON parsing errors with retries (Claude sometimes wraps JSON in markdown)

### Create `src/lib/elevenlabs.ts`
A helper module that:
- Exports a `textToSpeech(text: string, language: SupportedLanguage)` function
- Maps each SupportedLanguage to an appropriate ElevenLabs voice ID
- Calls the ElevenLabs TTS API (use the `eleven_multilingual_v2` model)
- Returns the audio as a Buffer
- Exports a `audioToBase64DataUrl(buffer: Buffer)` helper that converts to a playable data URL
- Handles errors gracefully — returns null if the API call fails
- NOTE: You'll need to look up available ElevenLabs voice IDs. For now, use placeholder voice IDs with a comment explaining they need to be set. Use the ElevenLabs API to list voices: `GET https://api.elevenlabs.io/v1/voices`

### Create `src/lib/speech.ts`
A utility that:
- Exports a function to initialize the Web Speech API `SpeechRecognition` for a given language code
- Handles browser compatibility (webkitSpeechRecognition fallback)
- Configures continuous recognition, interim results, and language
- Note: this will only work in Chrome — add a comment noting this

## Phase 3: Database & Auth Setup

Create a file `supabase/schema.sql` with the SQL from the CLAUDE.md Supabase Schema section (includes user_id on visits, user_profiles table, and RLS policies). I'll run this manually against Supabase.

### Supabase Auth Setup
- Create `src/app/api/auth/callback/route.ts` — handles the OAuth code exchange after Google sign-in. This route:
  1. Gets the `code` from the URL search params
  2. Calls `supabase.auth.exchangeCodeForSession(code)`
  3. Redirects to `/dashboard`
- Create `src/middleware.ts` at the root of `src/` that uses the Supabase middleware helper to refresh auth tokens on every request
- Create `src/lib/supabase/middleware.ts` with the `updateSession` helper that creates a server Supabase client and refreshes the session via cookies

### POST /api/chat (`src/app/api/chat/route.ts`)
This is the visit history AI assistant. It must:
1. Accept a POST body matching `ChatRequest` from types.ts
2. Verify the user is authenticated (get user from Supabase session)
3. Fetch the user's visit summaries from the `visit_summaries` table (joined with `visits` for dates/languages)
4. Also fetch any relevant transcript entries if the summaries aren't enough context
5. Serialize the visit history into a string context block
6. Send to Claude with a system prompt that:
   - Instructs it to answer ONLY from the user's visit history
   - Responds in the user's preferred language
   - Does NOT give medical advice beyond what providers stated
   - References specific visit dates when citing information
7. Return a `ChatResponse` with the reply and referenced visit IDs
8. Handle the case where the user has no visit history gracefully

### Create `src/lib/claude.ts` (updated)
A helper module that:
- Initializes the Anthropic client
- Exports a `translateWithContext()` function that builds the system prompt (including cultural glossary terms for the relevant language), calls Claude, and parses the response
- Exports a `generateSummary()` function that takes a transcript and generates a VisitSummary
- Exports a `chatWithHistory()` function that takes a user message + serialized visit history and returns a chat response in the user's preferred language
- Handles JSON parsing errors with retries (Claude sometimes wraps JSON in markdown)

## Phase 4: Frontend Shells (Minimal Working Pages)

### Landing page (`src/app/page.tsx`)
A clean landing page with:
- "Entune" as the title
- A subtitle: "Where every patient is understood."
- A "Sign in with Google" button (primary CTA) OR "Start Visit" if already signed in
- Keep it simple and clean using shadcn/ui components

### Login page (`src/app/login/page.tsx`)
A simple page with:
- Entune logo/title
- "Sign in with Google" button that calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Redirect to /dashboard after success

### Dashboard page (`src/app/dashboard/page.tsx`)
Protected page (redirect to /login if not authenticated). Shows:
- User greeting with avatar from Google
- "Start New Visit" button linking to /visit
- "Your Visit History" section with a list of past visit cards (date, languages, chief complaint from summary)
- AI Chat section at the bottom — a chat input where the user can ask questions about their visit history
- Chat messages display area above the input
- Placeholder data for the shell — we'll wire real data later

### Visit page (`src/app/visit/page.tsx`)
A page shell with:
- A language selector (dropdown for patient language, provider language is English by default)
- A "Start Listening" button
- Two columns or sections: "Provider (English)" on one side, "Patient ({language})" on the other
- A placeholder area where transcript entries will appear
- A placeholder area where cultural flag cards will appear
- A small audio indicator showing when TTS is playing (speaker icon)
- An "End Visit & Generate Summary" button
- This is the SHELL only — Daniel will wire the Web Speech API, translation API calls, and audio playback
- On "End Visit", the visit and transcript should be saved to Supabase linked to the current user

### Summary page (`src/app/summary/[id]/page.tsx`)
A page shell with:
- Two-column layout: provider language on left, patient language on right
- Sections for: Chief Complaint, Medications, Follow-Up Items, Warning Signs
- A "Back to Dashboard" link
- A "Download PDF" button (placeholder — we'll implement later if time permits)
- Placeholder data showing what the summary will look like

## Phase 5: Verification
- Run `npm run build` — fix all errors
- Run `npm run dev` — verify all pages render
- Test `/api/health` returns OK
- Test `/api/translate` with a curl command:
  ```
  curl -X POST http://localhost:3000/api/translate \
    -H "Content-Type: application/json" \
    -d '{"text": "화병인 것 같아요", "sourceLanguage": "ko-KR", "targetLanguage": "en-US", "speaker": "patient"}'
  ```
  Verify it returns a translation WITH a cultural flag for 화병 AND an audioUrl field (base64 audio data or null if ElevenLabs key isn't set yet).
- Test `/api/translate` with a normal sentence (no cultural term) and verify cultural_flag is null.
- Test `/api/tts` with a curl command:
  ```
  curl -X POST http://localhost:3000/api/tts \
    -H "Content-Type: application/json" \
    -d '{"text": "The patient reports chest tightness and difficulty sleeping.", "language": "en-US"}'
  ```
  Verify it returns audio data (or a clear error if the ElevenLabs key isn't configured yet).

## Phase 6: Git Setup
- Initialize git with a proper `.gitignore` (node_modules, .next, .env.local, .env*.local, .vercel)
- Make an initial commit: "initial scaffold: entune with claude + elevenlabs translation API"
- DO NOT push — I'll add the remote myself.

After all of this, give me:
1. A summary of what was created
2. The curl test results for the translate and TTS APIs
3. Any files that need manual setup (env vars, Supabase schema, ElevenLabs voice IDs)
4. What the team needs to do when they arrive at 5 PM
