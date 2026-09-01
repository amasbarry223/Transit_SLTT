-- Le module Calendrier UI a été retiré. Nettoie la clé morte des profils.
-- Le trigger protect_profiles_sensitive_columns bloque toute écriture de
-- permissions hors admin/service_role : on le désactive le temps du nettoyage.

alter table public.profiles disable trigger trg_protect_profiles_sensitive;

update public.profiles
set permissions = array_remove(permissions, 'calendrier:read')
where permissions @> array['calendrier:read']::text[];

alter table public.profiles enable trigger trg_protect_profiles_sensitive;
