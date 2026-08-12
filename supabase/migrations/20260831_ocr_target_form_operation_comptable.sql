-- Ouvre le pipeline OCR existant (20260731_documents_ocr.sql) à un nouveau
-- type de formulaire cible : l'extraction d'une ligne de comptabilité
-- générale (journal de caisse scanné/photographié) en plus de
-- dossier/facture/paiement.
alter table public.ocr_jobs drop constraint if exists ocr_jobs_target_form_check;
alter table public.ocr_jobs add constraint ocr_jobs_target_form_check
  check (target_form in ('dossier', 'facture', 'paiement', 'operation_comptable'));
