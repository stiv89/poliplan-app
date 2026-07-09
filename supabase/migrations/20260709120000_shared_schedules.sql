create table if not exists public.shared_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  selected_career_id uuid references public.careers(id) on delete set null,
  section_ids uuid[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_shared_schedules_created_at on public.shared_schedules(created_at desc);

alter table public.shared_schedules enable row level security;

create policy "Public read shared schedules"
  on public.shared_schedules for select
  using (true);

create policy "Public create shared schedules"
  on public.shared_schedules for insert
  with check (
    char_length(trim(name)) > 0
    and cardinality(section_ids) > 0
    and cardinality(section_ids) <= 40
  );
