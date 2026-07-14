-- Étend les modules audités : Contrats, Dépenses, Sociétés
alter table public.audit_logs drop constraint if exists audit_logs_module_check;

alter table public.audit_logs add constraint audit_logs_module_check check (
  module = any (
    array[
      'Authentification'::text,
      'Dossiers'::text,
      'Comptabilité'::text,
      'Factures'::text,
      'Stock'::text,
      'Bons'::text,
      'Clients'::text,
      'Transporteurs'::text,
      'Utilisateurs'::text,
      'Fournisseurs'::text,
      'Devis'::text,
      'Contrats'::text,
      'Dépenses'::text,
      'Sociétés'::text
    ]
  )
);
