-- Sprint 2 solidité OCR : version atomique + upsert OCR fields + seed permissions documents:*

-- ---------------------------------------------------------------------------
-- Prochaine version document (anti-race concurrente)
-- ---------------------------------------------------------------------------
create or replace function public.next_document_version(p_document_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
  if not public.has_permission('documents:write') then
    raise exception 'permission denied';
  end if;

  select coalesce(max(version), 0) + 1
    into v_next
  from public.document_versions
  where document_id = p_document_id;

  return v_next;
end;
$$;

revoke all on function public.next_document_version(uuid) from public;
grant execute on function public.next_document_version(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Remplace atomiquement les ocr_fields d'un job + met à jour le job
-- ---------------------------------------------------------------------------
create or replace function public.replace_ocr_job_fields(
  p_job_id uuid,
  p_status text,
  p_raw_text text default null,
  p_error_message text default null,
  p_fields jsonb default null
)
returns public.ocr_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.ocr_jobs;
  v_field jsonb;
begin
  if not public.has_permission('documents:write') then
    raise exception 'permission denied';
  end if;

  if p_status not in ('pending','processing','done','failed','validated') then
    raise exception 'invalid status';
  end if;

  update public.ocr_jobs
  set
    status = p_status,
    raw_text = coalesce(p_raw_text, raw_text),
    error_message = p_error_message,
    completed_at = case
      when p_status in ('done','failed','validated') then now()
      else completed_at
    end
  where id = p_job_id
  returning * into v_job;

  if v_job.id is null then
    raise exception 'ocr job not found';
  end if;

  if p_fields is not null then
    delete from public.ocr_fields where ocr_job_id = p_job_id;
    for v_field in select * from jsonb_array_elements(coalesce(p_fields, '[]'::jsonb))
    loop
      insert into public.ocr_fields (ocr_job_id, field_key, field_value, confidence)
      values (
        p_job_id,
        v_field->>'field_key',
        v_field->>'field_value',
        nullif(v_field->>'confidence', '')::numeric
      );
    end loop;
  end if;

  return v_job;
end;
$$;

revoke all on function public.replace_ocr_job_fields(uuid, text, text, text, jsonb) from public;
grant execute on function public.replace_ocr_job_fields(uuid, text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed documents:* sur profils existants selon le rôle (sans écraser Admin)
-- ---------------------------------------------------------------------------
update public.profiles
set permissions = (
  select array_agg(distinct p)
  from unnest(
    coalesce(permissions, '{}'::text[])
    || case role
      when 'Administrateur' then array['documents:read','documents:write']::text[]
      when 'Comptable' then array['documents:read','documents:write']::text[]
      when 'Agent' then array['documents:read','documents:write']::text[]
      when 'Magasinier' then array['documents:read']::text[]
      else '{}'::text[]
    end
  ) as p
)
where role in ('Administrateur', 'Comptable', 'Agent', 'Magasinier');
