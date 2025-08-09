-- =====================================================
-- CLERK INTEGRATION MIGRATION
-- =====================================================
-- This migration adds Clerk user ID support to existing tables
-- Run this on your Supabase database to enable Clerk integration

-- Add Clerk user ID to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;

-- Make password_hash optional since Clerk handles authentication
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add Clerk user ID to cart_items table
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

-- Add Clerk user ID to orders table  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_clerk_id ON cart_items(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_clerk_id ON orders(clerk_user_id);

-- Update cart_items foreign key constraint to be more flexible
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE;

-- Update orders foreign key constraint to be more flexible
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT DEFERRABLE;

-- Create a function to sync cart items by clerk_user_id
CREATE OR REPLACE FUNCTION sync_cart_items_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When clerk_user_id is updated, sync the user_id
  IF NEW.clerk_user_id IS NOT NULL AND NEW.clerk_user_id != OLD.clerk_user_id THEN
    SELECT id INTO NEW.user_id 
    FROM users 
    WHERE clerk_user_id = NEW.clerk_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cart_items
DROP TRIGGER IF EXISTS sync_cart_items_user_id_trigger ON cart_items;
CREATE TRIGGER sync_cart_items_user_id_trigger
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION sync_cart_items_user_id();

-- Create a function to sync orders by clerk_user_id
CREATE OR REPLACE FUNCTION sync_orders_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When clerk_user_id is updated, sync the user_id
  IF NEW.clerk_user_id IS NOT NULL AND NEW.clerk_user_id != OLD.clerk_user_id THEN
    SELECT id INTO NEW.user_id 
    FROM users 
    WHERE clerk_user_id = NEW.clerk_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders
DROP TRIGGER IF EXISTS sync_orders_user_id_trigger ON orders;
CREATE TRIGGER sync_orders_user_id_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_orders_user_id();

-- Enable Row Level Security (RLS) for Clerk integration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR current_setting('role') = 'service_role'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR current_setting('role') = 'service_role'
  );

DROP POLICY IF EXISTS "Service role can insert users" ON users;
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (current_setting('role') = 'service_role');

-- Create RLS policies for cart_items table
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR current_setting('role') = 'service_role'
  );

-- Create RLS policies for orders table
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR current_setting('role') = 'service_role'
  );

DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR current_setting('role') = 'service_role'
  );

-- Create RLS policies for order_items table
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR current_setting('role') = 'service_role'
      )
    )
  );

DROP POLICY IF EXISTS "Service role can manage order items" ON order_items;
CREATE POLICY "Service role can manage order items" ON order_items
  FOR ALL USING (current_setting('role') = 'service_role');

-- Allow public read access to spare_parts, categories, brands, and app_settings
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to spare_parts" ON spare_parts;
CREATE POLICY "Public read access to spare_parts" ON spare_parts
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read access to categories" ON categories;
CREATE POLICY "Public read access to categories" ON categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read access to brands" ON brands;
CREATE POLICY "Public read access to brands" ON brands
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read access to app_settings" ON app_settings;
CREATE POLICY "Public read access to app_settings" ON app_settings
  FOR SELECT USING (true);

-- Admin policies (service role can manage everything)
DROP POLICY IF EXISTS "Service role can manage spare_parts" ON spare_parts;
CREATE POLICY "Service role can manage spare_parts" ON spare_parts
  FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
CREATE POLICY "Service role can manage categories" ON categories
  FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage brands" ON brands;
CREATE POLICY "Service role can manage brands" ON brands
  FOR ALL USING (current_setting('role') = 'service_role');

DROP POLICY IF EXISTS "Service role can manage app_settings" ON app_settings;
CREATE POLICY "Service role can manage app_settings" ON app_settings
  FOR ALL USING (current_setting('role') = 'service_role');

-- Create admin user if it doesn't exist
INSERT INTO users (clerk_user_id, email, name, role, is_active, email_verified)
VALUES ('admin-user-clerk-id', 'admin@autoparts.com', 'Admin User', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;

COMMIT;
