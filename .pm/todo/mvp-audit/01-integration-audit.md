# MVP Integration Audit & Testing Plan

> Comprehensive check of all backend-frontend integration points to verify Entune is demo-viable.

| Field | Value |
|-------|-------|
| Status | Active |
| Owner | Leo |
| Last Updated | 2026-03-21 |

---

## Automated Checks (All Passing)

| Check | Result | Notes |
|-------|--------|-------|
| `npm run build` | PASS | All 23 routes compile. No type errors. |
| `npm run lint` | PASS | 0 errors, 2 warnings (non-blocking: `<img>` in user-nav, unused `_imageData` in presage.ts) |
| TypeScript compilation | PASS | Strict mode, all API contracts type-check |
| Route inventory | PASS | 9 API routes, 14 pages all resolve |

---

## Integration Findings

### SEVERITY: CRITICAL (Will break the demo)

#### C1. Summary page shows hardcoded placeholder data
**File:** `src/app/summary/[id]/page.tsx`
**Problem:** The `[id]` dynamic param is completely ignored. Page renders a `placeholderSummary` constant with fake data (Korean 화병 demo case). After a real session ends, navigating to `/summary/{visitId}` shows the same fake data regardless of visit.
**Impact:** Doctor can't see their actual SOAP report after ending a session via this route. (Note: patient sees their report inline on the patient session page via realtime — this only breaks the `/summary/[id]` route.)
**Fix:** Fetch from `visit_summaries` table using the `[id]` param. The data is already saved by `/api/session/end`.

#### C2. Doctor + patient session pages use raw inline styles
**Files:** `src/app/session/doctor/page.tsx`, `src/app/session/patient/page.tsx`
**Problem:** Both pages use `style={{ padding: 20 }}` / raw `<button>` / `<div>` while the dashboard, login, and join pages use polished shadcn components + Tailwind. Creates a jarring visual break mid-demo when transitioning from the polished dashboard to the unstyled session view.
**Impact:** Judges see the session pages (the core product) looking like a prototype while surrounding pages look production-ready. Undermines credibility.
**Fix:** Restyle using the existing entune CSS classes and shadcn components (Card, Badge, Button).

### SEVERITY: HIGH (May break demo under certain conditions)

#### H1. No error handling in useRealtimeTranscript initial fetch
**File:** `src/hooks/use-realtime-transcript.ts:21`
**Problem:** `.then(({ data }) => { ... })` — ignores the `error` field. If Supabase RLS blocks the query or network fails, transcript silently stays empty.
**Impact:** Both doctor and patient see an empty transcript with no error message. Looks like the app is broken.
**Fix:** Add `({ data, error })` destructuring + set an error state.

#### H2. No error handling in useSessionStatus initial fetch
**File:** `src/hooks/use-session-status.ts:21`
**Problem:** Same pattern — `.then(({ data }) => { ... })` ignores errors. Status stays `'waiting'` forever if the fetch fails.
**Impact:** Doctor sees "Waiting for patient..." indefinitely even after patient joins. Session appears frozen.
**Fix:** Same as H1 — add error destructuring.

#### H3. Dashboard redirect uses setTimeout(3000) after session creation
**File:** `src/app/dashboard/page.tsx:100-102`
**Problem:** After creating a session, the code shows the join code in a dialog for 3 seconds, then auto-redirects to `/session/doctor`. If the doctor doesn't notice the code, they can't share it (though the code is also shown on the session page). The dialog closes on redirect, so the flow is: dialog → 3s → redirect.
**Impact:** Minor UX issue — works but feels abrupt. Doctor may want to copy the code before redirecting.
**Mitigation:** The join code is also displayed on the doctor session page while `status === 'waiting'`, so it's not lost. Acceptable for demo.

#### H4. useUser hardcodes preferredLanguage to 'en-US'
**File:** `src/hooks/use-user.ts:22,37`
**Problem:** Never reads from `user_profiles` table. Always returns `preferredLanguage: 'en-US'`.
**Impact:** Chat responses in dashboard always come back in English, even if the doctor is Korean-speaking. For demo purposes this is likely fine (demo doctor is English-speaking).
**Mitigation:** Only affects chat language. Demo flow uses an English-speaking doctor, so this won't surface.

