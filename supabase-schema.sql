begin;

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists projects_name_idx on public.projects (name);

create table if not exists public.task_entries (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  project text not null,
  entry_date date not null,
  occurred_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes >= 0),
  logged boolean not null default false,
  jira_issue_key text not null default '',
  branch_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists task_entries_entry_date_idx on public.task_entries (entry_date);
create index if not exists task_entries_project_idx on public.task_entries (project);
create index if not exists task_entries_created_at_idx on public.task_entries (created_at desc);

create table if not exists public.punch_records (
  id uuid primary key default gen_random_uuid(),
  punch_type text not null check (punch_type in ('in', 'out')),
  punched_at timestamptz not null
);

create index if not exists punch_records_punched_at_idx on public.punch_records (punched_at desc);

insert into public.projects (name)
select distinct trim(project)
from public.task_entries
where trim(project) <> ''
on conflict (name) do nothing;

alter table public.projects enable row level security;
alter table public.task_entries enable row level security;
alter table public.punch_records enable row level security;

grant select, insert, update, delete on public.projects to anon, authenticated;
grant select, insert, update, delete on public.task_entries to anon, authenticated;
grant select, insert, update, delete on public.punch_records to anon, authenticated;

drop policy if exists projects_all on public.projects;
create policy projects_all
on public.projects
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists task_entries_all on public.task_entries;
create policy task_entries_all
on public.task_entries
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists punch_records_all on public.punch_records;
create policy punch_records_all
on public.punch_records
for all
to anon, authenticated
using (true)
with check (true);

commit;
