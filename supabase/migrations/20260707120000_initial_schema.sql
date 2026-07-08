-- PoliPlan schema
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year integer not null,
  term integer not null,
  starts_at date,
  ends_at date,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  faculty text,
  campus text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  career_id uuid not null references public.careers(id) on delete cascade,
  level integer,
  semester integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  section_code text not null,
  shift text,
  teacher_name text,
  teacher_email text,
  capacity integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.class_meetings (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null,
  classroom text,
  special_dates jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  exam_type text not null,
  exam_date date,
  start_time time,
  end_time time,
  classroom text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.schedule_versions (
  id uuid primary key default gen_random_uuid(),
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  version integer not null,
  source_url text,
  source_file_name text,
  source_checksum text,
  source_modified_at timestamptz,
  imported_at timestamptz not null default timezone('utc', now()),
  is_active boolean not null default false,
  import_status text not null,
  error_message text
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  career_id uuid references public.careers(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  academic_period_id uuid not null references public.academic_periods(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_schedule_sections (
  id uuid primary key default gen_random_uuid(),
  user_schedule_id uuid not null references public.user_schedules(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_schedule_id, section_id)
);

create table if not exists public.schedule_imports (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  file_name text,
  checksum text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  status text not null,
  rows_processed integer not null default 0,
  rows_rejected integer not null default 0,
  errors jsonb
);

create index if not exists idx_sections_academic_period_id on public.sections(academic_period_id);
create index if not exists idx_sections_course_id on public.sections(course_id);
create index if not exists idx_class_meetings_section_id on public.class_meetings(section_id);
create index if not exists idx_courses_career_id on public.courses(career_id);
create index if not exists idx_user_schedules_user_id on public.user_schedules(user_id);
create index if not exists idx_schedule_versions_academic_period_id on public.schedule_versions(academic_period_id);
create index if not exists idx_schedule_versions_is_active on public.schedule_versions(is_active);

create trigger set_academic_periods_updated_at before update on public.academic_periods
for each row execute function public.set_updated_at();
create trigger set_careers_updated_at before update on public.careers
for each row execute function public.set_updated_at();
create trigger set_courses_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger set_sections_updated_at before update on public.sections
for each row execute function public.set_updated_at();
create trigger set_class_meetings_updated_at before update on public.class_meetings
for each row execute function public.set_updated_at();
create trigger set_exams_updated_at before update on public.exams
for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger set_user_schedules_updated_at before update on public.user_schedules
for each row execute function public.set_updated_at();

alter table public.academic_periods enable row level security;
alter table public.careers enable row level security;
alter table public.courses enable row level security;
alter table public.sections enable row level security;
alter table public.class_meetings enable row level security;
alter table public.exams enable row level security;
alter table public.schedule_versions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_schedules enable row level security;
alter table public.user_schedule_sections enable row level security;
alter table public.schedule_imports enable row level security;

create policy "Public read academic periods"
  on public.academic_periods for select
  using (true);

create policy "Public read careers"
  on public.careers for select
  using (true);

create policy "Public read courses"
  on public.courses for select
  using (true);

create policy "Public read sections"
  on public.sections for select
  using (true);

create policy "Public read class meetings"
  on public.class_meetings for select
  using (true);

create policy "Public read exams"
  on public.exams for select
  using (true);

create policy "Public read active schedule versions"
  on public.schedule_versions for select
  using (is_active = true);

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

create policy "Users read own schedules"
  on public.user_schedules for select
  using (auth.uid() = user_id);

create policy "Users insert own schedules"
  on public.user_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users update own schedules"
  on public.user_schedules for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own schedules"
  on public.user_schedules for delete
  using (auth.uid() = user_id);

create policy "Users read own schedule sections"
  on public.user_schedule_sections for select
  using (
    exists (
      select 1
      from public.user_schedules us
      where us.id = user_schedule_sections.user_schedule_id
        and us.user_id = auth.uid()
    )
  );

create policy "Users insert own schedule sections"
  on public.user_schedule_sections for insert
  with check (
    exists (
      select 1
      from public.user_schedules us
      where us.id = user_schedule_sections.user_schedule_id
        and us.user_id = auth.uid()
    )
  );

create policy "Users update own schedule sections"
  on public.user_schedule_sections for update
  using (
    exists (
      select 1
      from public.user_schedules us
      where us.id = user_schedule_sections.user_schedule_id
        and us.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.user_schedules us
      where us.id = user_schedule_sections.user_schedule_id
        and us.user_id = auth.uid()
    )
  );

create policy "Users delete own schedule sections"
  on public.user_schedule_sections for delete
  using (
    exists (
      select 1
      from public.user_schedules us
      where us.id = user_schedule_sections.user_schedule_id
        and us.user_id = auth.uid()
    )
  );

-- schedule_imports: sin acceso público. Solo service_role vía bypass RLS en procesos administrativos.
