#!/bin/bash

# Script pour nettoyer les clés API de l'historique Git
# ⚠️ ATTENTION : Ce script réécrit l'historique Git

set -e

echo "🔒 Nettoyage des clés API de l'historique Git"
echo "=============================================="
echo ""

# Vérifier que nous sommes dans un repository Git
if [ ! -d .git ]; then
    echo "❌ Erreur : Ce répertoire n'est pas un repository Git"
    exit 1
fi

# Clés à remplacer
SUPABASE_KEY_OLD="VOTRE_CLE_SUPABASE_ANON_KEY_ICI"
SUPABASE_KEY_NEW="VOTRE_CLE_SUPABASE_ANON_KEY_ICI"

BREVO_KEY_OLD="xkeysib-VOTRE_CLE_BREVO_ICI"
BREVO_KEY_NEW="xkeysib-VOTRE_CLE_BREVO_ICI"

echo "📋 Clés à remplacer :"
echo "  - Supabase: $SUPABASE_KEY_OLD"
echo "  - Brevo: $BREVO_KEY_OLD"
echo ""

# Demander confirmation
read -p "⚠️  Cette opération va réécrire l'historique Git. Continuer ? (oui/non) " -r
echo
if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "❌ Opération annulée"
    exit 1
fi

echo "🔄 Réécriture de l'historique Git..."
echo ""

# Fonction pour remplacer les clés dans un fichier
replace_keys() {
    local file="$1"
    if [ -f "$file" ] && [ -r "$file" ] && [ -w "$file" ]; then
        # Remplacer la clé Supabase
        sed -i '' "s|$SUPABASE_KEY_OLD|$SUPABASE_KEY_NEW|g" "$file" 2>/dev/null || true
        # Remplacer la clé Brevo
        sed -i '' "s|$BREVO_KEY_OLD|$BREVO_KEY_NEW|g" "$file" 2>/dev/null || true
    fi
}

# Exporter la fonction pour git filter-branch
export -f replace_keys
export SUPABASE_KEY_OLD SUPABASE_KEY_NEW BREVO_KEY_OLD BREVO_KEY_NEW

# Utiliser git filter-branch avec une commande plus simple
echo "🔄 Réécriture de l'historique pour la clé Supabase..."
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --tree-filter 'find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.sh" \) -print0 | xargs -0 sed -i "" "s|VOTRE_CLE_SUPABASE_ANON_KEY_ICI|VOTRE_CLE_SUPABASE_ANON_KEY_ICI|g" 2>/dev/null || true' \
    --prune-empty \
    --tag-name-filter cat \
    -- --all

echo "🔄 Réécriture de l'historique pour la clé Brevo..."
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch --force \
    --tree-filter 'find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.md" -o -name "*.sh" \) -print0 | xargs -0 sed -i "" "s|xkeysib-VOTRE_CLE_BREVO_ICI|xkeysib-VOTRE_CLE_BREVO_ICI|g" 2>/dev/null || true' \
    --prune-empty \
    --tag-name-filter cat \
    -- --all

echo ""
echo "🧹 Nettoyage des références..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "📝 Vérification :"
echo ""

# Vérifier que les clés ne sont plus dans l'historique
if git log --all -S "$SUPABASE_KEY_OLD" --oneline | grep -q .; then
    echo "⚠️  ATTENTION : La clé Supabase est toujours présente dans l'historique"
    git log --all -S "$SUPABASE_KEY_OLD" --oneline
else
    echo "✅ Clé Supabase supprimée de l'historique"
fi

if git log --all -S "$BREVO_KEY_OLD" --oneline | grep -q .; then
    echo "⚠️  ATTENTION : La clé Brevo est toujours présente dans l'historique"
    git log --all -S "$BREVO_KEY_OLD" --oneline
else
    echo "✅ Clé Brevo supprimée de l'historique"
fi

echo ""
echo "🚀 Pour appliquer ces changements au repository distant :"
echo "   git push --force --all origin"
echo "   git push --force --tags origin"
echo ""
echo "⚠️  ATTENTION : Le force push réécrira l'historique sur GitHub"
echo "   Tous les collaborateurs devront réinitialiser leur copie locale"
