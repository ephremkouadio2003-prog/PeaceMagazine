# Configuration Supabase pour Peace Magazine

Ce document explique comment configurer Supabase pour la persistance des données.

## 📋 Tables à créer

Vous devez créer les tables suivantes dans votre projet Supabase :

**⚠️ IMPORTANT :** Utilisez le fichier `supabase-setup.sql` qui contient uniquement le SQL pur, sans commentaires Markdown.

### 1. Table `orders` (Commandes)

**Ou utilisez directement le fichier `supabase-setup.sql`**

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name VARCHAR(255) NOT NULL,
  occasion VARCHAR(100) NOT NULL,
  relationship VARCHAR(100),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  delivery_date DATE,
  delivery_address TEXT,
  delivery_phone VARCHAR(50),
  photo_delivery_mode VARCHAR(50),
  photo_link TEXT,
  description TEXT,
  style VARCHAR(100),
  colors JSONB,
  additional_info TEXT,
  uploaded_files JSONB,
  cover_photo JSONB,
  anecdotes JSONB,
  testimonials JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  order_number VARCHAR(100),
  payment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### 2. Table `leads` (Prospects)

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  occasion VARCHAR(100),
  message TEXT,
  source VARCHAR(100) DEFAULT 'contact_form',
  status VARCHAR(50) DEFAULT 'new',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

### 3. Table `contacts` (Messages de contact)

```sql
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(100) DEFAULT 'contact_form',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);
```

### 4. Table `files` (Fichiers uploadés)

```sql
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  data TEXT, -- Base64 ou URL
  server_id VARCHAR(255),
  server_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_files_server_id ON files(server_id);
CREATE INDEX idx_files_created_at ON files(created_at);
```

## 🔐 Configuration des politiques RLS (Row Level Security)

Pour permettre l'accès public (lecture/écriture) via l'API :

### Politique pour `orders`
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public select on orders"
  ON orders FOR SELECT
  TO anon
  USING (true);
```

### Politique pour `leads`
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public select on leads"
  ON leads FOR SELECT
  TO anon
  USING (true);
```

### Politique pour `contacts`
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on contacts"
  ON contacts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public select on contacts"
  ON contacts FOR SELECT
  TO anon
  USING (true);
```

### Politique pour `files`
```sql
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on files"
  ON files FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public select on files"
  ON files FOR SELECT
  TO anon
  USING (true);
```

## 📝 Instructions d'installation

1. **Connectez-vous à votre projet Supabase** : https://supabase.com/dashboard

2. **Allez dans SQL Editor** et :
   - **Option 1 (Recommandé)** : Copiez-collez tout le contenu du fichier `supabase-setup.sql` et exécutez-le
   - **Option 2** : Exécutez les scripts SQL ci-dessus section par section (sans les commentaires Markdown `#`)
   
   Le fichier `supabase-setup.sql` contient :
   - Création des tables
   - Création des index
   - Configuration des politiques RLS

3. **Vérifiez la configuration** :
   - Allez dans Settings > API
   - Vérifiez que votre URL et votre clé API correspondent à celles dans `index.html`

4. **Testez l'intégration** :
   - Ouvrez la console du navigateur
   - Vérifiez que `Supabase activé: true` s'affiche
   - Testez la création d'une commande

## 🔧 Configuration dans le code

La configuration Supabase est déjà intégrée dans `index.html` :

```javascript
window.APP_CONFIG = {
    supabaseUrl: 'https://chxhkoeqwssrczfviar.supabase.co',
    supabaseKey: 'votre_clé_api',
    useSupabase: true
};
```

## 🚀 Utilisation

Le service Supabase est automatiquement utilisé pour :
- ✅ Créer des commandes (`createOrder`)
- ✅ Créer des leads (`createLead`)
- ✅ Créer des contacts (`createContact`)
- ✅ Uploader des fichiers (`uploadFile`)

En cas d'erreur Supabase, le système bascule automatiquement vers le backend classique.

## 📊 Visualisation des données

Vous pouvez visualiser vos données dans Supabase :
- **Table Editor** : Voir toutes les données
- **SQL Editor** : Exécuter des requêtes personnalisées
- **API Docs** : Documentation automatique de l'API

## 🔒 Sécurité

⚠️ **Important** : Les politiques RLS permettent l'accès public. Pour la production, vous devriez :
- Restreindre l'accès SELECT aux admins uniquement
- Ajouter une authentification pour les opérations sensibles
- Utiliser des fonctions Supabase pour valider les données

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans la console du navigateur
2. Vérifiez les logs Supabase dans le dashboard
3. Vérifiez que les tables et politiques sont correctement créées

