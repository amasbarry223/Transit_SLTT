-- F-ANNEXE — Rattachement des tables métier cloisonnées par annexe.
-- Décision produit : toute donnée existante est historiquement Mali (aucune
-- activité Côte d'Ivoire enregistrée avant ce jour) → backfill Mali partout,
-- réassignable ensuite ligne par ligne depuis l'UI. Contrairement à
-- societe_id (nullable sur ecritures/factures), annexe_id est NOT NULL
-- partout : une transaction a toujours un lieu physique d'exécution.

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'dossiers', 'stock_items', 'mouvements',
    'factures', 'ecritures', 'bons_sortie', 'bons_sortie_caisse'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists annexe_id uuid references public.annexes(id) default %L',
      t, '33333333-3333-3333-3333-333333333333'
    );
    execute format(
      'update public.%I set annexe_id = %L where annexe_id is null',
      t, '33333333-3333-3333-3333-333333333333'
    );
    execute format('alter table public.%I alter column annexe_id set not null', t);
    execute format('create index if not exists %I on public.%I (annexe_id)', 'idx_' || t || '_annexe_id', t);
  end loop;
end $$;
