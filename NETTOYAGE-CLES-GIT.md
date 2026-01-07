# 🔒 Nettoyage des clés API de l'historique Git

## ✅ Actions effectuées

### 1. Remplacement des clés par des placeholders

Toutes les clés API ont été remplacées par des placeholders dans les fichiers suivants :

- ✅ `index.html` - Clé Supabase remplacée
- ✅ `supabase-service.js` - Clé Supabase remplacée
- ✅ `backend/services/supabaseService.js` - Clé Supabase remplacée
- ✅ `backend/create-env.sh` - Clé Brevo remplacée
- ✅ Tous les fichiers de documentation (.md) - Clés remplacées

**Placeholders utilisés :**
- `VOTRE_CLE_SUPABASE_ANON_KEY_ICI` (pour la clé Supabase)
- `xkeysib-VOTRE_CLE_BREVO_ICI` (pour la clé Brevo)

### 2. Réécriture de l'historique Git

L'historique Git a été réécrit pour supprimer toutes les occurrences des clés dans les commits passés.

**Commandes exécutées :**
```bash
# Réécriture de l'historique pour la clé Supabase
git filter-branch --force --tree-filter 'find . -type f -exec sed -i "" "s/VOTRE_CLE_SUPABASE_ANON_KEY_ICI/VOTRE_CLE_SUPABASE_ANON_KEY_ICI/g" {} \;' --prune-empty --tag-name-filter cat -- --all

# Réécriture de l'historique pour la clé Brevo
git filter-branch --force --tree-filter 'find . -type f -exec sed -i "" "s/xkeysib-VOTRE_CLE_BREVO_ICI/xkeysib-VOTRE_CLE_BREVO_ICI/g" {} \;' --prune-empty --tag-name-filter cat -- --all

# Nettoyage des références
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. Vérification

✅ Aucune occurrence des clés originales n'a été trouvée dans l'historique Git.

## ⚠️ IMPORTANT : Forcer le push

Pour appliquer ces changements au repository distant, vous devez **forcer le push** :

```bash
# ⚠️ ATTENTION : Cette commande réécrit l'historique sur le serveur distant
# Assurez-vous que personne d'autre ne travaille sur ce repository
git push --force --all
git push --force --tags
```

**⚠️ AVERTISSEMENT :**
- Cette opération réécrit l'historique Git
- Tous les collaborateurs devront réinitialiser leur copie locale
- Les forks et clones existants contiendront toujours les anciennes clés
- Si le repository est public, les clés peuvent toujours être visibles dans les forks/clones existants

## 📝 Prochaines étapes

1. **Régénérer les clés compromises** dans Supabase et Brevo
2. **Configurer les nouvelles clés** dans votre fichier `.env` local
3. **Ne jamais commiter** les fichiers `.env` ou les clés en dur
4. **Utiliser des variables d'environnement** pour toutes les clés sensibles

## 🔐 Configuration recommandée

### Fichier `.env` (à créer, ne pas commiter)
```env
# Supabase
SUPABASE_URL=https://chxhkoeqwssrczfviar.supabase.co
SUPABASE_ANON_KEY=votre_nouvelle_cle_anon_ici
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_ici

# Brevo
BREVO_API_KEY=votre_nouvelle_cle_brevo_ici
```

### Fichier `.gitignore`
Assurez-vous que `.gitignore` contient :
```
.env
.env.local
.env.*.local
*.key
*.pem
```





