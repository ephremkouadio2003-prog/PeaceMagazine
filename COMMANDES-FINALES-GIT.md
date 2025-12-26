# 🔒 Commandes finales pour nettoyer l'historique Git

## ✅ Étape 1 : Vérifier que toutes les clés sont remplacées

```bash
cd "/Users/ephremkouadio/Peace magazine"

# Vérifier qu'il ne reste plus de clés dans les fichiers actuels
grep -r "sb_publishable_POzieU2d5V9Tn86WIJLLtQ_s96xzgzV" . --exclude-dir=.git --exclude="*.sh" --exclude="*.md"
grep -r "xkeysib-VOTRE_CLE_BREVO_ICI" . --exclude-dir=.git --exclude="*.sh" --exclude="*.md"
```

Ces commandes ne doivent retourner aucun résultat (sauf dans les scripts de nettoyage et la documentation).

## ⚠️ Étape 2 : Nettoyer l'historique Git

### Option A : Utiliser le script automatique (RECOMMANDÉ)

```bash
cd "/Users/ephremkouadio/Peace magazine"
./nettoyer-cles-git.sh
```

### Option B : Utiliser git filter-branch manuellement

```bash
cd "/Users/ephremkouadio/Peace magazine"

# Réécrire l'historique pour la clé Supabase
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --tree-filter 'find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.sh" \) -print0 | xargs -0 sed -i "" "s|sb_publishable_POzieU2d5V9Tn86WIJLLtQ_s96xzgzV|VOTRE_CLE_SUPABASE_ANON_KEY_ICI|g" 2>/dev/null || true' \
    --prune-empty --tag-name-filter cat -- --all

# Réécrire l'historique pour la clé Brevo
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --tree-filter 'find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.sh" \) -print0 | xargs -0 sed -i "" "s|xkeysib-VOTRE_CLE_BREVO_ICI|xkeysib-VOTRE_CLE_BREVO_ICI|g" 2>/dev/null || true' \
    --prune-empty --tag-name-filter cat -- --all

# Nettoyer les références
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## ✅ Étape 3 : Vérifier que les clés ont été supprimées de l'historique

```bash
# Vérifier la clé Supabase
git log --all -S "sb_publishable_POzieU2d5V9Tn86WIJLLtQ_s96xzgzV" --oneline
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

## ⚠️ AVERTISSEMENTS

- Cette opération réécrit l'historique Git sur GitHub
- Tous les collaborateurs devront réinitialiser leur copie locale
- Les forks et clones existants contiendront toujours les anciennes clés
- Si le repository est public, les clés peuvent toujours être visibles dans les forks/clones existants

## 🔐 Actions de sécurité recommandées

1. **Régénérer les clés compromises** dans Supabase et Brevo
2. **Configurer les nouvelles clés** dans votre fichier `.env` local
3. **Vérifier que `.gitignore` contient `.env`** (✅ déjà fait)
4. **Ne jamais commiter** les fichiers `.env` ou les clés en dur
