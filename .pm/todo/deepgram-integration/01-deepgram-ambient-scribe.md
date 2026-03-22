# Deepgram Ambient Scribe + Claude Translation Pipeline

> Integrate Deepgram Nova-3 as the doctor-side ambient STT with speaker diarization, piped to Claude for medical-aware translation and cultural flag detection.

| Field | Value |
|-------|-------|
| Status | Draft |
| Owner | Leo |
| Last Updated | 2026-03-22 |
| Depends On | Existing session infrastructure (complete) |
| Enables | Full ambient medical scribe, improved transcript quality |

---

## Recent Changes

| Date | What changed | Section |
|------|-------------|---------|
| 2026-03-22 | Initial spec | All |

---

## Goal

Replace the doctor-side Web Speech API with Deepgram Nova-3 streaming STT to get:
1. **Speaker diarization** — distinguish doctor vs patient from a single mic
2. **Better multilingual transcription** — Korean/Spanish recognition far superior to Web Speech API
3. **Ambient always-on mode** — doctor doesn't press any buttons, full conversation is captured
4. **Auto-translation pipeline** — non-English speech detected by Deepgram auto-pipes to Claude for medical-aware translation + cultural flags

Patient-side push-to-talk stays on Web Speech API (or Deepgram) for patient-facing translations on their own device.

---

## Success Criteria

- Doctor's session page shows a live transcript with speaker labels (Doctor / Patient) as people talk
- Non-English utterances automatically show a translation line beneath them
- Cultural flags appear when Claude detects them
- Voice calibration at session start maps Deepgram's arbitrary speaker IDs to doctor/patient roles
- Latency from speech to transcript display < 500ms (Deepgram portion)
- Latency from non-English speech to translation display < 1.5s (Deepgram + Claude)
- Session end report generation works from the enriched transcript
- Patient-side push-to-talk still works independently

---

## Current State

- Doctor's session page uses `useSpeechRecognition()` hook wrapping Web Speech API
- Web Speech API is Chrome-only, inconsistent quality, no diarization
- Doctor must be "listening" explicitly — no ambient capture
- All speech goes through Claude for translation (even English → English is wasteful)
- No speaker identification — the device tag (doctor/patient) is the only signal
- Supabase `transcript_entries` table stores all entries with `speaker` field

---

## Ideal State

The doctor opens the session, both speakers say a calibration phrase, and from that point forward the doctor's device silently captures everything said in the room. The transcript populates in real-time with perfect speaker attribution. Non-English speech is automatically translated with medical precision. Cultural flags surface inline. At session end, the full annotated transcript feeds into Claude for report generation.

---

## Design

### Architecture

```
Doctor's Microphone (always on)
    │
    ▼
getUserMedia() → AudioWorklet (PCM 16-bit, 16kHz)
    │
    ▼
Next.js API Route (WebSocket proxy)  ←── DEEPGRAM_API_KEY (server-side, secure)
    │
    ▼
Deepgram Nova-3 WebSocket (streaming)
    │  params: model=nova-3, diarize=true, language=multi, interim_results=true
    │
    ▼
Deepgram returns: { transcript, speaker, is_final, language }
    │
    ▼
Client receives via WebSocket
    │
    ├─► is_final=false → update interim transcript line (UI only)
    │
    └─► is_final=true
         │
         ├─► English utterance → insert into Supabase transcript_entries directly
         │
         └─► Non-English utterance → POST /api/translate (Claude)
              │
              ├─► translated text + cultural flag
              └─► insert BOTH original + translation into Supabase transcript_entries
```

### Voice Calibration Flow

After patient joins (status → `active`):

1. Doctor's page shows calibration UI: "Let's set up voice recognition"
2. Step 1: "Doctor, please say: I am Doctor [name]" → Deepgram assigns speaker label (e.g. `speaker:0`)
3. Step 2: "Patient, please say: I am [name]" → Deepgram assigns `speaker:1`
4. App parses text — utterance containing "doctor" or said first = doctor role
5. Mapping stored in component state: `{ 0: 'provider', 1: 'patient' }`
6. Calibration complete → ambient listening begins

**Fallback**: If calibration is skipped or fails, use "first speaker = doctor" heuristic.

### Key Decisions

