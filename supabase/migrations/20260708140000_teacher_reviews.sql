-- Docentes normalizados + reseñas anónimas (autor oculto vía vista pública)

create or replace function public.normalize_teacher_name(p_name text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    return null;
  end if;

  v := lower(trim(p_name));
  v := translate(v, 'áéíóúñü', 'aeiounu');
  v := regexp_replace(v, '^(prof\.?|dr\.?|dra\.?|ing\.?|lic\.?)\s+', '', 'i');
  v := regexp_replace(v, '\s+', ' ', 'g');
  v := trim(v);

  if length(v) = 0 then
    return null;
  end if;

  return v;
end;
$$;

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  name_normalized text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists teachers_email_unique_idx
  on public.teachers (lower(email))
  where email is not null;

create unique index if not exists teachers_name_only_unique_idx
  on public.teachers (name_normalized)
  where email is null;

alter table public.sections
  add column if not exists teacher_id uuid references public.teachers(id) on delete set null;

create index if not exists idx_sections_teacher_id on public.sections(teacher_id);

create table if not exists public.teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  academic_period_id uuid references public.academic_periods(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 10 and 2000),
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  unique (teacher_id, author_id, academic_period_id)
);

create index if not exists idx_teacher_reviews_teacher_id on public.teacher_reviews(teacher_id);
create index if not exists idx_teacher_reviews_course_id on public.teacher_reviews(course_id);

create table if not exists public.teacher_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.teacher_reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 5 and 500),
  created_at timestamptz not null default timezone('utc', now()),
  unique (review_id, reporter_id)
);

-- Vista pública sin author_id
create or replace view public.teacher_reviews_public
with (security_invoker = true)
as
select
  id,
  teacher_id,
  course_id,
  academic_period_id,
  body,
  rating,
  created_at
from public.teacher_reviews;

-- Backfill docentes desde secciones existentes (por email)
insert into public.teachers (name, email, name_normalized)
select distinct on (lower(trim(teacher_email)))
  trim(teacher_name),
  lower(trim(teacher_email)),
  coalesce(public.normalize_teacher_name(teacher_name), lower(trim(teacher_email)))
from public.sections
where teacher_email is not null
  and length(trim(teacher_email)) > 0
  and teacher_name is not null
  and length(trim(teacher_name)) > 0
order by lower(trim(teacher_email)), teacher_name
on conflict do nothing;

-- Backfill docentes solo por nombre
insert into public.teachers (name, email, name_normalized)
select distinct on (public.normalize_teacher_name(teacher_name))
  trim(teacher_name),
  null,
  public.normalize_teacher_name(teacher_name)
from public.sections
where teacher_name is not null
  and length(trim(teacher_name)) > 0
  and public.normalize_teacher_name(teacher_name) is not null
  and (teacher_email is null or length(trim(teacher_email)) = 0)
  and not exists (
    select 1
    from public.teachers t
    where t.email is null
      and t.name_normalized = public.normalize_teacher_name(sections.teacher_name)
  );

update public.sections s
set teacher_id = t.id
from public.teachers t
where s.teacher_id is null
  and s.teacher_email is not null
  and length(trim(s.teacher_email)) > 0
  and lower(trim(s.teacher_email)) = lower(t.email);

update public.sections s
set teacher_id = t.id
from public.teachers t
where s.teacher_id is null
  and s.teacher_name is not null
  and (s.teacher_email is null or length(trim(s.teacher_email)) = 0)
  and t.email is null
  and t.name_normalized = public.normalize_teacher_name(s.teacher_name);

create or replace function public.resolve_teacher(p_name text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
  v_email text;
  v_normalized text;
begin
  v_name := nullif(trim(p_name), '');
  v_email := nullif(lower(trim(p_email)), '');

  if v_name is null and v_email is null then
    return null;
  end if;

  if v_email is not null then
    select id into v_id from public.teachers where lower(email) = v_email limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  v_normalized := public.normalize_teacher_name(coalesce(v_name, v_email));

  if v_email is null and v_normalized is not null then
    select id into v_id
    from public.teachers
    where email is null and name_normalized = v_normalized
    limit 1;

    if v_id is not null then
      return v_id;
    end if;
  end if;

  if v_email is not null then
    begin
      insert into public.teachers (name, email, name_normalized)
      values (
        coalesce(v_name, v_email),
        v_email,
        coalesce(v_normalized, v_email)
      );
    exception when unique_violation then
      null;
    end;

    select id into v_id from public.teachers where lower(email) = v_email limit 1;
    return v_id;
  end if;

  if v_normalized is not null then
    begin
      insert into public.teachers (name, email, name_normalized)
      values (coalesce(v_name, 'Docente'), null, v_normalized);
    exception when unique_violation then
      null;
    end;

    select id into v_id
    from public.teachers
    where email is null and name_normalized = v_normalized
    limit 1;
  end if;

  return v_id;
end;
$$;

revoke all on function public.resolve_teacher(text, text) from public;
grant execute on function public.resolve_teacher(text, text) to anon, authenticated;

create trigger set_teachers_updated_at before update on public.teachers
for each row execute function public.set_updated_at();

alter table public.teachers enable row level security;
alter table public.teacher_reviews enable row level security;
alter table public.teacher_review_reports enable row level security;

create policy "Public read teachers"
  on public.teachers for select
  using (true);

create policy "Public read reviews"
  on public.teacher_reviews for select
  using (true);

create policy "Authenticated insert reviews"
  on public.teacher_reviews for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authenticated insert review reports"
  on public.teacher_review_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

revoke all on public.teacher_reviews from anon, authenticated;
grant select (id, teacher_id, course_id, academic_period_id, body, rating, created_at)
  on public.teacher_reviews to anon, authenticated;
grant insert on public.teacher_reviews to authenticated;

revoke all on public.teacher_review_reports from anon, authenticated;
grant insert on public.teacher_review_reports to authenticated;
