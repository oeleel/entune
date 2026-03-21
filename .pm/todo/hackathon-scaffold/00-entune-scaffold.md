# Entune — Full Project Scaffold & Core Backend

> Scaffold the complete Entune medical interpreter app and get core API endpoints functional before the team arrives at 5 PM.

| Field | Value |
|-------|-------|
| Status | Active |
| Owner | Leo Lee |
| Last Updated | 2026-03-21 |

## Goal

Get the full project scaffolded with working translation, TTS, summary, and chat API endpoints so the team (Daniel, Hailey, Elliot) can start building frontend against real APIs when they arrive at 5 PM.

## Success Criteria

- `npm run build` passes with zero errors
- `/api/health` returns OK
- `/api/translate` returns translation + cultural flag for Korean cultural terms + audioUrl
- `/api/tts` returns audio or clear error if API key missing
- `/api/summary` returns structured bilingual summary
- `/api/chat` returns AI responses from visit history
- All pages render (landing, login, dashboard, visit, summary)
- Full directory structure matches CLAUDE.md spec
- Team can `git clone`, `npm install`, add `.env.local`, and start working

## Design

Six phases executed sequentially:
1. **Project Scaffold** — Next.js 15, shadcn/ui, Supabase, deps, directory structure, types, cultural glossary
2. **Core Backend** — translate, tts, summary, health API routes + claude.ts + elevenlabs.ts + speech.ts
3. **Database & Auth** — schema.sql, auth callback, middleware, chat endpoint
4. **Frontend Shells** — landing, login, dashboard, visit, summary pages
5. **Verification** — build, dev server, curl tests
6. **Git Setup** — .gitignore, initial commit

Full spec in CLAUDE.md. Types in "Core Data Types" section. Schema in "Supabase Schema" section.
