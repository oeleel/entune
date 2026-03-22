-- MVP Hardening Migration
-- Ensures: RLS policies for patient (anonymous) access, realtime publication,
-- and all pivot columns exist.

-- ============================================================
-- 1. Ensure all pivot columns exist (idempotent with IF NOT EXISTS)
-- ============================================================
DO $$ BEGIN
  ALTER TABLE visits ADD COLUMN IF NOT EXISTS join_code text;
  ALTER TABLE visits ADD COLUMN IF NOT EXISTS status text DEFAULT 'waiting';
  ALTER TABLE visits ADD COLUMN IF NOT EXISTS patient_name text;
  ALTER TABLE visits ADD COLUMN IF NOT EXISTS patient_email text;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE visit_summaries ADD COLUMN IF NOT EXISTS doctor_report jsonb;
  ALTER TABLE visit_summaries ADD COLUMN IF NOT EXISTS patient_report jsonb;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 2. RLS policies for patient (anonymous/unauthenticated) access
-- ============================================================

-- Patients need to read visits by join_code to join a session
DO $$ BEGIN
  CREATE POLICY "Anyone can read visits by join_code"
    ON visits FOR SELECT
    USING (join_code IS NOT NULL AND status IN ('waiting', 'active'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Patients need to update visits when joining (status waiting -> active)
DO $$ BEGIN
  CREATE POLICY "Anyone can join a waiting session by code"
    ON visits FOR UPDATE
    USING (status = 'waiting' AND join_code IS NOT NULL)
    WITH CHECK (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Patients need to insert transcript entries for active sessions
DO $$ BEGIN
  CREATE POLICY "Anyone can insert transcript entries for active sessions"
    ON transcript_entries FOR INSERT
    WITH CHECK (
      visit_id IN (SELECT id FROM visits WHERE status = 'active')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Patients need to read transcript entries for active/ended sessions
DO $$ BEGIN
  CREATE POLICY "Anyone can read transcript entries for active sessions"
    ON transcript_entries FOR SELECT
    USING (
      visit_id IN (SELECT id FROM visits WHERE status IN ('active', 'ended'))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Patients need to read their visit summary after session ends
DO $$ BEGIN
  CREATE POLICY "Anyone can read summaries for ended sessions"
    ON visit_summaries FOR SELECT
    USING (
      visit_id IN (SELECT id FROM visits WHERE status = 'ended')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Enable realtime publication for transcript + visit status
-- ============================================================

-- Add tables to realtime publication (idempotent — ignores if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transcript_entries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE visits;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Set REPLICA IDENTITY FULL so realtime sends complete row data on updates
ALTER TABLE transcript_entries REPLICA IDENTITY FULL;
ALTER TABLE visits REPLICA IDENTITY FULL;
