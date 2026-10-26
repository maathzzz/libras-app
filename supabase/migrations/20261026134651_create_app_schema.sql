-- Application schema. It stays out of the Data API (`[api].schemas` in config.toml): only the
-- BFF reads and writes it, connecting as the table owner. anon and authenticated get no
-- privilege here, so even if the schema were exposed by mistake they could not read it.
create schema app;

revoke all on schema app from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Content
--
-- Content ids are readable slugs ("alfabeto-vogais") instead of generated keys: the app shows
-- them in routes and the seed upserts by id, so they must be stable across environments.
-- ---------------------------------------------------------------------------------------------

create table app.courses (
  id text primary key,
  title text not null,
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

-- Each unit is a module of the trail shown on the home screen.
create table app.units (
  id text primary key,
  course_id text not null references app.courses (id) on delete cascade,
  title text not null,
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create index units_course_id_position_idx on app.units (course_id, position);

create table app.lessons (
  id text primary key,
  unit_id text not null references app.units (id) on delete cascade,
  title text not null,
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create index lessons_unit_id_position_idx on app.lessons (unit_id, position);

-- `payload` is the whole `Exercise` from @libras/contracts and is validated with it before
-- every write. `type` and `id` are repeated as columns to filter without reading the JSON;
-- the check keeps both copies equal.
create table app.exercises (
  id text primary key,
  lesson_id text not null references app.lessons (id) on delete cascade,
  type text not null,
  position integer not null check (position > 0),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint exercises_payload_matches_columns check (
    payload ->> 'id' = id and payload ->> 'type' = type
  )
);

create index exercises_lesson_id_position_idx on app.exercises (lesson_id, position);

-- A sign with movement has one image per frame, in order. Paths are relative to Supabase
-- Storage; while there are no pictures they hold placeholder URLs.
create table app.signs (
  id text primary key,
  label text not null,
  image_paths text[] not null check (cardinality(image_paths) > 0),
  alt text not null,
  created_at timestamptz not null default now()
);

-- Which signs an exercise shows, to find the exercises affected when a sign's images change.
create table app.exercise_signs (
  exercise_id text not null references app.exercises (id) on delete cascade,
  sign_id text not null references app.signs (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (exercise_id, sign_id)
);

create index exercise_signs_sign_id_idx on app.exercise_signs (sign_id);

-- ---------------------------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------------------------

-- Same id as the Supabase Auth user. Removing the account removes the profile and, through
-- the cascades below, all of its progress.
create table app.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  daily_goal smallint not null default 1 check (daily_goal in (1, 3, 5, 8)),
  start_level text not null default 'beginner'
    check (start_level in ('beginner', 'basic', 'conversational')),
  -- IANA zone. The streak's "day" is the local date in it. Validated by the BFF: Postgres
  -- cannot check a zone name in a constraint.
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Progress
--
-- Progress rows reference lessons with `on delete restrict`: removing content must never
-- erase what a learner has done.
-- ---------------------------------------------------------------------------------------------

-- One row per lesson completion. `response` is the CompleteLessonResponse sent back, so a
-- retry with the same Idempotency-Key gets exactly the same answer. The unique constraint
-- stops two concurrent retries from both granting XP.
create table app.lesson_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references app.profiles (id) on delete cascade,
  lesson_id text not null references app.lessons (id) on delete restrict,
  idempotency_key uuid not null,
  completed_at timestamptz not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  constraint lesson_sessions_user_id_idempotency_key_key unique (user_id, idempotency_key)
);

-- Lessons finished today (daily goal): sessions of a user within a time range.
create index lesson_sessions_user_id_completed_at_idx
  on app.lesson_sessions (user_id, completed_at);
create index lesson_sessions_lesson_id_idx on app.lesson_sessions (lesson_id);

-- Which lessons a learner has finished, used to unlock the next ones.
create table app.user_lesson_progress (
  user_id uuid not null references app.profiles (id) on delete cascade,
  lesson_id text not null references app.lessons (id) on delete restrict,
  completion_count integer not null default 1 check (completion_count > 0),
  last_completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index user_lesson_progress_lesson_id_idx on app.user_lesson_progress (lesson_id);

-- Stored streak values are the ones from the last activity. Whether the streak is still
-- alive is computed on read from last_active_date, so no job ever updates this table.
create table app.user_stats (
  user_id uuid primary key references app.profiles (id) on delete cascade,
  xp_total integer not null default 0 check (xp_total >= 0),
  streak_current integer not null default 0 check (streak_current >= 0),
  streak_longest integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  constraint user_stats_streak_longest_check check (streak_longest >= streak_current)
);
