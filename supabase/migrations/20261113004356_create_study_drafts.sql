-- Study groups and studies join the CMS draft. Like the other draft tables, they have the same
-- columns and keys as the published ones (app.study_groups, app.studies) and the same ids, and
-- "Publicar alterações" applies the differences to the published tables.
--
-- Unlike the rest of the draft hierarchy, a group does not cascade to its studies: as in the
-- published tables, a group that still has studies cannot be deleted. Its studies are moved
-- to another group first.

create table app.draft_study_groups (
  id text primary key,
  title text not null check (char_length(title) between 1 and 80),
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

-- `pages` is validated with StudyPage from @libras/contracts before every write.
create table app.draft_studies (
  id text primary key,
  group_id text not null references app.draft_study_groups (id),
  position integer not null check (position > 0),
  title text not null,
  description text not null,
  pages jsonb not null check (jsonb_typeof(pages) = 'array' and jsonb_array_length(pages) > 0),
  created_at timestamptz not null default now()
);

create index draft_studies_group_id_position_idx on app.draft_studies (group_id, position);

-- The draft starts equal to what is published.
insert into app.draft_study_groups (id, title, position, created_at)
select id, title, position, created_at from app.study_groups;

insert into app.draft_studies (id, group_id, position, title, description, pages, created_at)
select id, group_id, position, title, description, pages, created_at from app.studies;

-- Published sign blocks may not say which sign they were copied from (`signId`). Where the
-- block's label names exactly one draft sign, the draft copy gets that sign's id, so the CMS
-- can keep the copy up to date and keep the sign from being deleted. Any other sign block is
-- left as it is and must be picked again in the CMS.
with unique_labels as (
  select label, min(id) as id
  from app.draft_signs
  group by label
  having count(*) = 1
)
update app.draft_studies as study
set pages = (
  select jsonb_agg(
    jsonb_set(
      page.value,
      '{blocks}',
      (
        select jsonb_agg(
          case
            when block.value ->> 'type' = 'sign'
              and not block.value ? 'signId'
              and sign.id is not null
              then block.value || jsonb_build_object('signId', sign.id)
            else block.value
          end
          order by block.position
        )
        from jsonb_array_elements(page.value -> 'blocks') with ordinality as block (value, position)
        left join unique_labels as sign on sign.label = block.value ->> 'label'
      )
    )
    order by page.position
  )
  from jsonb_array_elements(study.pages) with ordinality as page (value, position)
);
