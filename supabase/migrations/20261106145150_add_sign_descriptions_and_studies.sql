-- How to perform a sign, shown as text below its images. Unlike `alt`, which only screen
-- readers hear and which must not give an exercise's answer away, this is visible teaching
-- text. One per sign: a sign with movement is described across all of its frames. Null while
-- the text has not been written.
alter table app.signs
  add column description text,
  add constraint signs_description_check
    check (description is null or char_length(description) between 1 and 500);

-- Reading material shown in the "Estudar" tab, grouped by trail. `pages` is a list of
-- StudyPage from @libras/contracts and is validated with it before every write. A sign
-- block keeps its own copy of the sign's label, images and description, like exercises do.
create table app.studies (
  id text primary key,
  trail_id text not null references app.courses (id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  description text not null,
  pages jsonb not null check (jsonb_typeof(pages) = 'array' and jsonb_array_length(pages) > 0),
  created_at timestamptz not null default now()
);

create index studies_trail_id_position_idx on app.studies (trail_id, position);
