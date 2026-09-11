# Transit SLTT

Application de gestion logistique, transit et transport avec persistance intégrale MySQL (XAMPP/MySQL) et architecture fullstack moderne :
- **Frontend** : Next.js 15 (React 19), Tailwind CSS, Zustand
- **Backend** : NestJS, Prisma ORM, MySQL, JWT Auth

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine :
1. **Node.js** (version 18 ou supérieure, idéalement v20+) : [https://nodejs.org](https://nodejs.org)
2. **Git** : [https://git-scm.com](https://git-scm.com)
3. **Un serveur MySQL** :
   - Sur Windows : **XAMPP** (démarrer le module MySQL sur le port 3306), **Laragon** ou **WampServer**.
   - Sur macOS / Linux : MySQL Server ou MariaDB.

---

## 🚀 Guide d'Installation Rapide (Pas à Pas)

### 1. Cloner le dépôt

Ouvrez votre terminal et exécutez :
```bash
git clone https://github.com/amasbarry223/Transit_SLTT.git
cd Transit_SLTT
```

---

### 2. Créer la base de données MySQL

1. Lancez **XAMPP** et cliquez sur **Start** en face de **MySQL** (et Apache si vous utilisez phpMyAdmin).
2. Ouvrez **phpMyAdmin** (`http://localhost/phpmyadmin`) ou un client SQL (DBeaver, MySQL Workbench, ligne de commande).
3. Créez une nouvelle base de données nommée :
   ```sql
   CREATE DATABASE transit_sltt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### 3. Configurer et lancer le Backend (NestJS)

Ouvrez un premier terminal à la racine du projet :

```bash
# Se placer dans le dossier de l'API
cd api

# Installer les dépendances
npm install

# Créer le fichier d'environnement .env (ou copier depuis .env.example)
# Vérifiez que DATABASE_URL correspond à vos identifiants MySQL (par défaut sous XAMPP : user 'root' sans mot de passe)
cp .env.example .env

# Générer le client Prisma et déployer le schéma dans MySQL
npx prisma db push

# (Optionnel) Peupler la base avec les données de démarrage (Admin, annexes, clients de test)
npm run db:seed

# Lancer le serveur NestJS en mode développement
npm run start:dev
```
> Le serveur backend démarrera sur : `http://localhost:3001/api`

---

### 4. Configurer et lancer le Frontend (Next.js)

Ouvrez un **deuxième terminal** à la racine du projet :

```bash
# Installer les dépendances du frontend
npm install

# Créer le fichier d'environnement local
cp .env.example .env.local

# Lancer le serveur frontend
npm run dev
```
> L'application web démarrera sur : `http://localhost:3000`

---

## 🔑 Identifiants de Connexion par Défaut (après le Seed)

Les deux implantations physiques (annexes) gérées sont :
* **Mali** : Siège Central (Bamako)
* **Côte d'Ivoire** : Agence Portuaire / Transit (Abidjan)

Si vous avez exécuté `npm run db:seed` dans le dossier `api/` :

| Rôle | Email | Mot de passe | Annexe rattachée |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `amadou.traore@sltt.ml` | `sltt2026` | Mali & Côte d'Ivoire (Global) |
| **Agent Transit Mali** | `ibrahim.keita@sltt.ml` | `transit2026` | Mali (Bamako) |
| **Agent Transit CI** | `moussa.camara@sltt.ci` | `transit2026` | Côte d'Ivoire (Abidjan) |
| **Comptable** | `fatoumata.diallo@sltt.ml` | `compta2026` | Mali (Bamako) |

---

## 🛠️ Structure du Projet

```text
Transit_SLTT/
├── api/                   # Backend NestJS (Prisma ORM, MySQL, Authentification JWT)
│   ├── prisma/            # Schéma Prisma et scripts de seed
│   ├── src/               # Modules métier (dossiers, factures, transporteurs, stock, devis, etc.)
│   └── uploads/           # Fichiers et pièces jointes stockés
├── src/                   # Frontend Next.js
│   ├── app/               # Routes et pages Next.js
│   ├── features/          # Composants métier par onglet (factures, dossiers, stock, etc.)
│   └── lib/               # Client API, store Zustand, utilitaires d'impression
├── .env.example           # Variables d'environnement frontend
└── README.md
```
