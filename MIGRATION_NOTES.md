# Guide Complet de Migration : Supabase → NestJS + Prisma (Transit SLTT)

Ce document fournit l'ensemble des détails techniques, architecturaux et opérationnels de la migration de l'infrastructure backend de Supabase vers une API sur-mesure **NestJS** avec l'ORM **Prisma** et une base **PostgreSQL**.

---

## 1. Ce qui a été migré avec succès

### 1.1 Modèles et Schéma relationnel (`api/prisma/schema.prisma`)
Toutes les tables, clés primaires (UUID), clés étrangères, enums et index du schéma PostgreSQL initial ont été retranscrits fidèlement :

| Entité Supabase | Modèle Prisma | Remarques / Particularités |
| :--- | :--- | :--- |
| `auth.users` + `public.profiles` | `Profile` | Unification dans le modèle `Profile` avec champ `passwordHash` (bcrypt 12 rounds) |
| `annexes` | `Annexe` | Multi-agences physiques (Mali Siège Bamako, Côte d'Ivoire Agence Abidjan) |
| `user_annexes` | `UserAnnexe` | Table de liaison N-N pour le scoping multi-annexes |
| `dossiers` | `Dossier` | Cœur du métier transit (statut, conteneurs, BL, étapes) |
| `conteneurs` | `Conteneur` | Statut au port, numéro, type, plomb |
| `etapes_dossier` | `EtapeDossier` | Workflow séquentiel de dédouanement et livraison |
| `tracking_public` | `TrackingPublic` | Suivi accessible par code public sans authentification |
| `clients` | `Client` | Répertoire clients, type particulier / entreprise |
| `factures` | `Facture` | Calculs automatiques HT, TVA (18%), TTC et soldes |
| `lignes_facture` | `LigneFacture` | Lignes détaillées de facturation |
| `devis` + `lignes_devis` | `Devis`, `LigneDevis` | Propos commercial et devisage |
| `cotations` + `lignes_cotation` | `Cotation`, `LigneCotation` | Cotations tarifaires préliminaires |
| `fournisseurs` | `Fournisseur` | Prestataires, transporteurs, manutentionnaires |
| `depenses` | `Depense` | Workflow d'approbation et décaissement en caisse |
| `caisses` | `Caisse` | Trésorerie multi-annexes |
| `transactions_caisse` | `TransactionCaisse` | Flux d'entrées (factures) et sorties (dépenses) |
| `documents` | `Document` | Stockage local sur disque + métadonnées en base |
| `settings` | `Setting` | Réglages dynamiques clés/valeurs du dashboard |
| `notifications` | `Notification` | Notifications in-app pour chaque utilisateur |
| `audit_logs` | `AuditLog` | Traçabilité de chaque action administrative |
| *(Nouveau)* | `RefreshToken` | Gestion sécurisée de rotation des tokens JWT (7 jours) |

---

## 2. Architecture de l'API NestJS (`/api`)

L'API suit une architecture modulaire stricte, respectant les principes d'injection de dépendances et de séparation des responsabilités :

```
api/
├── prisma/
│   ├── schema.prisma       # Schéma de base de données complet
│   └── seed.ts             # Script d'amorçage avec comptes, agences, clients, KPI
├── src/
│   ├── main.ts             # Bootstrap NestJS (CORS, ValidationPipe, préfixe /api)
│   ├── app.module.ts       # Module racine assemblant les 17 modules
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts # Module global Prisma
│   ├── auth/
│   │   ├── auth.service.ts  # Login bcrypt, JWT access (15m) + refresh (7j)
│   │   ├── auth.controller.ts
│   │   ├── strategies/      # JwtStrategy Passport
│   │   └── guards/          # JwtAuthGuard, PermissionsGuard, AnnexeGuard, RolesGuard
│   ├── shared/
│   │   └── decorators/      # @CurrentUser, @RequirePermission, @Roles
│   └── modules/             # 16 modules métiers indépendants
│       ├── annexes/
│       ├── clients/
│       ├── dossiers/
│       ├── factures/
│       ├── devis/
│       ├── cotations/
│       ├── fournisseurs/
│       ├── depenses/
│       ├── caisse/
│       ├── documents/       # Upload Multer local (uploads/)
│       ├── tracking/        # Route publique sans auth + gestion
│       ├── settings/        # Paramètres dynamiques du dashboard
│       ├── notifications/
│       ├── stats/           # Métriques KPIs
│       ├── audit-logs/
│       └── users/
```

---

## 3. Équivalences Supabase → NestJS

| Action Métier | Méthode Supabase (Ancien) | Endpoint NestJS (Nouveau) | Méthode API Client (`api-client.ts`) |
| :--- | :--- | :--- | :--- |
| **Connexion** | `supabase.auth.signInWithPassword({ email, password })` | `POST /api/auth/login` | `api.auth.login(email, password)` |
| **Rafraîchir session** | `supabase.auth.refreshSession()` | `POST /api/auth/refresh` | Automatique transparent ou `api.auth.refresh()` |
| **Déconnexion** | `supabase.auth.signOut()` | `POST /api/auth/logout` | `api.auth.logout()` |
| **Profil courant** | `supabase.auth.getUser()` + `select()` | `GET /api/auth/me` | `api.auth.me()` |
| **Lister dossiers** | `supabase.from('dossiers').select('*, conteneurs(*)')` | `GET /api/dossiers` *(avec filtres & pagination)* | `api.dossiers.getAll({ search, statut })` |
| **Créer dossier** | `supabase.from('dossiers').insert(...)` | `POST /api/dossiers` | `api.dossiers.create(data)` |
| **Changer statut** | `supabase.from('dossiers').update({ statut }).eq(...)` | `PATCH /api/dossiers/:id/statut` | `api.dossiers.updateStatut(id, statut)` |
| **Encaisser facture** | Trigger SQL ou inserts multiples | `POST /api/factures/:id/paiements` *(ACID transaction)* | `api.factures.enregistrerPaiement(id, data)` |
| **Approuver dépense**| `supabase.from('depenses').update(...)` | `PATCH /api/depenses/:id/approuver` | `api.depenses.approuver(id)` |
| **Payer dépense** | Inserts manuels caisse + depense | `POST /api/depenses/:id/payer` *(Vérifie solde & débite)*| `api.depenses.payer(id, data)` |
| **Upload document** | `supabase.storage.from('documents').upload(...)` | `POST /api/documents/upload` *(Stockage local disque)* | `api.documents.upload(file, dossierId)` |
| **Télécharger doc** | `supabase.storage.from('documents').getPublicUrl()`| `GET /api/documents/:filename/download` | Lien direct HTTP streaming |
| **Suivi public** | Requête anonyme Supabase | `GET /api/tracking/public/:code` *(Sans token)* | `api.tracking.getPublic(code)` |
| **Paramètres** | `supabase.from('settings').select('*')` | `GET /api/settings` & `PUT /api/settings` | `api.settings.getAll()` / `api.settings.setMany(...)` |
| **Dashboard KPIs** | Multiples requêtes frontend lourdes | `GET /api/stats/dashboard` *(Agrégation SQL unifiée)* | `api.stats.getDashboardKpis(annexeId)` |

---

## 4. Traduction des RLS Policies et Triggers Supabase

1. **Row Level Security (RLS) → Guards & Services NestJS** :
   - Les policies `has_permission()` sont désormais vérifiées par `@RequirePermission(...)` et le `PermissionsGuard`.
   - La policy `has_annexe_access()` est appliquée à la fois par `AnnexeGuard` et filtrée directement dans les requêtes Prisma `where: { annexeId: { in: user.annexeIds } }` (les admins ont un bypass automatique).

2. **Trigger `handle_new_user` → `UsersService.create()`** :
   - Au lieu d'un trigger PL/pgSQL opaque qui copiait `auth.users` vers `public.profiles`, la création d'utilisateur se fait explicitement via le service avec hashage bcrypt 12 rounds et affectation des annexes.

3. **Triggers Financiers → Transactions Atomiques Prisma (`prisma.$transaction`)** :
   - Les paiements de factures et décaissements de dépenses mettent à jour les soldes de caisse, créent la transaction de caisse et changent les statuts en une seule transaction ACID garantie.

---

## 5. Guide pas-à-pas : Lancement et Initialisation

### Étape 1 : Configurer les variables d'environnement
Le fichier `api/.env` est configuré pour MySQL local (XAMPP sur port 3306) :
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/transit_sltt"
PORT=3001
JWT_SECRET="transit_sltt_super_secret_jwt_key_default_dev_2025"
JWT_REFRESH_SECRET="transit_sltt_super_secret_refresh_key_dev_2025"
CORS_ORIGIN="http://localhost:3000"
UPLOAD_DIR="./uploads"
```

### Étape 2 : Appliquer le schéma à votre base MySQL
```bash
cd api
npx prisma db push
```

### Étape 3 : Exécuter le seed initial
```bash
cd api
npm run db:seed
```
*Comptes de démonstration créés lors du seed :*
- **Administrateur** : `amadou.traore@sltt.ml` / Mot de passe : `sltt2026`
- **Transitaire** : `ibrahim.keita@sltt.ml` / Mot de passe : `transit2026`
- **Comptable** : `fatoumata.diallo@sltt.ml` / Mot de passe : `compta2026`

### Étape 4 : Lancer l'API en développement
```bash
cd api
npm run start:dev
```
L'API est accessible sur : `http://localhost:3001/api`

### Étape 5 : Lancer l'API en production
```bash
cd api
npm run build
npm run start:prod
```

---

## 6. Points d'attention pour la Production

1. **Sécurité des clés secrètes** : Remplacer `JWT_SECRET` et `JWT_REFRESH_SECRET` par des chaînes cryptographiquement aléatoires (au moins 64 caractères) via les variables d'environnement de production.
2. **Stockage des uploads** :
   - En environnement local, le stockage s'effectue dans `api/uploads/`.
   - En cas de déploiement multi-instances / conteneurisé (Docker), montez un volume persistant sur le dossier `./uploads` ou configurez un adaptateur S3 / MinIO.
3. **Sauvegardes de la base de données** : Mettre en place des dumps automatiques `pg_dump` réguliers de la base PostgreSQL.
