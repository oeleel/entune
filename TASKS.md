# Entune — Task Board

## Done

- [x] **Leo** — Next.js 15 + Tailwind + shadcn/ui scaffold
- [x] **Leo** — Supabase schema, auth, RLS policies
- [x] **Leo** — `POST /api/translate` (Claude + cultural flags + ElevenLabs TTS)
- [x] **Leo** — `POST /api/tts` (standalone text-to-speech)
- [x] **Leo** — `POST /api/summary` (bilingual visit summary)
- [x] **Leo** — `POST /api/chat` (AI chat over visit history)
- [x] **Leo** — `GET /api/health`
- [x] **Leo** — All lib modules (`claude.ts`, `elevenlabs.ts`, `speech.ts`, `api.ts`, `types.ts`, `cultural-glossary.ts`)
- [x] **Leo** — All hooks (`useSpeechRecognition`, `useTranslation`, `useVisitSession`, `useChat`, `useUser`)
- [x] **Leo** — All frontend page shells (landing, login, dashboard, visit, summary)
- [x] **Leo** — All placeholder components
- [x] **Leo** — Vercel deployment (`entune.vercel.app`)
- [x] **Leo** — GitHub repo (`oeleel/entune`)

---

## In Progress

- [ ] **Leo** — Fix Google OAuth sign-in (debug redirect URIs)

---

## Daniel — Integration & Hooks

- [ ] Wire visit page: `useSpeechRecognition` → `useTranslation` → `useVisitSession` pipeline
  - When speech is final, call `/api/translate`
  - Add translation result to transcript display
  - Auto-play `audioUrl` from response via `AudioPlayer` component
- [ ] Wire "End Visit" button: save visit + transcript to Supabase, call `/api/summary`, redirect to `/summary/[id]`
- [ ] Wire chat on dashboard: connect `useChat` hook with real authenticated user ID

### Key Files
- `src/hooks/use-speech-recognition.ts`
- `src/hooks/use-translation.ts`
- `src/hooks/use-visit-session.ts`
- `src/hooks/use-chat.ts`
- `src/lib/api.ts` (frontend API client — ready to use)

---

## Hailey — Frontend UI (Visit + Landing)

- [ ] Polish visit page UI (`src/app/visit/page.tsx`)
  - Style transcript display for clear bilingual readability
  - Style cultural flag cards (make them visually prominent)
  - Style recording controls (clear start/stop state)
  - Style language selector
- [ ] Polish landing page (`src/app/page.tsx`)
  - Make it visually impressive for judges
  - Add brief feature highlights
- [ ] Polish login page (`src/app/login/page.tsx`)

### Key Files
- `src/components/visit/transcript-display.tsx`
- `src/components/visit/cultural-flag-card.tsx`
- `src/components/visit/recording-controls.tsx`
- `src/components/visit/language-selector.tsx`
- `src/components/visit/audio-player.tsx`

---

## Elliot — Frontend UI (Dashboard + Summary)

- [ ] Wire dashboard to real Supabase data (`src/app/dashboard/page.tsx`)
  - Fetch user's visits from Supabase
  - Replace placeholder visit cards with real data
- [ ] Wire summary page (`src/app/summary/[id]/page.tsx`)
  - Fetch real summary from Supabase by visit ID
  - Replace placeholder data
- [ ] Polish dashboard UI
  - Visit history cards
  - Chat interface styling
- [ ] Polish summary page UI
  - Bilingual layout for medications, follow-ups, warning signs
  - "Download PDF" button (stretch goal)

### Key Files
- `src/components/dashboard/visit-history-list.tsx`
- `src/components/dashboard/visit-card.tsx`
- `src/components/dashboard/chat-interface.tsx`
- `src/components/dashboard/chat-message.tsx`
- `src/components/summary/summary-view.tsx`
- `src/components/summary/medication-list.tsx`
- `src/components/summary/followup-list.tsx`

---

## Stretch Goals (Only After Core Is Polished)

- [ ] Presage API integration — patient stress/emotional state detection via webcam
- [ ] PDF download for visit summaries
- [ ] Voice selection UI for ElevenLabs TTS
