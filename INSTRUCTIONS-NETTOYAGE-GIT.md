# 🔒 Instructions pour nettoyer les clés API de l'historique Git

## ✅ Étape 1 : Remplacement des clés dans les fichiers actuels

**FAIT** : Toutes les clés ont été remplacées par des placeholders dans les fichiers suivants :
- `index.html`
- `supabase-service.js`
- `backend/services/supabaseService.js`
- Tous les fichiers de documentation (.md)
- `backend/create-env.sh`

## ⚠️ Étape 2 : Nettoyer l'historique Git

L'historique Git contient encore les clés dans les commits passés. Pour les supprimer complètement :

### Option A : Utiliser le script automatique (RECOMMANDÉ)

```bash
cd "/Users/ephremkouadio/Peace magazine"
./nettoyer-cles-git.sh
```

Le script va :
1. Remplacer les clés dans tous les commits de l'historique
2. Nettoyer les références Git
3. Vérifier que les clés ont bien été supprimées

### Option B : Utiliser git filter-branch manuellement

```bash
cd "/Users/ephremkouadio/Peace magazine"

# Réécrire l'historique pour la clé Supabase
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --tree-filter 'find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.sh" \) -exec sed -i "" "s|VOTRE_CLE_SUPABASE_ANON_KEY_ICI|VOTRE_CLE_SUPABASE_ANON_KEY_ICI|g" {} \;' \
    --prune-empty --tag-name-filter cat -- --all

# Réécrire l'historique pour la clé Brevo
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --tree-filter 'find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.sh" \) -exec sed -i "" "s|xkeysib-VOTRE_CLE_BREVO_ICI|xkeysib-VOTRE_CLE_BREVO_ICI|g" {} \;' \
    --prune-empty --tag-name-filter cat -- --all

# Nettoyer les références
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## ✅ Étape 3 : Vérifier que les clés ont été supprimées

```bash
# Vérifier la clé Supabase
git log --all -S "VOTRE_CLE_SUPABASE_ANON_KEY_ICI" --oneline
# Ne doit retourner aucun résultat

# Vérifier la clé Brevo
git log --all -S "xkeysib-VOTRE_CLE_BREVO_ICI" --oneline
# Ne doit retourner aucun résultat
```

## 🚀 Étape 4 : Forcer le push vers GitHub

**⚠️ ATTENTION : Cette opération réécrit l'historique sur GitHub**

```bash
# Forcer le push de toutes les branches
git push --force --all origin

# Forcer le push de tous les tags
git push --force --tags origin
```

## ⚠️ AVERTISSEMENTS IMPORTANTS

1. **Cette opération réécrit l'historique Git sur GitHub**
2. **Tous les collaborateurs devront réinitialiser leur copie locale** :
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```
3. **Les forks et clones existants contiendront toujours les anciennes clés**
4. **Si le repository est public, les clés peuvent toujours être visibles dans les forks/clones existants**

## 🔐 Actions de sécurité recommandées

1. **Régénérer les clés compromises** dans Supabase et Brevo
2. **Configurer les nouvelles clés** dans votre fichier `.env` local
3. **Vérifier que `.gitignore` contient `.env`** (✅ déjà fait)
4. **Ne jamais commiter** les fichiers `.env` ou les clés en dur

## 📝 Fichiers modifiés

Les clés ont été remplacées dans :
- ✅ `index.html` - Configuration Supabase
- ✅ `supabase-service.js` - Service Supabase frontend
- ✅ `backend/services/supabaseService.js` - Service Supabase backend
- ✅ `backend/create-env.sh` - Script de création .env
- ✅ Tous les fichiers de documentation (.md)
