# Seed démo

Le fichier [`../../supabase_seed.sql`](../../supabase_seed.sql) contient un **jeu de données fictif** (clients Diallo/Traoré, dossiers `SLTT-TR-2026-*`, factures, stock, etc.).

- **Ne pas** l’exécuter sur la base de production.
- Les migrations dans `../migrations/` restent la seule source de schéma / données métier réelles (sociétés, permissions…).
- Chargement volontaire en local :

```bash
npm run db:seed:demo -- --confirm
```
