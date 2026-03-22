-- Deepgram Integration Sprint
-- Load with: sqlite3 .pm/tasks.db < .pm/todo/deepgram-integration/tasks.sql

INSERT INTO tasks (sprint, spec, task_num, title, type, owner, skills, estimated_minutes, complexity, complexity_notes, done_when, description) VALUES

-- Task 1: Deepgram server helper + WebSocket proxy
('deepgram-integration', '01-deepgram-ambient-scribe.md', 1,
 'Create Deepgram server helper and WebSocket proxy API route',
 'actions', 'leo', 'server-actions',
 60, 'high', 'First Deepgram integration — WebSocket proxy pattern is new to this codebase',
 'Browser can stream audio to /api/deepgram/stream, receive Deepgram transcript results back via WebSocket. Deepgram API key stays server-side. Manual test: open WebSocket connection, send audio bytes, receive JSON transcript results with speaker labels.',
 'Create the server-side Deepgram integration:

1. **`src/lib/deepgram.ts`** — Deepgram helper:
   - `createDeepgramConnection(config)` — opens WebSocket to Deepgram Nova-3
   - Config: model=nova-3, language=multi, diarize=true, interim_results=true, encoding=linear16, sample_rate=16000
   - Returns methods: send(audioChunk), close(), onMessage(callback), onError(callback)
   - Parses Deepgram JSON responses into typed `DeepgramResult` objects

2. **`src/app/api/deepgram/stream/route.ts`** — WebSocket proxy:
   - Accepts WebSocket upgrade from browser
   - Opens a Deepgram WebSocket connection using DEEPGRAM_API_KEY (server env)
   - Forwards audio chunks from browser → Deepgram
   - Forwards transcript results from Deepgram → browser
   - Handles connection lifecycle (open, close, error, reconnect)
   - Note: Next.js 15+ supports WebSocket routes via `export const runtime = "nodejs"` and upgrade handling. If not natively supported, use a custom server approach or Server-Sent Events as fallback.

3. **`src/lib/types.ts`** — Add new types:
   - DeepgramConfig, DeepgramResult, SpeakerMap, CalibrationState

4. **`.env.local`** — Add DEEPGRAM_API_KEY

Alternative if Next.js WebSocket is problematic: Use Deepgram temporary API keys.
Deepgram has an endpoint to create short-lived keys scoped to specific features.
The browser gets a temp key from our API, then connects directly to Deepgram.
This avoids the proxy entirely while keeping the main API key server-side.');

-- Task 2: useDeepgramTranscript hook + calibration
INSERT INTO tasks (sprint, spec, task_num, title, type, owner, skills, estimated_minutes, complexity, complexity_notes, done_when, description) VALUES
('deepgram-integration', '01-deepgram-ambient-scribe.md', 2,
 'Create useDeepgramTranscript hook with voice calibration',
 'actions', 'leo', 'tanstack-hooks',
 60, 'high', 'Complex client-side audio streaming + calibration state machine',
 'Hook captures microphone audio, streams to Deepgram proxy, returns typed transcript entries with speaker labels. Calibration flow maps Deepgram speaker IDs to doctor/patient roles.',
 'Create the client-side hook for ambient transcription:

1. **`src/hooks/use-deepgram-transcript.ts`**:

   State:
   - `calibrationState`: waiting | doctor-speaking | patient-speaking | complete
   - `speakerMap`: Record<number, "provider" | "patient"> (maps Deepgram speaker IDs to roles)
   - `transcript`: Array of { text, speaker, role, isFinal, language, timestamp }
   - `interimText`: Current partial transcript line (not yet final)
   - `isConnected`: WebSocket connection status
   - `error`: Connection/mic errors

   Audio capture:
   - `navigator.mediaDevices.getUserMedia({ audio: true })` for mic access
   - Create AudioContext (16kHz sample rate)
   - Use ScriptProcessorNode or AudioWorklet to get PCM chunks
   - Convert Float32 audio to Int16 (linear16) for Deepgram
   - Stream chunks to WebSocket proxy

   Calibration flow:
   - `startCalibration()` → sets calibrationState to "doctor-speaking", starts audio
   - Listens for first is_final result → that speaker ID = doctor. Parse text for "doctor" keyword as confirmation
   - Sets calibrationState to "patient-speaking"
   - Listens for next is_final result from a DIFFERENT speaker ID → that = patient
   - Sets calibrationState to "complete", speakerMap is locked
   - If same speaker ID talks again during patient step, prompt "waiting for patient..."
   - Fallback: 30s timeout → use first-speaker-is-doctor heuristic

   Ambient mode (after calibration):
   - All Deepgram results are tagged with role via speakerMap
   - is_final=false → update interimText (UI shows "currently speaking..." line)
   - is_final=true → append to transcript array, clear interimText
   - Detect language from Deepgram response

   Cleanup:
   - On unmount: close WebSocket, stop audio stream, release mic

2. **Export interface** should be similar to existing hooks for easy integration:
   ```
   { transcript, interimText, calibrationState, speakerMap, isConnected, error,
     startCalibration, startListening, stopListening }
   ```');

-- Task 3: Doctor session page — ambient scribe UI
INSERT INTO tasks (sprint, spec, task_num, title, type, owner, skills, estimated_minutes, complexity, complexity_notes, done_when, description) VALUES
('deepgram-integration', '01-deepgram-ambient-scribe.md', 3,
 'Update doctor session page with ambient scribe UI and auto-translation',
 'frontend', 'leo', 'react-best-practices, web-design-guidelines',
 60, 'medium', 'UI integration of new hook + calibration UX + auto-translation pipeline',
 'Doctor session page shows calibration flow, then live ambient transcript with speaker labels. Non-English utterances auto-translate via Claude. Cultural flags appear inline.',
 'Update `src/app/session/doctor/page.tsx` to use the new Deepgram-powered ambient scribe:

1. **Replace** `useSpeechRecognition()` with `useDeepgramTranscript()`

2. **Calibration UI** (shown after patient joins, before ambient listening starts):
   - Card with steps: "Step 1: Doctor, please say: I am Doctor [name]" with mic indicator
   - After doctor speaks: checkmark, "Step 2: Patient, please say: I am [name]"
   - After patient speaks: "Calibration complete!" → auto-transition to ambient mode
   - Skip button as fallback (uses first-speaker=doctor heuristic)

3. **Live transcript** (ambient mode):
   - Each entry shows speaker badge: "Doctor" (blue) or "Patient" (green)
   - Interim text shows as a dimmed "currently speaking..." line at the bottom
   - Final entries are solid, with timestamp
   - Non-English entries show original text + translated text below (e.g. Korean line, then English translation)
   - Cultural flag cards appear inline when Claude detects them (same as current)
   - Auto-scroll to latest entry

4. **Auto-translation pipeline**:
   - When a is_final entry arrives and the detected language is NOT English:
     a. Show the original text immediately in the transcript (from Deepgram)
     b. POST to /api/translate with { text, sourceLanguage (detected), targetLanguage: "en-US", speaker (from speakerMap) }
     c. When Claude responds: append translation line below the original, show cultural flag if present
     d. Insert BOTH original + translation into Supabase transcript_entries
   - When entry IS English: insert directly into Supabase transcript_entries (no Claude call needed)

5. **Connection status**: Show mic/connection indicator in header (connected, reconnecting, error)

6. **Keep existing features**: End session button, cultural flag cards, patient report generation — all stay the same');

-- Task 4: Wire auto-translation pipeline
INSERT INTO tasks (sprint, spec, task_num, title, type, owner, skills, estimated_minutes, complexity, complexity_notes, done_when, description) VALUES
('deepgram-integration', '01-deepgram-ambient-scribe.md', 4,
 'Wire Deepgram → Claude auto-translation pipeline and Supabase persistence',
 'actions', 'leo', 'server-actions',
 45, 'medium', 'Glue code between Deepgram results, Claude translation, and Supabase inserts',
 'Non-English Deepgram results automatically translate via Claude and persist to Supabase. Both devices see the full annotated transcript in real-time.',
 'Wire the full pipeline from Deepgram transcription → Claude translation → Supabase persistence:

1. **Language detection logic** in the doctor session page or a shared utility:
   - Deepgram returns detected language per utterance (when using language=multi)
   - If detected language != "en" / "en-US": trigger Claude translation
   - If English: skip translation, insert directly

2. **Translation integration**:
   - Use existing `translate()` from `src/lib/api.ts` (calls /api/translate)
   - Map Deepgram language codes to our SupportedLanguage type
   - Pass the full running transcript as visitContext for Claude (better translations with context)

3. **Supabase persistence**:
   - For English utterances: INSERT into transcript_entries with original_text = translated_text = the English text
   - For non-English utterances: INSERT with original_text = Korean/Spanish text, translated_text = Claude translation, cultural_flag = Claude cultural flag (if any)
   - Use the speaker role from speakerMap (not Deepgram raw speaker ID)
   - Both inserts trigger the existing Supabase realtime subscription → patient device auto-updates

4. **Patient-side integration**:
   - Patient page already subscribes to transcript_entries via useRealtimeTranscript
   - No changes needed on patient page — entries from doctor ambient scribe flow through automatically
   - Patient still uses push-to-talk (Web Speech API or Deepgram) for their own input

5. **Session end integration**:
   - /api/session/end already fetches transcript_entries from Supabase
   - The enriched transcript (with translations + cultural flags) feeds into Claude report generation
   - No changes needed to end session flow

6. **Error handling**:
   - Claude translation failure: show original text with "translation failed" indicator, allow retry
   - Supabase insert failure: queue locally, retry with exponential backoff
   - Network issues: show connection warning, buffer Deepgram results locally until reconnected');

-- Dependencies: linear sequence
INSERT INTO task_dependencies (sprint, task_num, depends_on_sprint, depends_on_task) VALUES
('deepgram-integration', 2, 'deepgram-integration', 1),  -- Hook depends on server helper
('deepgram-integration', 3, 'deepgram-integration', 2),  -- UI depends on hook
('deepgram-integration', 4, 'deepgram-integration', 3);  -- Pipeline wiring depends on UI
