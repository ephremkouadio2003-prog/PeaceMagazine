-- Script SQL pour créer la base de données peace_magazine
-- Usage: mysql -u root -p < creer-database.sql

CREATE DATABASE IF NOT EXISTS peace_magazine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Afficher les bases de données pour vérification
SHOW DATABASES;

-- Message de confirmation
SELECT 'Base de données peace_magazine créée avec succès !' AS message;



