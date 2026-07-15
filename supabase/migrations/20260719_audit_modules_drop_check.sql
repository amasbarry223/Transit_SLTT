-- La contrainte CHECK dupliquait manuellement le type TS AuditModule
-- (src/lib/audit.ts) et a déjà causé un échec silencieux d'insertion
-- quand les deux ont divergé (voir 20260718_audit_modules_v4.sql).
-- insertAuditLog() ne construit déjà que des valeurs du type AuditModule ;
-- on retire la deuxième source de vérité plutôt que de continuer à la
-- maintenir en miroir.
alter table public.audit_logs drop constraint if exists audit_logs_module_check;
