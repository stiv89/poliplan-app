-- Reseñas públicas sin iniciar sesión (token anónimo por dispositivo para deduplicar)

alter table public.teacher_reviews
  alter column author_id drop not null;

alter table public.teacher_reviews
  add column if not exists anonymous_client_id text;

alter table public.teacher_reviews
  drop constraint if exists teacher_reviews_teacher_id_author_id_academic_period_id_key;

create unique index if not exists teacher_reviews_auth_unique_idx
  on public.teacher_reviews (
    teacher_id,
    author_id,
    coalesce(academic_period_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where author_id is not null;

create unique index if not exists teacher_reviews_anon_unique_idx
  on public.teacher_reviews (
    teacher_id,
    anonymous_client_id,
    coalesce(academic_period_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where author_id is null and anonymous_client_id is not null;

create or replace function public.submit_public_teacher_review(
  p_teacher_id uuid,
  p_body text,
  p_rating smallint,
  p_client_token text,
  p_course_id uuid default null,
  p_academic_period_id uuid default null
)
returns table (
  id uuid,
  teacher_id uuid,
  course_id uuid,
  academic_period_id uuid,
  body text,
  rating smallint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_body text;
  v_token text;
  v_client_id text;
  v_row public.teacher_reviews%rowtype;
begin
  v_body := trim(coalesce(p_body, ''));
  v_token := trim(coalesce(p_client_token, ''));

  if p_teacher_id is null then
    raise exception 'teacher_required';
  end if;

  if char_length(v_body) < 10 or char_length(v_body) > 2000 then
    raise exception 'invalid_body_length';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'invalid_rating';
  end if;

  if char_length(v_token) < 8 then
    raise exception 'invalid_client_token';
  end if;

  if not exists (select 1 from public.teachers t where t.id = p_teacher_id) then
    raise exception 'teacher_not_found';
  end if;

  v_client_id := md5(v_token);

  insert into public.teacher_reviews (
    teacher_id,
    course_id,
    academic_period_id,
    author_id,
    anonymous_client_id,
    body,
    rating
  )
  values (
    p_teacher_id,
    p_course_id,
    p_academic_period_id,
    null,
    v_client_id,
    v_body,
    p_rating
  )
  returning * into v_row;

  return query
  select
    v_row.id,
    v_row.teacher_id,
    v_row.course_id,
    v_row.academic_period_id,
    v_row.body,
    v_row.rating,
    v_row.created_at;
end;
$$;

revoke all on function public.submit_public_teacher_review(uuid, text, smallint, text, uuid, uuid) from public;
grant execute on function public.submit_public_teacher_review(uuid, text, smallint, text, uuid, uuid)
  to anon, authenticated;
