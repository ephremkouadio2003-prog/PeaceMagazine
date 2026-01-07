#!/bin/bash

# Installation de Node.js via nvm (sans besoin de mot de passe sudo)
# Cette méthode fonctionne dans le répertoire utilisateur

set -e

echo "🚀 Installation de Node.js via nvm (sans sudo)"
echo "=============================================="
echo ""

# Vérifier si nvm est déjà installé
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "✅ nvm est déjà installé"
    source "$HOME/.nvm/nvm.sh"
else
    echo "📦 Installation de nvm..."
    export NVM_DIR="$HOME/.nvm"
    
    # Télécharger et installer nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Charger nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    echo "✅ nvm installé"
fi

# Ajouter nvm au .zshrc si ce n'est pas déjà fait
if ! grep -q "NVM_DIR" ~/.zshrc 2>/dev/null; then
    echo "" >> ~/.zshrc
    echo "# nvm configuration" >> ~/.zshrc
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc
    echo "✅ Configuration ajoutée à ~/.zshrc"
fi

# Charger nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Vérifier si Node.js est déjà installé via nvm
if command -v node &> /dev/null && [ -n "$NVM_DIR" ]; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js est déjà installé : $NODE_VERSION"
    
    # Vérifier la version
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Version de Node.js trop ancienne (< 18). Installation de la version LTS..."
        nvm install --lts
        nvm use --lts
        nvm alias default node
    fi
else
    echo "📦 Installation de Node.js LTS..."
    nvm install --lts
    nvm use --lts
    nvm alias default node
    echo "✅ Node.js installé"
fi

# Vérifier l'installation
echo ""
echo "🔍 Vérification de l'installation..."
echo "=============================================="

# Recharger nvm pour être sûr
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js : $NODE_VERSION"
else
    echo "❌ Erreur : Node.js n'est pas accessible"
    echo "   Essayez de fermer et rouvrir votre terminal, puis exécutez :"
    echo "   source ~/.zshrc"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm : $NPM_VERSION"
else
    echo "❌ Erreur : npm n'est pas accessible"
    exit 1
fi

echo ""
echo "🎉 Installation terminée avec succès !"
echo ""
echo "⚠️  IMPORTANT : Si node/npm ne fonctionnent pas dans un nouveau terminal,"
echo "   exécutez cette commande pour recharger la configuration :"
echo "   source ~/.zshrc"
echo ""
echo "Prochaines étapes :"
echo "1. Pour installer les dépendances : cd backend && npm install"
echo "2. Pour démarrer le backend : npm run dev"
echo ""