**Server-side WebSocket proxy (not client-side Deepgram)**:
- Deepgram API key stays on server (never exposed to browser)
- Next.js API route acts as WebSocket proxy between browser and Deepgram
- Browser streams audio to our server, server forwards to Deepgram
- Deepgram responses forwarded back to browser

**Deepgram language setting**:
- Use `language=multi` (Deepgram multilingual model) to auto-detect language per utterance
- This handles mixed English/Korean/Spanish conversations without language switching
- Each response includes detected language

**Interim results**:
- `interim_results=true` for low-latency UI updates
- Only `is_final=true` results trigger Claude translation or Supabase inserts
- Interim results update a "currently speaking" line in the UI

### Trade-offs from Ideal

- **No persistent voice profiles**: Deepgram doesn't store speaker embeddings across sessions. Calibration happens every session. (Acceptable for medical visits — each is independent)
- **Server proxy adds ~50ms**: The WebSocket proxy adds a small hop vs direct client→Deepgram. Worth it for API key security.
- **Patient side stays on Web Speech API for MVP**: Could upgrade later, but push-to-talk + Web Speech API works fine for the patient's simpler use case.

### Out of Scope

- ElevenLabs TTS integration (deferred separately)
- Picovoice Eagle voice enrollment (future enhancement)
- Patient-side Deepgram upgrade (patient keeps Web Speech API + push-to-talk)
- Presage emotional sensing

---

## Schema

No Supabase schema changes needed. Existing `transcript_entries` table works as-is:

```sql
-- Already exists
create table transcript_entries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  speaker text not null check (speaker in ('patient', 'provider')),
  original_text text not null,
  translated_text text not null,
  cultural_flag jsonb,
  timestamp timestamptz default now()
);
```

For non-English utterances, `original_text` = what was said, `translated_text` = Claude's translation.
For English utterances, `original_text` = `translated_text` = the transcribed text.

### New TypeScript Types

```typescript
// Deepgram streaming config
export type DeepgramConfig = {
  model: string;        // 'nova-3'
  language: string;     // 'multi' for multilingual auto-detect
  diarize: boolean;     // true
  interimResults: boolean;
  sampleRate: number;   // 16000
  encoding: string;     // 'linear16'
};

// Deepgram transcript result (from WebSocket)
export type DeepgramResult = {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  speaker: number;        // 0, 1, etc. — Deepgram's arbitrary label
  detectedLanguage?: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
    speaker: number;
    confidence: number;
  }>;
};

// Speaker mapping from calibration
export type SpeakerMap = Record<number, 'provider' | 'patient'>;

// Calibration state
export type CalibrationState = 'waiting' | 'doctor-speaking' | 'patient-speaking' | 'complete';
```

---

## Implementation Plan

| # | Task | Done When |
|---|------|-----------|
| 1 | Create Deepgram server helper + WebSocket proxy API route | Audio streams from browser → server → Deepgram → server → browser; Deepgram transcription results return to client |
| 2 | Create `useDeepgramTranscript` hook + calibration logic | Hook manages mic capture, WebSocket to proxy, speaker mapping from calibration, emits typed transcript events |
| 3 | Update doctor session page with ambient scribe UI | Doctor page shows calibration flow, live transcript with speaker labels, interim text, auto-translation for non-English, cultural flags inline |
| 4 | Wire auto-translation pipeline (Deepgram → Claude) | Non-English final results auto-sent to `/api/translate`, both original + translation inserted into Supabase, appear in real-time transcript |

---

## Open Questions

1. ~~Should we use client-side or server-side Deepgram WebSocket?~~ **Resolved**: Server-side proxy — keeps API key secure.
2. ~~Which Deepgram model?~~ **Resolved**: Nova-3 with `language=multi` for auto-detect.
3. Should we upgrade the patient side to Deepgram too, or keep Web Speech API? **Deferred** — keep Web Speech API for patient push-to-talk for now.
4. How should we handle very long sessions (1+ hour)? Deepgram WebSocket may need reconnection. Need to test connection durability.

---

## References

- Deepgram Nova-3 docs: https://developers.deepgram.com/docs
- Deepgram streaming API: https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio
- Deepgram diarization: https://developers.deepgram.com/docs/diarization
- Existing doctor session: `src/app/session/doctor/page.tsx`
- Existing hooks: `src/hooks/use-speech-recognition.ts`, `src/hooks/use-hold-to-speak.ts`
- Claude integration: `src/lib/claude.ts`
