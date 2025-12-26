-- Configuration Supabase pour Peace Magazine
-- Exécutez ce fichier dans SQL Editor de Supabase

-- 1. Table orders (Commandes)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE,
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
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_url TEXT,
  payment_amount DECIMAL(10, 2),
  payment_reference VARCHAR(255),
  payment_token VARCHAR(255),
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  payment_cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_cancellation_reason TEXT,
  payment_proof_url TEXT,
  payment_confirmed_by VARCHAR(255),
  payment_notes TEXT,
  base_price DECIMAL(10, 2) DEFAULT 25000.00,
  total_price DECIMAL(10, 2) DEFAULT 25000.00,
  currency VARCHAR(10) DEFAULT 'XOF',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour orders
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 2. Table leads (Prospects)
CREATE TABLE IF NOT EXISTS leads (
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

-- Index pour leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- 3. Table contacts (Messages de contact)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(100) DEFAULT 'contact_form',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour contacts
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- 4. Table files (Fichiers uploadés)
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL UNIQUE,
  mimetype VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  path TEXT,
  url TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'photo',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour files
CREATE INDEX IF NOT EXISTS idx_files_order_id ON files(order_id);
CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

-- Configuration RLS (Row Level Security)

-- Politique pour orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on orders" ON orders;
CREATE POLICY "Allow public select on orders"
  ON orders FOR SELECT
  TO anon
  USING (true);

-- Politique pour leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on leads" ON leads;
CREATE POLICY "Allow public insert on leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on leads" ON leads;
CREATE POLICY "Allow public select on leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

-- Politique pour contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on contacts" ON contacts;
CREATE POLICY "Allow public insert on contacts"
  ON contacts FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on contacts" ON contacts;
CREATE POLICY "Allow public select on contacts"
  ON contacts FOR SELECT
  TO anon
  USING (true);

-- Politique pour files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on files" ON files;
CREATE POLICY "Allow public insert on files"
  ON files FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on files" ON files;
CREATE POLICY "Allow public select on files"
  ON files FOR SELECT
  TO anon
  USING (true);


