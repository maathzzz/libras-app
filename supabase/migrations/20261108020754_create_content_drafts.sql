-- The CMS draft: a working copy of the content that operators edit. The app keeps reading
-- only the published tables (courses, units, lessons, exercises, signs); "Publicar
-- alterações" compares this copy with them and applies the differences in one transaction.
-- So these tables have the same columns and keys as the published ones, and the same ids:
-- a draft row and the published row with its id are the same piece of content.
--
-- Unlike the published tables, deleting a draft row is harmless (the published row and the
-- learners' progress stay until a publish), so the hierarchy cascades and a whole trail can
-- be removed from the draft at once.

create table app.draft_courses (
  id text primary key,
  title text not null check (char_length(title) between 1 and 80),
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create table app.draft_units (
  id text primary key,
  course_id text not null references app.draft_courses (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create index draft_units_course_id_position_idx on app.draft_units (course_id, position);

create table app.draft_lessons (
  id text primary key,
  unit_id text not null references app.draft_units (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create index draft_lessons_unit_id_position_idx on app.draft_lessons (unit_id, position);

-- Validated with `Exercise` from @libras/contracts before every write, like app.exercises.
create table app.draft_exercises (
  id text primary key,
  lesson_id text not null references app.draft_lessons (id) on delete cascade,
  type text not null,
  position integer not null check (position > 0),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint draft_exercises_payload_matches_columns check (
    payload ->> 'id' = id and payload ->> 'type' = type
  )
);

create index draft_exercises_lesson_id_position_idx on app.draft_exercises (lesson_id, position);

-- image_paths are public Storage URLs. A new image always goes to a new path, so replacing a
-- picture in the draft never changes the file the published sign points to.
create table app.draft_signs (
  id text primary key,
  label text not null check (char_length(label) between 1 and 40),
  image_paths text[] not null check (cardinality(image_paths) between 1 and 8),
  alt text not null check (char_length(alt) between 1 and 200),
  description text check (description is null or char_length(description) between 1 and 500),
  created_at timestamptz not null default now()
);

-- Restrict: a sign that a draft exercise shows cannot leave the draft.
create table app.draft_exercise_signs (
  exercise_id text not null references app.draft_exercises (id) on delete cascade,
  sign_id text not null references app.draft_signs (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (exercise_id, sign_id)
);

create index draft_exercise_signs_sign_id_idx on app.draft_exercise_signs (sign_id);

-- The draft starts equal to what is published, so the first publish has nothing to apply.
insert into app.draft_courses (id, title, position, created_at)
select id, title, position, created_at from app.courses;

insert into app.draft_units (id, course_id, title, position, created_at)
select id, course_id, title, position, created_at from app.units;

insert into app.draft_lessons (id, unit_id, title, position, created_at)
select id, unit_id, title, position, created_at from app.lessons;

insert into app.draft_exercises (id, lesson_id, type, position, payload, created_at)
select id, lesson_id, type, position, payload, created_at from app.exercises;

insert into app.draft_signs (id, label, image_paths, alt, description, created_at)
select id, label, image_paths, alt, description, created_at from app.signs;

insert into app.draft_exercise_signs (exercise_id, sign_id, created_at)
select exercise_id, sign_id, created_at from app.exercise_signs;