#### H5. Doctor page auto-starts listening on session activation
**File:** `src/app/session/doctor/page.tsx:55-60`
**Problem:** When `status` changes to `'active'`, the `useEffect` calls `startListening()` automatically. No user confirmation.
**Impact:** Doctor's mic activates without visual warning. Browser will show a mic permission dialog (which is fine), but any spoken words before the doctor is ready will be captured and translated.
**Mitigation:** For demo, the doctor (you) will be prepared. In production this needs a manual "Start" button.

### SEVERITY: MEDIUM (Won't break demo, but worth knowing)

#### M1. No visitContext passed to translate API
**Files:** `src/hooks/use-hold-to-speak.ts:64`, `src/app/session/doctor/page.tsx:77`
**Problem:** The `TranslationRequest.visitContext` field is optional and never populated. Claude translates each utterance in isolation without seeing the running transcript.
**Impact:** Translations still work but lack context-awareness. A sentence like "the same as before" won't resolve correctly. For a 2-minute demo with clear utterances, this is fine.

#### M2. Patient page shows plain text on missing visitId
**File:** `src/app/session/patient/page.tsx:64-66`
**Problem:** If patient navigates to `/session/patient` without `?visitId=...`, they see `<p>No visit ID provided.</p>` — unstyled, no redirect.
**Impact:** Only happens if patient manually edits URL. Normal flow from `/join` always includes visitId.

