-- Colonne orpheline : l'app n'utilise plus checklist_docs (affichage/édition retirés).
-- DROP irréversible — les anciennes listes cochées ({bl, dau, ...}) sont perdues.
ALTER TABLE public.dossiers DROP COLUMN IF EXISTS checklist_docs;
