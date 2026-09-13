# Transit SLTT

Application de gestion logistique, transit et transport avec persistance intégrale MySQL et architecture fullstack moderne :
- **Frontend** : Next.js 15 (React 19), Tailwind CSS, Zustand
- **Backend** : NestJS 11, Prisma ORM, MySQL, JWT Auth
- **Déploiement** : Prêt pour Hostinger (PM2, Nginx, Node.js 20+)

---

## 🛠️ Architecture du Monorepo

```text
Transit_SLTT/
├── backend/               # API NestJS 11 (Prisma ORM, MySQL, Authentification JWT)
│   ├── prisma/            # Schéma Prisma et scripts de seed
│   ├── src/               # Modules métier (dossiers, factures, transporteurs, stock, devis, etc.)
│   └── uploads/           # Fichiers et pièces jointes stockés
├── frontend/              # Application Web Next.js 15 (React 19)
│   ├── src/               # Routes Next.js, features métiers, store Zustand
│   └── public/            # Assets statiques, logos, icônes PWA
├── ecosystem.config.js    # Configuration PM2 multi-processus pour Hostinger
├── package.json           # Orchestrateur monorepo (npm workspaces)
└── README.md
```

---

## 📋 Prérequis

1. **Node.js** (version 20+ recommandée) : [https://nodejs.org](https://nodejs.org)
2. **Git** : [https://git-scm.com](https://git-scm.com)
3. **Un serveur MySQL** (Local : XAMPP / Laragon ; En ligne : MySQL Hostinger ou Docker)

---

## 🚀 Développement Local (Pas à Pas)

### 1. Cloner le dépôt et installer les dépendances
```bash
git clone https://github.com/amasbarry223/Transit_SLTT.git
cd Transit_SLTT

# Installer les dépendances du backend
cd backend
npm install
cp .env.example .env
# Adapter DATABASE_URL si besoin (par défaut XAMPP : mysql://root:@localhost:3306/transit_sltt)
npx prisma db push
npm run db:seed

# Installer les dépendances du frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### 2. Démarrer les serveurs
Depuis la racine du projet (`Transit_SLTT`) :

```bash
# Lancer le backend NestJS (port 3001)
npm run dev:backend

# Lancer le frontend Next.js (port 3000) dans un autre terminal
npm run dev:frontend
```

---

## ☁️ Guide de Déploiement sur Hostinger (VPS / Cloud)

Ce projet est optimisé pour être déployé sur un **VPS Hostinger** (Ubuntu 22.04 / 24.04) avec **PM2** et **Nginx**.

### Étape 1 : Préparation du serveur VPS Hostinger
Connectez-vous à votre VPS en SSH :
```bash
ssh root@IP_DE_VOTRE_VPS
```

Installez Node.js 20, Git, PM2 et Nginx :
```bash
# Mettre à jour les paquets
apt update && apt upgrade -y

# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git mysql-server

# Installer PM2 globalement
npm install -g pm2
```

---

### Étape 2 : Cloner le projet sur le serveur
```bash
cd /var/www
git clone https://github.com/amasbarry223/Transit_SLTT.git
cd Transit_SLTT
```

---

### Étape 3 : Configurer et Compiler le Backend
```bash
cd /var/www/Transit_SLTT/backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement de production
cp .env.example .env
nano .env
```
*Renseignez vos identifiants réels :*
```env
DATABASE_URL="mysql://utilisateur_mysql:mot_de_passe@localhost:3306/transit_sltt"
PORT=3001
JWT_SECRET="CLE_SECRETE_ALEATOIRE_LONGUE_POUR_LA_PROD"
JWT_REFRESH_SECRET="CLE_SECRETE_REFRESH_ALEATOIRE_LONGUE_POUR_LA_PROD"
CORS_ORIGIN="https://votredomaine.com"
UPLOAD_DIR="./uploads"
```

Appliquer la base de données et compiler :
```bash
npx prisma db push
npm run db:seed
npm run build
```

---

### Étape 4 : Configurer et Compiler le Frontend
```bash
cd /var/www/Transit_SLTT/frontend

# Installer les dépendances
npm install

# Configurer l'URL de l'API
nano .env.local
```
*Ajoutez :*
```env
NEXT_PUBLIC_API_URL="https://votredomaine.com/api"
```

Compiler pour la production :
```bash
npm run build
```

---

### Étape 5 : Lancer l'application avec PM2
Revenez à la racine du projet :
```bash
cd /var/www/Transit_SLTT

# Démarrer les deux applications via le fichier ecosystem
pm2 start ecosystem.config.js

# Enregistrer pour redémarrer automatiquement en cas de reboot du VPS
pm2 save
pm2 startup
```

Vérifiez que les deux applications tournent :
```bash
pm2 status
```

---

### Étape 6 : Configurer Nginx comme Reverse Proxy
Éditez la configuration Nginx de votre site :
```bash
nano /etc/nginx/sites-available/transit-sltt
```

Collez la configuration suivante :
```nginx
server {
    server_name votredomaine.com www.votredomaine.com;

    # Frontend Next.js (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend NestJS API (port 3001)
    location /api {
        proxy_pass http://127.0.0.1:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

Activez le site et rechargez Nginx :
```bash
ln -s /etc/nginx/sites-available/transit-sltt /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Activez le certificat HTTPS gratuit avec Certbot :
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

---

## 🔑 Identifiants par Défaut (après le Seed)

| Rôle | Email | Mot de passe | Annexe |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `amadou.traore@sltt.ml` | `sltt2026` | Mali & Côte d'Ivoire (Global) |
| **Agent Transit Mali** | `ibrahim.keita@sltt.ml` | `transit2026` | Mali (Bamako) |
| **Agent Transit CI** | `moussa.camara@sltt.ci` | `transit2026` | Côte d'Ivoire (Abidjan) |
| **Comptable** | `fatoumata.diallo@sltt.ml` | `compta2026` | Mali (Bamako) |
