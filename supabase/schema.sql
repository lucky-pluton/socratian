-- Supabase Schema for Socratia (Socratic Mathematics Learning App)
-- Run this in your Supabase SQL Editor if deploying with Supabase persistence.

create table if not exists student_profiles (
  id text primary key,
  name text not null default 'Explorer',
  current_stage_id text not null default 'stage-1',
  learning_state jsonb,
  topic_states jsonb,
  curiosity_streak int not null default 1,
  last_active_date text not null,
  reasoning_score int not null default 0,
  questions_asked int not null default 0,
  misconceptions_resolved int not null default 0,
  explanations_given int not null default 0,
  daily_challenge_completed_date text,
  weekly_challenge_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists concept_progress (
  student_id text not null references student_profiles(id) on delete cascade,
  concept_id text not null,
  status text not null check (status in ('undiscovered', 'exploring', 'discovered')),
  mastery int not null default 0,
  student_explanation text,
  active_misconception text,
  discovered_at timestamptz,
  primary key (student_id, concept_id)
);

create table if not exists conversation_messages (
  id text primary key,
  student_id text not null references student_profiles(id) on delete cascade,
  stage_id text not null,
  question_id int,
  role text not null check (role in ('tutor', 'student')),
  content text not null,
  assessment jsonb,
  visual_hint jsonb,
  created_at timestamptz not null default now()
);

create table if not exists journal_entries (
  id text primary key,
  student_id text not null references student_profiles(id) on delete cascade,
  stage_id text not null,
  concept_id text,
  entry_type text not null check (entry_type in ('discovery', 'explanation', 'question', 'reflection')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists earned_badges (
  student_id text not null references student_profiles(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);
