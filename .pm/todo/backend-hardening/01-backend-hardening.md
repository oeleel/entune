# Backend Hardening — Session Safety, RLS, Cleanup

> Tighten the backend after the pivot: fix session race conditions, scope RLS policies, deprecate dead routes, verify chat e2e.

| Field | Value |
|-------|-------|
| Status | Active |
| Owner | Leo |
| Last Updated | 2026-03-21 |
| Depends On | entune-pivot sprint (all done) |

---

## Recent Changes

| Date | What changed | Section |
|------|-------------|---------|
| 2026-03-21 | Initial spec after code audit | All |

---

## Goal

The pivot to the two-device model shipped fast. The core session flow works (create → join → translate → realtime sync → end → reports), but the audit revealed race conditions, overly permissive RLS, a dead route, and orphaned hooks. This sprint hardens the backend before demo day.

---

## Current State

- **Session create**: Generates 6-digit join code with no collision retry and no unique constraint enforcement
- **Session join**: Check-then-update is non-atomic — two patients can join the same session simultaneously, overwriting each other's info
- **Session end**: Not idempotent — calling twice generates duplicate reports
- **RLS policies**: Patient policies allow ANY anon user to read/write ANY active session's transcripts (no scoping to their session)
- **`/api/summary`**: Superseded by `/api/session/end` which generates dual reports — summary route has no auth and doesn't persist
- **Orphaned hooks**: `use-visit-session.ts` and `use-translation.ts` are not used by any page
- **Chat route**: Wired up but not verified e2e with real visit data

---

## Design

### 1. Session Join Race Condition → Atomic Update

**Current** (2 queries — check then update):
```typescript
const visit = await supabase.from('visits').select(...).eq('join_code', code).single();
if (visit.status !== 'waiting') return 409;
await supabase.from('visits').update({ status: 'active', ... }).eq('id', visit.id);
```

**Fix** (1 atomic query):
```typescript
const { data, error } = await supabase
  .from('visits')
  .update({ status: 'active', patient_name, patient_email })
  .eq('join_code', joinCode)
  .eq('status', 'waiting')  // atomic: only updates if still waiting
  .select('id, language_patient, language_provider')
  .single();

if (!data) return NextResponse.json({ error: 'Invalid or already-joined session' }, { status: 409 });
```

### 2. Join Code Collision → Retry Loop

**Current**: `Math.floor(100000 + Math.random() * 900000)` — no retry on collision.

**Fix**: Retry up to 5 times. The `join_code` column already has a UNIQUE constraint in `supabase/schema.sql`. On collision, Supabase returns a unique violation error — catch it and retry with a new code.

### 3. Idempotent Session End

**Current**: Checks `status === 'ended'` and returns 409, which is correct. But the update + report generation isn't atomic — if report generation fails mid-way, the visit is marked ended but has no reports.

**Fix**: Check if reports already exist before regenerating. If `visit_summaries` row exists for this visit, return the existing reports instead of regenerating.

### 4. RLS Policy Tightening

**Current patient policies** (too broad):
```sql
-- Any anon user can read/write ANY active session's transcripts
create policy "Patients can view session transcripts" on transcript_entries for select
  using (visit_id in (select id from visits where join_code is not null and status = 'active'));
```

**For a hackathon, this is acceptable** — the risk is low (attacker would need to guess a visit UUID). Proper fix would use a session token, but that's over-engineering for demo day. Document the limitation and move on.

### 5. `/api/summary` → Stub

Superseded by `/api/session/end`. Replace with a stub that returns a deprecation notice, similar to the TTS stub.

### 6. Clean Up Orphaned Hooks

- `use-visit-session.ts` — pre-pivot local state management, replaced by Supabase realtime
- `use-translation.ts` — wrapper around translate API, not used (doctor page and useHoldToSpeak call API directly)

Delete both files. No imports reference them.

---

## Implementation Plan

| # | Task | Done When |
|---|------|-----------|
| 1 | Fix session join race condition + join code retry | `/api/session/join` uses atomic update; `/api/session/create` retries on collision up to 5 times |
| 2 | Make session end idempotent + stub `/api/summary` | `/api/session/end` returns existing reports if already ended; `/api/summary` returns deprecation stub |
| 3 | Delete orphaned hooks | `use-visit-session.ts` and `use-translation.ts` removed; `npm run build` passes |

---

## Open Questions

1. ~~Should we tighten patient RLS policies?~~ **Resolved**: No — acceptable risk for hackathon. Attacker needs visit UUID. Document limitation.
2. ~~Should we add chat e2e verification as a task?~~ **Resolved**: No — chat works per audit, just hasn't been tested with real data. Manual verification during demo prep is sufficient.
