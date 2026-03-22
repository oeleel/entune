-- Entune Supabase Schema
-- Run this manually against your Supabase project SQL editor

-- Visit sessions (linked to authenticated user)
create table visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  join_code text unique,
  status text not null default 'waiting' check (status in ('waiting', 'active', 'ended')),
  language_patient text not null,
  language_provider text not null,
  patient_name text,
  patient_email text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

-- Transcript entries
create table transcript_entries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  speaker text not null check (speaker in ('patient', 'provider')),
  original_text text not null,
  translated_text text not null,
  cultural_flag jsonb,
  timestamp timestamptz default now()
);

-- Generated summaries (now with separate doctor/patient reports)
create table visit_summaries (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references visits(id) on delete cascade,
  summary_data jsonb not null,
  doctor_report jsonb,
  patient_report jsonb,
  generated_at timestamptz default now()
);

-- User preferences (preferred language, etc.)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_language text default 'en-US',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies: users can only access their own data
alter table visits enable row level security;
alter table transcript_entries enable row level security;
alter table visit_summaries enable row level security;
alter table user_profiles enable row level security;

-- Doctor (authenticated user) policies
create policy "Users can view own visits" on visits for select using (auth.uid() = user_id);
create policy "Users can insert own visits" on visits for insert with check (auth.uid() = user_id);
create policy "Users can update own visits" on visits for update using (auth.uid() = user_id);

-- Patient access by join_code (no auth required — uses anon key)
create policy "Patients can view visit by join_code" on visits for select
  using (join_code is not null);
create policy "Patients can update visit by join_code" on visits for update
  using (join_code is not null);

create policy "Users can view own transcripts" on transcript_entries for select
  using (visit_id in (select id from visits where user_id = auth.uid()));
create policy "Users can insert own transcripts" on transcript_entries for insert
  with check (visit_id in (select id from visits where user_id = auth.uid()));

-- Patient can view/insert transcripts for their active session
create policy "Patients can view session transcripts" on transcript_entries for select
  using (visit_id in (select id from visits where join_code is not null and status = 'active'));
create policy "Patients can insert session transcripts" on transcript_entries for insert
  with check (visit_id in (select id from visits where join_code is not null and status = 'active'));

create policy "Users can view own summaries" on visit_summaries for select
  using (visit_id in (select id from visits where user_id = auth.uid()));
create policy "Users can insert own summaries" on visit_summaries for insert
  with check (visit_id in (select id from visits where user_id = auth.uid()));

create policy "Users can view own profile" on user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on user_profiles for insert with check (auth.uid() = id);

-- Enable Realtime on transcript_entries and visits
alter publication supabase_realtime add table transcript_entries;
alter publication supabase_realtime add table visits;
