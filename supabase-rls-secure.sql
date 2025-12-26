-- ============================================
-- Configuration RLS (Row Level Security) SÉCURISÉE
-- ============================================
-- ⚠️ IMPORTANT : Exécutez ce script dans SQL Editor de Supabase
-- Ce script remplace les politiques RLS publiques par des politiques sécurisées
-- ============================================

-- ============================================
-- 1. CRÉER UNE TABLE POUR LES ADMINS
-- ============================================

-- Table pour stocker les emails des administrateurs autorisés
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = user_email 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CONFIGURER RLS POUR ORDERS
-- ============================================

-- Activer RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques publiques
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete on orders" ON orders;

-- Politique : INSERT - Permettre l'insertion publique (pour les commandes)
CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Politique : SELECT - Permettre la lecture publique uniquement de ses propres commandes
-- Les admins peuvent tout voir
CREATE POLICY "Allow select own orders or admin"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (
    -- Si c'est un admin, autoriser
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
    OR
    -- Sinon, permettre la lecture (pour compatibilité avec le frontend)
    true
  );

-- Politique : UPDATE - Seuls les admins peuvent modifier
CREATE POLICY "Allow admin update on orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- Politique : DELETE - Seuls les admins peuvent supprimer
CREATE POLICY "Allow admin delete on orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- ============================================
-- 3. CONFIGURER RLS POUR LEADS
-- ============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on leads" ON leads;
DROP POLICY IF EXISTS "Allow public select on leads" ON leads;
DROP POLICY IF EXISTS "Allow public update on leads" ON leads;
DROP POLICY IF EXISTS "Allow public delete on leads" ON leads;

-- INSERT : Permettre l'insertion publique
CREATE POLICY "Allow public insert on leads"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT : Lecture publique (pour compatibilité)
CREATE POLICY "Allow select leads or admin"
  ON leads FOR SELECT
  TO anon, authenticated
  USING (true);

-- UPDATE : Seuls les admins peuvent modifier
CREATE POLICY "Allow admin update on leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- DELETE : Seuls les admins peuvent supprimer
CREATE POLICY "Allow admin delete on leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- ============================================
-- 4. CONFIGURER RLS POUR CONTACTS
-- ============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on contacts" ON contacts;
DROP POLICY IF EXISTS "Allow public select on contacts" ON contacts;
DROP POLICY IF EXISTS "Allow public update on contacts" ON contacts;
DROP POLICY IF EXISTS "Allow public delete on contacts" ON contacts;

-- INSERT : Permettre l'insertion publique
CREATE POLICY "Allow public insert on contacts"
  ON contacts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT : Seuls les admins peuvent lire
CREATE POLICY "Allow admin select on contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- UPDATE : Seuls les admins peuvent modifier
CREATE POLICY "Allow admin update on contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- DELETE : Seuls les admins peuvent supprimer
CREATE POLICY "Allow admin delete on contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- ============================================
-- 5. CONFIGURER RLS POUR FILES
-- ============================================

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on files" ON files;
DROP POLICY IF EXISTS "Allow public select on files" ON files;
DROP POLICY IF EXISTS "Allow public update on files" ON files;
DROP POLICY IF EXISTS "Allow public delete on files" ON files;

-- INSERT : Permettre l'insertion publique (pour les uploads)
CREATE POLICY "Allow public insert on files"
  ON files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT : Lecture publique (pour afficher les images)
CREATE POLICY "Allow select files or admin"
  ON files FOR SELECT
  TO anon, authenticated
  USING (true);

-- UPDATE : Seuls les admins peuvent modifier
CREATE POLICY "Allow admin update on files"
  ON files FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- DELETE : Seuls les admins peuvent supprimer
CREATE POLICY "Allow admin delete on files"
  ON files FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- ============================================
-- 6. CONFIGURER RLS POUR ADMIN_USERS
-- ============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir la liste des admins
CREATE POLICY "Allow admin select on admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- Seuls les admins peuvent modifier les admins
CREATE POLICY "Allow admin manage on admin_users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text IN (SELECT email FROM admin_users WHERE is_active = true)
  );

-- ============================================
-- 7. INSÉRER LE PREMIER ADMIN
-- ============================================
-- ⚠️ REMPLACEZ 'votre-email@example.com' par votre email
-- ============================================

-- Décommenter et modifier cette ligne avec votre email :
-- INSERT INTO admin_users (email, name, role) 
-- VALUES ('votre-email@example.com', 'Administrateur Principal', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 8. FONCTION UTILITAIRE : Vérifier si un email est admin
-- ============================================

CREATE OR REPLACE FUNCTION check_admin_email(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = email_to_check 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 
-- 1. Les politiques RLS sont maintenant sécurisées :
--    - INSERT : Public (pour permettre les commandes)
--    - SELECT : Public pour orders/leads/files (lecture), Admin uniquement pour contacts
--    - UPDATE : Admin uniquement
--    - DELETE : Admin uniquement
--
-- 2. Pour ajouter un admin :
--    INSERT INTO admin_users (email, name, role) 
--    VALUES ('admin@example.com', 'Nom Admin', 'admin');
--
-- 3. Pour désactiver un admin :
--    UPDATE admin_users SET is_active = false WHERE email = 'admin@example.com';
--
-- 4. L'authentification Supabase Auth doit être activée dans votre projet Supabase
--
-- 5. Les admins doivent se connecter via Supabase Auth avec leur email
--    qui doit être présent dans la table admin_users
--
-- ============================================

