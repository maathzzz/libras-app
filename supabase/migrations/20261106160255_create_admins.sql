-- CMS operators. They sign in with Supabase Auth like the learners, but being an operator is
-- decided only by this table: a learner's token never reaches the /v1/admin routes. An
-- operator is deactivated instead of deleted, so who did what stays known.
create table app.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Copied from Auth when the operator is added, to list operators without the Auth API.
  email text not null check (char_length(email) between 3 and 254),
  name text not null check (char_length(name) between 1 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
