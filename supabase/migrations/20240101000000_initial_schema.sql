-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'manager', 'finance');
CREATE TYPE repair_status AS ENUM (
  'pending_check',
  'pending_send',
  'repairing',
  'repair_done',
  'pending_payment',
  'ready_to_ship',
  'completed'
);
CREATE TYPE return_method AS ENUM ('pickup', 'mail');

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'customer',
  birth_date DATE,
  birth_time TIME,
  birth_gender TEXT,
  mobile TEXT,
  email TEXT,
  line_user_id TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  district TEXT NOT NULL, -- Khet/Amphoe
  sub_district TEXT NOT NULL, -- Kwaeng/Tambon
  postal_code TEXT NOT NULL,
  details TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repairs table
CREATE TABLE repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id),
  status repair_status DEFAULT 'pending_check',
  
  -- Item Details
  items JSONB NOT NULL, -- Array of { description, images[], plating(bool) }
  return_method return_method NOT NULL,
  
  -- Logistics
  tracking_number TEXT,
  
  -- Pricing (Internal & External)
  cost_internal DECIMAL(10, 2), -- Visible only to Finance/Manager
  cost_external DECIMAL(10, 2), -- Visible to Customer
  discount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (cost_external - discount + shipping_cost) STORED,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view/edit their own. Managers can view/edit all.
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Addresses: Users manage their own. Managers can view all.
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'finance')
  ));

CREATE POLICY "Users can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Repairs: Customers view own. Managers/Finance view all.
CREATE POLICY "Customers view own repairs" ON repairs
  FOR SELECT USING (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'finance')
  ));

CREATE POLICY "Customers can create repairs" ON repairs
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Functions & Triggers
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', '', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