#### M3. Session/end has no explicit ANTHROPIC_API_KEY check
**File:** `src/app/api/session/end/route.ts:96`
**Problem:** Unlike `/api/translate` which checks the key, `/api/session/end` calls `generateDoctorReport` and `generatePatientReport` without checking if the key exists.
**Impact:** If the key is missing, the outer `catch` block (line 120-125) returns a 500. The error message is generic ("Internal server error") but the session is already marked as `'ended'` in the DB. Subsequent calls are idempotent (line 38-51) — the route will try to fetch existing reports (which won't exist) and fall through to regenerate.
**Mitigation:** Key is set in `.env.local` and on Vercel. Low risk for demo.

---

## Manual Testing Guide

### Prerequisites
- Chrome browser (Web Speech API requirement)
- Two devices OR two browser tabs (one for doctor, one for patient)
- Supabase project running with schema applied
- `.env.local` configured with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- Dev server running: `npm run dev`

### Test 1: Landing Page
**Route:** `/`
**Expected:** Polished marketing page with entune logo, "Where every patient is understood" tagline, Provider and Patient role cards, footer trust badges.
**Check:**
- [ ] Logo and wordmark render
- [ ] "Provider" card links to `/login`
- [ ] "Patient" card links to `/join`
- [ ] Background glow animation visible
- [ ] Mobile responsive (resize window)

### Test 2: Login (Email/Password)
**Route:** `/login`
**Steps:**
1. Click "Create one" to switch to sign-up mode
2. Enter email + password (min 6 chars)
3. Click "Create account"
**Expected:** Redirects to `/dashboard`
**Check:**
- [ ] Form validation (required fields, min length)
- [ ] Error message on invalid credentials
- [ ] Toggle between sign-in / sign-up modes
- [ ] Loading state ("Creating account..." / "Signing in...")

### Test 3: Login (Google OAuth)
**Route:** `/login`
**Steps:**
1. Click "Sign in with Google"
2. Complete Google OAuth flow
3. Should redirect back to app
**Expected:** Lands on `/dashboard` after OAuth callback
**Check:**
- [ ] Google OAuth popup/redirect opens
- [ ] `/api/auth/callback` exchanges code
- [ ] Redirects to `/dashboard` with user session
- [ ] User name appears in dashboard header

### Test 4: Dashboard (Empty State)
**Route:** `/dashboard`
**Expected:** Header with "Entune" + "+ New Session" button, empty visits list, chat panel saying "Select a visit".
**Check:**
- [ ] AuthGuard redirects to `/login` if not signed in
- [ ] "No visits yet" message shown
- [ ] "+ New Session" button opens dialog
- [ ] Chat panel shows placeholder message

### Test 5: Create Session
**Route:** `/dashboard` → New Session dialog
**Steps:**
1. Click "+ New Session"
2. Select Patient Language: Korean, Provider Language: English
3. Click "Create Session"
**Expected:** Dialog shows 6-digit join code, then auto-redirects to `/session/doctor?visitId=...&joinCode=...` after 3 seconds.
**Check:**
- [ ] Language dropdowns work (Korean, Spanish, English options)
- [ ] "Creating..." loading state
- [ ] 6-digit code appears in large monospace text
- [ ] Auto-redirect to doctor session page
- [ ] Join code visible on doctor session page ("Waiting for patient...")

### Test 6: Patient Joins Session
**Route:** `/join`
**Steps:**
1. On second device/tab, go to `/join`
2. Enter the 6-digit code from step 5
3. Optionally enter name + email
4. Click "Join"
**Expected:** Redirects to `/session/patient?visitId=...`. Doctor page should update from "Waiting" to "Active".
**Check:**
- [ ] Code input auto-uppercases
- [ ] "Joining..." loading state
- [ ] Error shown for invalid/expired code
- [ ] Redirect to patient session page
- [ ] Doctor page detects patient join (status → 'active')
- [ ] Doctor page auto-starts mic (browser permission dialog)

### Test 7: Live Translation (Doctor Speaks)
**Route:** `/session/doctor` (with active session)
**Steps:**
1. Speak in English (e.g., "What brings you in today?")
2. Wait for speech recognition to finalize
**Expected:** Original English text appears on doctor's transcript with Korean translation below. Same entry appears on patient's screen.
**Check:**
- [ ] Speech recognition captures text (Chrome only)
- [ ] "Listening..." indicator active
- [ ] Interim transcript shows while speaking
- [ ] `/api/translate` called → returns translation
- [ ] Entry inserted into `transcript_entries` via Supabase
- [ ] Entry appears on BOTH doctor and patient screens via realtime subscription

### Test 8: Live Translation (Patient Speaks)
**Route:** `/session/patient` (with active session)
**Steps:**
1. Press and hold "Hold to Speak" button
2. Speak in Korean (e.g., "화병인 것 같아요")
3. Release button
**Expected:** Speech captured → translated → appears on both screens. If cultural term detected, cultural flag card appears on doctor's screen.
**Check:**
- [ ] Hold-to-speak: button state changes on press/release
- [ ] "Listening... (release to send)" shown while holding
- [ ] "Translating..." shown after release
- [ ] Translation appears on both screens
- [ ] Cultural flag card appears for 화병 (hwa-byung)
- [ ] Flag shows: term, literal meaning, clinical context, screening suggestions

### Test 9: End Session + Report Generation
**Route:** `/session/doctor` → "End Session" button
**Steps:**
1. Click "End Session"
2. Wait for report generation
**Expected:** Session ends, status changes to 'ended'. Doctor is redirected to `/dashboard`. Patient sees their report inline.
**Check:**
- [ ] "Ending..." loading state
- [ ] Doctor redirected to dashboard
- [ ] Patient page shows "Session Ended" with their report
- [ ] Patient report includes: summary, medications, follow-ups, warning signs
- [ ] Visit appears in doctor's dashboard visit list with status "ended"
- [ ] `visit_summaries` table has both `doctor_report` and `patient_report` in Supabase

### Test 10: Visit History + AI Chat
**Route:** `/dashboard`
**Steps:**
1. Click on a completed visit card
2. In the chat panel, type "What did we discuss?"
3. Send the message
**Expected:** AI responds with a summary based on the visit transcript and reports.
**Check:**
- [ ] Visit card highlights on click
- [ ] Chat panel activates
- [ ] Message sent to `/api/chat`
- [ ] AI response references the visit content
- [ ] "Thinking..." animation while loading
- [ ] Multiple messages can be exchanged

### Test 11: Supabase Realtime
**Verification:** This is the core integration — it's exercised in Tests 7 + 8, but verify explicitly:
**Check:**
- [ ] `transcript_entries` table has `REPLICA IDENTITY FULL` set in Supabase dashboard
- [ ] Realtime is enabled for `transcript_entries` table
- [ ] Realtime is enabled for `visits` table (for status changes)
- [ ] RLS policies allow doctor to read/write transcript entries
- [ ] Supabase anon key can write transcript entries (for patient, who is unauthenticated)

### Test 12: Edge Cases
- [ ] Invalid join code → error message on `/join`
- [ ] Expired/already-active session code → appropriate error
- [ ] End session with empty transcript → reports still generate (or graceful fallback)
- [ ] Refresh doctor session page → should reload state from Supabase (visitId in URL params)
- [ ] Refresh patient session page → should reload state (visitId in URL params)
- [ ] Network disconnect during session → transcript entries will be stale; no explicit recovery mechanism (known limitation for MVP)

---

## Supabase Dashboard Verification Checklist

These items must be manually verified in the Supabase dashboard — they cannot be automated:

### 1. Realtime Publication
- [ ] Go to Database → Replication → check that `transcript_entries` is listed under "Source" tables
- [ ] Check that `visits` is also listed (needed for status change subscriptions)
- If not: run `ALTER PUBLICATION supabase_realtime ADD TABLE transcript_entries, visits;`

### 2. RLS Policies Active
- [ ] Go to Authentication → Policies
- [ ] Verify `visits` table has policies for select/insert/update scoped to `auth.uid() = user_id`
- [ ] Verify `transcript_entries` has policies that allow BOTH authenticated doctors AND anonymous patients to insert
- [ ] **Critical for patient access:** The current RLS policy `visit_id in (select id from visits where user_id = auth.uid())` will FAIL for patients (they're unauthenticated). You need an additional policy like:
  ```sql
  -- Allow anyone to insert transcript entries for active sessions
  CREATE POLICY "Anyone can insert transcript entries for active sessions"
    ON transcript_entries FOR INSERT
    WITH CHECK (
      visit_id IN (
        SELECT id FROM visits WHERE status = 'active'
      )
    );

  -- Allow anyone to read transcript entries for active sessions
  CREATE POLICY "Anyone can read transcript entries for active sessions"
    ON transcript_entries FOR SELECT
    USING (
      visit_id IN (
        SELECT id FROM visits WHERE status IN ('active', 'ended')
      )
    );
  ```
- [ ] Verify `visit_summaries` allows reads for sessions the user participated in
- [ ] Verify `visits` allows anonymous read for join flow (patient needs to query by join_code)

### 3. Schema Columns
- [ ] `visits` table has: `join_code`, `status`, `patient_name`, `patient_email`
- [ ] `visit_summaries` table has: `doctor_report` (jsonb), `patient_report` (jsonb)
- [ ] `transcript_entries` table has: `cultural_flag` (jsonb)

### 4. Auth Providers
- [ ] Google OAuth enabled in Authentication → Providers
- [ ] Email/password enabled
- [ ] Redirect URL matches: `https://<project>.supabase.co/auth/v1/callback`

---

## Vercel Deployment Checklist

- [ ] Environment variables set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`
- [ ] Build passes on Vercel (same as local `npm run build`)
- [ ] HTTPS enabled (required for Web Speech API in production)
- [ ] Domain configured (if using custom domain)

---

## Implementation Plan

| # | Task | Type | Done When |
|---|------|------|-----------|
| 1 | Automated integration test script | infra | Script runs build + lint + type-check, hits `/api/health`, validates all route files exist. Returns pass/fail per check. |
| 2 | Fix summary page to fetch real data | frontend | `/summary/[id]` fetches from `visit_summaries` by ID and renders actual report. Placeholder removed. |
| 3 | Add error handling to realtime hooks | actions | `useRealtimeTranscript` and `useSessionStatus` handle Supabase errors and expose error state. |
| 4 | Style doctor + patient session pages | frontend | Both pages use shadcn components + Tailwind, visually consistent with dashboard. (Elliot's domain — coordinate) |

**Note:** Tasks 2 + 3 are Leo's domain (backend integration). Task 4 is Elliot's domain (frontend UI). Task 1 is a new script anyone can run.

---

## Summary

**MVP verdict: CONDITIONAL GO.**

The core flow works end-to-end: auth → create session → join → translate → realtime transcript → end session → reports. The two critical gaps are:
1. **Summary page is placeholder** — but the patient sees their report inline anyway, and the doctor gets redirected to dashboard (not to `/summary/[id]`), so this only breaks if someone navigates directly
2. **Session pages are unstyled** — functional but visually jarring compared to the polished marketing/dashboard pages

For a hackathon demo where you control the flow, this is **demo-viable as-is**. The manual testing guide above covers every integration point.
