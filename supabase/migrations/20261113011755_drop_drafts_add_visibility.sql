-- The CMS no longer keeps a draft copy to publish later: it edits the content the app reads.
-- What learners see is decided by `visible` on trails, units, lessons and studies, so an
-- operator builds a lesson or a study hidden and shows it when it is ready.

drop table app.draft_exercise_signs;
drop table app.draft_exercises;
drop table app.draft_signs;
drop table app.draft_lessons;
drop table app.draft_units;
drop table app.draft_courses;

-- Everything already published stays visible. Content created from now on starts hidden.
alter table app.courses add column visible boolean not null default true;
alter table app.courses alter column visible set default false;

alter table app.units add column visible boolean not null default true;
alter table app.units alter column visible set default false;

alter table app.lessons add column visible boolean not null default true;
alter table app.lessons alter column visible set default false;

alter table app.studies add column visible boolean not null default true;
alter table app.studies alter column visible set default false;

-- A study sign block now says which sign it was copied from (`signId`), so the CMS can keep
-- the copy up to date and keep the sign from being deleted. Blocks written before carry only
-- the label: where exactly one sign has that label, the block gets that sign's id. Any other
-- sign block is left as it is and must be picked again in the CMS.
with unique_labels as (
  select label, min(id) as id
  from app.signs
  group by label
  having count(*) = 1
)
update app.studies as study
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
