#!/bin/bash

# Script pour créer la base de données MySQL peace_magazine

echo "🗄️  Création de la base de données MySQL"
echo "========================================"
echo ""

# Demander les informations de connexion
read -p "Nom d'utilisateur MySQL (par défaut: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Mot de passe MySQL (laissez vide si aucun): " DB_PASSWORD
echo ""

# Construire la commande MySQL
if [ -z "$DB_PASSWORD" ]; then
    MYSQL_CMD="mysql -u $DB_USER"
else
    MYSQL_CMD="mysql -u $DB_USER -p$DB_PASSWORD"
fi

echo ""
echo "🔄 Création de la base de données..."

# Créer la base de données
$MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS peace_magazine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES LIKE 'peace_magazine';
SELECT '✅ Base de données peace_magazine créée avec succès !' AS message;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Base de données créée avec succès !"
    echo ""
    echo "📝 Prochaines étapes :"
    echo "1. Vérifiez que votre fichier .env contient le mot de passe MySQL"
    echo "2. Redémarrez le serveur : npm start"
else
    echo ""
    echo "❌ Erreur lors de la création de la base de données"
    echo ""
    echo "💡 Essayez de créer la base de données manuellement :"
    echo "   mysql -u root -p"
    echo "   CREATE DATABASE peace_magazine;"
    echo "   EXIT;"
fi








