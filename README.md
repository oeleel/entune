# Entune

**Real-time, medically-aware, bilingual translation for healthcare visits.**

Built for HooHacks 2026 | Track: Health & Wellness

---

## What It Does

Patient and provider speak naturally in their own language during a medical visit. Entune:

1. **Live translated subtitles** — real-time bilingual transcript on screen
2. **Spoken translations** — natural human voice via ElevenLabs streaming TTS
3. **Cultural health flags** — detects culturally specific health concepts (e.g. 화병, nervios) and surfaces clinical context for the provider
4. **Jargon simplification** — simplifies medical terminology in the patient-facing direction
5. **Bilingual visit summary** — generates a structured summary with medications, follow-ups, and warning signs in both languages
6. **Visit memory** — all visits saved to the user's account with an AI chat that lets patients ask questions about their past visits in their preferred language

### Supported Languages (MVP)

- English (en-US)
- Korean (ko-KR)
- Spanish (es-ES)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI | Tailwind CSS + shadcn/ui |
| Backend/DB | Supabase (Postgres, real-time, RLS) |
| Auth | Supabase Auth (Google OAuth) |
| AI Translation | Claude API (medical-context translation, cultural bridging, summary generation) |
| Voice Output | ElevenLabs Streaming TTS (multilingual voice synthesis) |
| Speech Input | Web Speech API (browser-native, Chrome) |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Chrome (required for Web Speech API)

### Setup

```bash
git clone https://github.com/oeleel/entune.git
cd entune
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your keys:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-claude-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome.

### Build

```bash
npm run build
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/page.tsx              # Google sign-in
│   ├── dashboard/page.tsx          # Visit history + AI chat
│   ├── visit/page.tsx              # Live translation session
│   ├── summary/[id]/page.tsx       # Bilingual visit summary
│   └── api/
│       ├── translate/route.ts      # Claude translation + cultural flags + TTS
│       ├── tts/route.ts            # Standalone ElevenLabs TTS
│       ├── summary/route.ts        # Bilingual summary generation
│       ├── chat/route.ts           # AI chat over visit history
│       ├── health/route.ts         # Health check
│       └── auth/callback/route.ts  # Google OAuth callback
├── components/
│   ├── visit/                      # Transcript, cultural flags, controls
│   ├── summary/                    # Summary view, medications, follow-ups
│   ├── dashboard/                  # Visit history, chat interface
│   └── shared/                     # Loading, errors, auth guard, nav
├── hooks/                          # Speech recognition, translation, visit session, chat, user
└── lib/
    ├── claude.ts                   # Claude API (translate, summarize, chat)
    ├── elevenlabs.ts               # ElevenLabs TTS
    ├── cultural-glossary.ts        # Korean + Spanish cultural health concepts
    ├── speech.ts                   # Web Speech API wrapper
    ├── api.ts                      # Frontend API client
    ├── types.ts                    # Shared TypeScript types
    └── supabase/                   # Supabase clients + middleware
```

---

## Cultural Health Glossary

Entune includes a curated glossary of culturally specific health concepts sourced from the DSM-5 and medical anthropology literature:

**Korean:** 화병 (fire illness), 신병 (spirit illness), 한 (deep grief), 체했다 (food blockage), 기가 막히다 (qi blocked), 속이 상하다 (insides hurt), 열이 오르다 (heat rising), 몸이 무겁다 (body heavy)

**Spanish:** nervios (nerves), ataque de nervios (nerve attack), susto (fright/soul loss), empacho (blocked stomach), mal de ojo (evil eye), bilis (bile), caída de mollera (fallen fontanelle)

When detected, each term triggers a clinical context card for the provider with screening recommendations and safety notes.

---

## Team

- **Leo** — Backend, API routes, Supabase, Claude/ElevenLabs integration, auth
- **Daniel** — Integration, hooks, state management, API client wiring
- **Hailey** — Frontend UI (visit page, landing, login)
- **Elliot** — Frontend UI (dashboard, summary)

---

## License

MIT
