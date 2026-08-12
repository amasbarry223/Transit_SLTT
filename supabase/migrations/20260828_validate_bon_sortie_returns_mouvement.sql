-- Audit : validateBon() (src/lib/store/bons-slice.ts) insère un mouvement
-- réel côté serveur via validate_bon_sortie(), mais le client ignorait cette
-- ligne et fabriquait son propre id local `M-${mouvementSeq}` (compteur
-- client). Deux validations concurrentes pouvaient produire le même id
-- local (clés React dupliquées), et cet id ne correspondait de toute façon
-- jamais à la clé primaire réelle en base tant qu'un refetch ne la
-- remplaçait pas. On fait retourner l'id du mouvement réellement inséré,
-- pour que le store utilise cet id au lieu d'en fabriquer un.
--
-- Le type de retour change (composite -> table), donc CREATE OR REPLACE ne
-- suffit pas : il faut DROP puis recréer.

drop function if exists public.validate_bon_sortie(uuid, text);

create or replace function public.validate_bon_sortie(p_bon_id uuid, p_responsable text default null)
returns table (
  bon public.bons_sortie,
  mouvement_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bons_sortie%rowtype;
  s public.stock_items%rowtype;
  m public.mouvements%rowtype;
  v_resp text;
begin
  if not public.has_permission('bons:write') then
    raise exception 'Permission bons:write requise';
  end if;

  select * into b from public.bons_sortie where id = p_bon_id for update;
  if not found then
    raise exception 'Bon introuvable';
  end if;
  if not public.has_annexe_access(b.annexe_id) then
    raise exception 'Bon hors de votre périmètre d''annexe';
  end if;
  if b.statut = 'Validé' then
    raise exception 'Bon déjà validé';
  end if;

  select * into s from public.stock_items where id = b.stock_id for update;
  if not found then
    raise exception 'Stock introuvable pour ce bon';
  end if;
  if coalesce(s.quantite, 0) < coalesce(b.quantite, 0) then
    raise exception 'Stock insuffisant (%) pour la quantité demandée (%)', s.quantite, b.quantite;
  end if;

  update public.stock_items
  set quantite = quantite - b.quantite
  where id = s.id
    and quantite >= b.quantite;
  if not found then
    raise exception 'Stock insuffisant (course concurrente)';
  end if;

  v_resp := coalesce(nullif(p_responsable, ''), 'Système');

  insert into public.mouvements (
    stock_id, societe_id, annexe_id, type, quantite, date, responsable, marchandise, unite, bon_ref
  ) values (
    s.id, s.societe_id, s.annexe_id, 'Sortie', b.quantite, now(), v_resp, s.marchandise, s.unite, b.reference
  )
  returning * into m;

  update public.bons_sortie set statut = 'Validé' where id = b.id returning * into b;

  return query select b, m.id;
end;
$$;

revoke all on function public.validate_bon_sortie(uuid, text) from public;
grant execute on function public.validate_bon_sortie(uuid, text) to authenticated;
