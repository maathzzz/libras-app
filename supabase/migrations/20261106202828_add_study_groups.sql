-- Studies used to belong to a trail. They now belong to a study group: a named section of the
-- "Estudar" tab with no link to the trails, so a study can be grouped and moved freely.
create table app.study_groups (
  id text primary key,
  title text not null check (char_length(title) between 1 and 80),
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

-- Every trail that has studies becomes a group with the same id, title and position, so the
-- tab shows the same sections right after this migration.
insert into app.study_groups (id, title, position)
select courses.id, courses.title, courses.position
from app.courses as courses
where exists (select 1 from app.studies as studies where studies.trail_id = courses.id);

-- No cascade: a group that still has studies cannot be deleted, so no study disappears along
-- with its group. Its studies are moved to another group first.
alter table app.studies add column group_id text references app.study_groups (id);
update app.studies set group_id = trail_id;
alter table app.studies alter column group_id set not null;

drop index app.studies_trail_id_position_idx;
alter table app.studies drop column trail_id;

create index studies_group_id_position_idx on app.studies (group_id, position);
