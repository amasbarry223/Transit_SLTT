-- I7 — Remplacement atomique des lignes de facture (évite delete+insert non transactionnel côté client).

create or replace function public.replace_facture_lignes(
  p_facture_id uuid,
  p_lignes jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_facture_id is null then
    raise exception 'facture_id requis';
  end if;

  delete from public.facture_lignes where facture_id = p_facture_id;

  if p_lignes is null or jsonb_typeof(p_lignes) <> 'array' or jsonb_array_length(p_lignes) = 0 then
    return;
  end if;

  insert into public.facture_lignes (
    facture_id,
    description,
    quantite,
    prix_unitaire,
    montant_ht,
    compagnie,
    bordereau_livraison
  )
  select
    p_facture_id,
    coalesce(l.description, ''),
    coalesce((l.quantite)::numeric, 0),
    coalesce((l.prix_unitaire)::numeric, 0),
    coalesce((l.montant_ht)::numeric, coalesce((l.quantite)::numeric, 0) * coalesce((l.prix_unitaire)::numeric, 0)),
    nullif(l.compagnie, ''),
    nullif(l.bordereau_livraison, '')
  from jsonb_to_recordset(p_lignes) as l(
    description text,
    quantite numeric,
    prix_unitaire numeric,
    montant_ht numeric,
    compagnie text,
    bordereau_livraison text
  );
end;
$$;

revoke all on function public.replace_facture_lignes(uuid, jsonb) from public;
grant execute on function public.replace_facture_lignes(uuid, jsonb) to authenticated;
