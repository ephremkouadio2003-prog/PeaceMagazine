# 🚀 Guide d'hébergement sur VPS

## 🎯 Pourquoi un VPS ?

Un VPS (Serveur Privé Virtuel) est **obligatoire** pour votre site car :
- ✅ **Disque persistant** : Les photos ne seront pas perdues
- ✅ **Contrôle total** : Vous gérez votre serveur
- ✅ **Performance stable** : Pas de limitations serverless
- ✅ **Coût raisonnable** : $4-10/mois

## 📋 Étapes de déploiement

### 1. Choisir un fournisseur VPS

**Recommandations :**

#### DigitalOcean (Recommandé)
- 💰 **$6/mois** : 1GB RAM, 1 vCPU, 25GB SSD
- 💰 **$12/mois** : 2GB RAM, 1 vCPU, 50GB SSD (recommandé)
- 🌍 Serveurs dans le monde entier
- 🔗 https://www.digitalocean.com/

#### OVH
- 💰 **€3.50/mois** : 2GB RAM, 1 vCPU, 20GB SSD
- 🇫🇷 Serveurs en France
- 🔗 https://www.ovh.com/

### 2. Créer le VPS

1. Créer un compte chez le fournisseur
2. Créer un nouveau VPS/Droplet
3. Choisir Ubuntu 22.04 LTS (recommandé)
4. Choisir la région la plus proche de vos utilisateurs
5. Créer le VPS

### 3. Configuration initiale

#### Se connecter au VPS

```bash
ssh root@VOTRE_IP_VPS
```

#### Mettre à jour le système

```bash
apt update && apt upgrade -y
```

#### Installer Node.js

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérifier l'installation
node --version
npm --version
```

#### Installer PM2 (gestionnaire de processus)

```bash
npm install -g pm2
```

### 4. Déployer votre application

#### Cloner le projet

```bash
# Installer Git
apt install -y git

# Cloner votre projet (remplacez par votre repo)
cd /opt
git clone VOTRE_REPO_URL peace-magazine
cd peace-magazine
```

#### Installer les dépendances

```bash
# Backend
cd backend
npm install

# Créer le fichier .env
cp config.env.example .env
nano .env  # Éditer avec vos vraies valeurs
```

#### Configurer le serveur

```bash
# Créer le dossier uploads
mkdir -p uploads
chmod 755 uploads

# Créer le dossier quarantine
mkdir -p uploads/quarantine
chmod 755 uploads/quarantine
```

### 5. Démarrer le serveur avec PM2

```bash
cd /opt/peace-magazine/backend

# Démarrer le serveur
pm2 start server.dev.js --name "peace-magazine-backend"

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# Suivre les instructions affichées
```

### 6. Configurer Nginx (Reverse Proxy)

#### Installer Nginx

```bash
apt install -y nginx
```

#### Configurer Nginx

```bash
nano /etc/nginx/sites-available/peace-magazine
```

Contenu :

```nginx
server {
    listen 80;
    server_name VOTRE_DOMAINE.com;

    # Frontend (si vous servez aussi le frontend depuis le VPS)
    location / {
        root /opt/peace-magazine;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers uploadés
    location /api/files {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer la configuration :

```bash
ln -s /etc/nginx/sites-available/peace-magazine /etc/nginx/sites-enabled/
nginx -t  # Tester la configuration
systemctl restart nginx
```

### 7. Configurer SSL (HTTPS) avec Let's Encrypt

```bash
# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
certbot --nginx -d VOTRE_DOMAINE.com

# Renouvellement automatique
certbot renew --dry-run
```

### 8. Configurer le firewall

```bash
# Installer UFW
apt install -y ufw

# Autoriser SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall
ufw enable
```

### 9. Monitoring et logs

```bash
# Voir les logs du serveur
pm2 logs peace-magazine-backend

# Voir le statut
pm2 status

# Redémarrer le serveur
pm2 restart peace-magazine-backend
```

## 🔄 Mises à jour

Pour mettre à jour votre application :

```bash
cd /opt/peace-magazine
git pull
cd backend
npm install
pm2 restart peace-magazine-backend
```

## 💾 Sauvegardes

### Sauvegarder les fichiers uploadés

```bash
# Créer un script de sauvegarde
nano /opt/backup-uploads.sh
```

Contenu :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /root/backups/uploads_$DATE.tar.gz /opt/peace-magazine/backend/uploads
# Supprimer les sauvegardes de plus de 7 jours
find /root/backups -name "uploads_*.tar.gz" -mtime +7 -delete
```

Rendre exécutable :

```bash
chmod +x /opt/backup-uploads.sh
```

Ajouter au cron (sauvegarde quotidienne à 2h du matin) :

```bash
crontab -e
# Ajouter cette ligne :
0 2 * * * /opt/backup-uploads.sh
```

## 📊 Monitoring de l'espace disque

```bash
# Vérifier l'espace disque
df -h

# Vérifier la taille du dossier uploads
du -sh /opt/peace-magazine/backend/uploads
```

## 🆘 Commandes utiles

```bash
# Redémarrer le serveur backend
pm2 restart peace-magazine-backend

# Voir les logs en temps réel
pm2 logs peace-magazine-backend

# Voir l'utilisation des ressources
pm2 monit

# Redémarrer Nginx
systemctl restart nginx

# Voir les logs Nginx
tail -f /var/log/nginx/error.log
```

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com






