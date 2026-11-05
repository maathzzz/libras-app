-- Achievements. Their catalog (titles, rules and targets) lives in the BFF's code, next to
-- the rules that unlock them, so only what each learner has unlocked is stored here.

-- Counters the achievement rules read. Kept with the other totals so a lesson completion
-- updates them in the same row, instead of counting sessions on every request.
alter table app.user_stats
  add column lessons_completed integer not null default 0,
  add column perfect_lessons integer not null default 0,
  add constraint user_stats_lessons_completed_check check (lessons_completed >= 0),
  add constraint user_stats_perfect_lessons_check
    check (perfect_lessons between 0 and lessons_completed);

-- Backfill from the sessions already saved. Until now the only way to earn more than the base
-- 10 XP in a lesson was the bonus for no mistakes, so that is what marks a perfect one.
update app.user_stats as stats
set
  lessons_completed = sessions.total,
  perfect_lessons = sessions.perfect
from (
  select
    user_id,
    count(*)::integer as total,
    count(*) filter (where (response ->> 'xpEarned')::integer > 10)::integer as perfect
  from app.lesson_sessions
  group by user_id
) as sessions
where sessions.user_id = stats.user_id;

-- One row per achievement a learner has unlocked; unlocking is permanent. There is no foreign
-- key on achievement_id because the catalog is not a table. The primary key also stops two
-- concurrent lessons from unlocking the same achievement twice.
create table app.user_achievements (
  user_id uuid not null references app.profiles (id) on delete cascade,
  achievement_id text not null check (char_length(achievement_id) between 1 and 60),
  unlocked_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
