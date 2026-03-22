-- Sprint: entune-pivot
-- Entune Architecture Pivot — Two-Device Doctor/Patient Model
-- 6 tasks, 3 waves of parallelism

-- Task 1: Foundation — Types, Schema, Landing Page
INSERT INTO tasks (sprint, task_num, title, type, owner, estimated_minutes, complexity, done_when, description) VALUES
('entune-pivot', 1, 'Foundation — Types, Schema, Landing Page', 'database', 'leo', 20, 'low',
'`npm run build` passes, types compile, landing page renders with two role buttons.',
'Update `src/lib/types.ts`: Add `SessionStatus`, `Session`, `DoctorReport`, `PatientReport` types. Keep existing types.

Update `supabase/schema.sql`: Add `join_code`, `status`, `patient_name`, `patient_email` columns to `visits`. Add `doctor_report`, `patient_report` JSONB columns to `visit_summaries`. Add RLS policy for patient access by join_code. Enable Realtime on `transcript_entries` and `visits`.

Rewrite `src/app/page.tsx`: Barebones landing with two buttons — "I''m a Doctor" (→ `/login`) and "I''m a Patient" (→ `/join`). No styling.

Files: `src/lib/types.ts`, `supabase/schema.sql`, `src/app/page.tsx`');

-- Task 2: Session API Routes
INSERT INTO tasks (sprint, task_num, title, type, owner, estimated_minutes, complexity, done_when, description) VALUES
('entune-pivot', 2, 'Session API Routes', 'actions', 'leo', 30, 'medium',
'curl tests pass for create (returns join code), join (returns visit info), end (returns both reports).',
'Create `src/app/api/session/create/route.ts`: POST, auth required. Creates a visit with a random 6-digit `join_code`, `status=''waiting''`, patient language. Returns `{ visitId, joinCode }`.

Create `src/app/api/session/join/route.ts`: POST, no auth. Accepts `{ joinCode, patientName?, patientEmail? }`. Finds visit by code, updates `status=''active''`, sets patient info. Returns `{ visitId, patientLanguage, providerLanguage }`.

Create `src/app/api/session/end/route.ts`: POST, auth required. Accepts `{ visitId }`. Sets `status=''ended''`, `ended_at=now()`. Fetches transcript, calls Claude to generate both reports (doctor + patient), saves to `visit_summaries`. Returns both reports.

Update `src/lib/api.ts`: Add `createSession()`, `joinSession()`, `endSession()` client functions.

Files: `src/app/api/session/create/route.ts`, `src/app/api/session/join/route.ts`, `src/app/api/session/end/route.ts`, `src/lib/api.ts`');

-- Task 3: Realtime Hooks + Speech Modes
INSERT INTO tasks (sprint, task_num, title, type, owner, estimated_minutes, complexity, done_when, description) VALUES
('entune-pivot', 3, 'Realtime Hooks + Speech Modes', 'actions', 'leo', 25, 'medium',
'Hooks compile, realtime hook receives INSERT events, hold-to-speak hook manages press/release/translate cycle.',
'Create `src/hooks/use-realtime-transcript.ts`: Subscribes to Supabase Realtime `transcript_entries` INSERT events filtered by `visit_id`. Returns live `transcript` array. Both doctor and patient pages use this.

Create `src/hooks/use-session-status.ts`: Subscribes to `visits` table changes for a specific visit ID. Tracks `status` transitions (waiting → active → ended).

Create `src/hooks/use-hold-to-speak.ts`: Manages press-and-hold interaction. On press: starts speech recognition (patient language). On release: stops recognition, calls `/api/translate`, inserts result into Supabase `transcript_entries`. Returns `{ isHolding, isTranslating, lastResult }`.

Update `src/hooks/use-speech-recognition.ts`: Add `mode` param — `''continuous''` (doctor, always listening) vs `''push-to-talk''` (patient, manual start/stop).

Files: `src/hooks/use-realtime-transcript.ts`, `src/hooks/use-session-status.ts`, `src/hooks/use-hold-to-speak.ts`, `src/hooks/use-speech-recognition.ts`');

-- Task 4: Report Generation + Chat Update
INSERT INTO tasks (sprint, task_num, title, type, owner, estimated_minutes, complexity, done_when, description) VALUES
('entune-pivot', 4, 'Report Generation + Chat Update', 'actions', 'leo', 25, 'medium',
'Doctor report returns SOAP-style JSON, patient report returns simplified JSON in target language, chat with visitId scopes to one visit.',
'Update `src/lib/claude.ts`: Add `generateDoctorReport(transcript, culturalFlags)` — SOAP-style clinical note with cultural context. Add `generatePatientReport(transcript, language)` — simplified summary at 6th-grade reading level in patient''s language. Keep existing functions.

Update `src/app/api/chat/route.ts`: Add optional `visitId` param. When provided, scope context to that single visit''s transcript + reports instead of all visits. Doctor uses this from dashboard.

Update `src/lib/api.ts`: Update `chat()` to accept optional `visitId`.

Files: `src/lib/claude.ts`, `src/app/api/chat/route.ts`, `src/lib/api.ts`');

-- Task 5: Doctor Dashboard + Session Page
INSERT INTO tasks (sprint, task_num, title, type, owner, estimated_minutes, complexity, done_when, description) VALUES
('entune-pivot', 5, 'Doctor Dashboard + Session Page', 'frontend', 'leo', 30, 'medium',
'Dashboard shows visits table + start session + chat. Doctor session page shows join code, records speech, displays realtime subtitles, ends session.',
'Rewrite `src/app/dashboard/page.tsx`: Barebones. Auth-guarded. Shows: search input, table of past visits (fetched from Supabase), "Start Session" button (calls create session API, shows join code in a dialog/div). When a visit row is clicked, shows AI chat panel below (uses `useChat` with `visitId`).

Create `src/app/session/doctor/page.tsx`: Barebones. Auth-guarded. Shows join code until patient joins (use `useSessionStatus`). Once active: continuous speech recognition (doctor speaks → `/api/translate` → insert to Supabase). Shows realtime transcript (use `useRealtimeTranscript`) — both doctor and patient messages. Shows cultural flag cards when detected. "End Session" button calls end API → redirects to dashboard.

Reuse: `AuthGuard`, `CulturalFlagCard`, `useChat`, `useUser`, `useSpeechRecognition` (continuous mode).

Files: `src/app/dashboard/page.tsx`, `src/app/session/doctor/page.tsx`');

-- Task 6: Patient Join + Session Page
INSERT INTO tasks (sprint, task_num, title, type, owner, estimated_minutes, complexity, done_when, description) VALUES
('entune-pivot', 6, 'Patient Join + Session Page', 'frontend', 'leo', 25, 'medium',
'Patient can enter code, join session, see doctor subtitles, hold-to-speak sends translated text, session end shows patient report.',
'Create `src/app/join/page.tsx`: Barebones. No auth required. Input for 6-digit code, optional name/email fields. "Join" button calls join session API. On success → redirect to `/session/patient?visitId={id}`.

Create `src/app/session/patient/page.tsx`: Barebones. No auth required. Gets visitId from URL params. Shows doctor''s translated speech as subtitles (use `useRealtimeTranscript`, filter speaker=''provider''). Large hold-to-speak button (use `useHoldToSpeak`). When session ends (use `useSessionStatus`), show patient report.

Reuse: `useRealtimeTranscript`, `useSessionStatus`, `useHoldToSpeak`.

Files: `src/app/join/page.tsx`, `src/app/session/patient/page.tsx`');

-- Dependencies
-- Task 2, 3, 4 depend on Task 1
INSERT INTO task_dependencies (sprint, task_num, depends_on_sprint, depends_on_task) VALUES
('entune-pivot', 2, 'entune-pivot', 1),
('entune-pivot', 3, 'entune-pivot', 1),
('entune-pivot', 4, 'entune-pivot', 1);

-- Task 5 depends on Tasks 2 and 3
INSERT INTO task_dependencies (sprint, task_num, depends_on_sprint, depends_on_task) VALUES
('entune-pivot', 5, 'entune-pivot', 2),
('entune-pivot', 5, 'entune-pivot', 3);

-- Task 6 depends on Tasks 2 and 3
INSERT INTO task_dependencies (sprint, task_num, depends_on_sprint, depends_on_task) VALUES
('entune-pivot', 6, 'entune-pivot', 2),
('entune-pivot', 6, 'entune-pivot', 3);
