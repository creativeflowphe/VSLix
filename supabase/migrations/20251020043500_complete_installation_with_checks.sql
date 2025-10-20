/*
  # Complete Installation Migration with Table Existence Checks

  ## Overview
  Comprehensive database setup for Beauty Salon Booking SaaS with intelligent checks.
  This migration can be run multiple times safely - it checks if tables exist before creating them.

  ## Tables Created (if not exist)

  ### 1. users
  Main user table for authentication and profiles
  - `id` (uuid, primary key) - User identifier
  - `email` (text, unique) - Email address
  - `role` (text) - 'master', 'owner', 'client'
  - `full_name` (text) - Full name
  - `phone` (text) - Contact number
  - `created_at` (timestamptz) - Registration date

  ### 2. salons
  Business entities (salons/spas)
  - `id` (uuid, primary key) - Salon identifier
  - `owner_user_id` (uuid, FK) - Owner reference
  - `name` (text) - Business name
  - `slug` (text, unique) - URL slug
  - `subscription_status` (text) - 'active', 'past_due', 'cancelled'
  - `payment_due` (date) - Next payment date
  - `address` (text) - Physical address
  - `phone` (text) - Contact number
  - `created_at` (timestamptz) - Creation date

  ### 3. services
  Services offered by salons
  - `id` (uuid, primary key) - Service identifier
  - `salon_id` (uuid, FK) - Salon reference
  - `name` (text) - Service name
  - `description` (text) - Service details
  - `duration_min` (integer) - Duration in minutes
  - `price` (decimal) - Price
  - `add_ons` (jsonb) - Additional options
  - `active` (boolean) - Availability status
  - `created_at` (timestamptz) - Creation date

  ### 4. providers
  Staff/service providers
  - `id` (uuid, primary key) - Provider identifier
  - `salon_id` (uuid, FK) - Salon reference
  - `name` (text) - Provider name
  - `email` (text) - Contact email
  - `schedule` (jsonb) - Work schedule
  - `active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation date

  ### 5. bookings
  Customer appointments
  - `id` (uuid, primary key) - Booking identifier
  - `service_id` (uuid, FK) - Service reference
  - `provider_id` (uuid, FK) - Provider reference
  - `client_id` (uuid, FK) - Client reference
  - `salon_id` (uuid, FK) - Salon reference
  - `start_time` (timestamptz) - Start time
  - `end_time` (timestamptz) - End time
  - `status` (text) - 'pending', 'confirmed', 'completed', 'cancelled'
  - `payment_status` (text) - 'unpaid', 'paid', 'refunded'
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Booking date

  ### 6. payments
  Payment records
  - `id` (uuid, primary key) - Payment identifier
  - `booking_id` (uuid, FK) - Booking reference
  - `amount` (decimal) - Payment amount
  - `status` (text) - 'pending', 'completed', 'failed', 'refunded'
  - `due_date` (date) - Due date
  - `paid_at` (timestamptz) - Payment timestamp
  - `stripe_payment_id` (text) - Stripe reference
  - `payment_method` (text) - Payment method
  - `tip_amount` (decimal) - Tip amount
  - `tax_amount` (decimal) - Tax amount
  - `invoice_number` (text, unique) - Invoice number
  - `invoice_url` (text) - Invoice URL
  - `created_at` (timestamptz) - Creation date

  ### 7. notifications
  User notifications
  - `id` (uuid, primary key) - Notification identifier
  - `user_id` (uuid, FK) - User reference
  - `type` (text) - Notification type
  - `message` (text) - Message content
  - `read` (boolean) - Read status
  - `created_at` (timestamptz) - Creation date

  ### 8. custom_features
  Feature flags per salon
  - `id` (uuid, primary key) - Feature identifier
  - `salon_id` (uuid, FK) - Salon reference
  - `feature_name` (text) - Feature name
  - `enabled` (boolean) - Enable status
  - `config` (jsonb) - Configuration
  - `created_at` (timestamptz) - Creation date

  ### 9. marketing
  Marketing campaigns
  - `id` (uuid, primary key) - Campaign identifier
  - `salon_id` (uuid, FK) - Salon reference
  - `promotions` (jsonb) - Promotion data
  - `active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation date

  ### 10. reviews
  Customer reviews
  - `id` (uuid, primary key) - Review identifier
  - `booking_id` (uuid, FK) - Booking reference
  - `salon_id` (uuid, FK) - Salon reference
  - `client_id` (uuid, FK) - Client reference
  - `rating` (integer) - Rating 1-5
  - `comment` (text) - Review text
  - `response` (text) - Owner response
  - `created_at` (timestamptz) - Creation date

  ### 11. service_categories
  Service categorization
  - `id` (uuid, primary key) - Category identifier
  - `name` (text, unique) - Category name
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Creation date

  ### 12. notification_templates
  Reusable notification templates
  - `id` (uuid, primary key) - Template identifier
  - `name` (text) - Template name
  - `type` (text) - Notification type
  - `subject` (text) - Email subject
  - `body` (text) - Template body
  - `variables` (jsonb) - Available variables
  - `created_at` (timestamptz) - Creation date

  ## Security
  - RLS enabled on all tables
  - Role-based policies (master, owner, client)
  - Public read for active salons/services
  - Secure data access patterns

  ## Indexes
  Performance indexes on frequently queried columns
*/

-- ================================================
-- CREATE TABLES WITH EXISTENCE CHECKS
-- ================================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('master', 'owner', 'client')),
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Table: salons
CREATE TABLE IF NOT EXISTS salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subscription_status text NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled')),
  payment_due date,
  address text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Table: service_categories
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL,
  price decimal(10,2) NOT NULL,
  add_ons jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add category_id column to services if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE services ADD COLUMN category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Table: providers
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  schedule jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  due_date date,
  paid_at timestamptz,
  stripe_payment_id text,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('stripe', 'pos', 'apple_pay', 'google_pay', 'cash')),
  tip_amount decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  invoice_number text UNIQUE,
  invoice_url text,
  created_at timestamptz DEFAULT now()
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  response text,
  created_at timestamptz DEFAULT now()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table: notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
  subject text,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table: custom_features
CREATE TABLE IF NOT EXISTS custom_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, feature_name)
);

-- Table: marketing
CREATE TABLE IF NOT EXISTS marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  promotions jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ================================================
-- ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing ENABLE ROW LEVEL SECURITY;

-- ================================================
-- DROP EXISTING POLICIES (IF ANY)
-- ================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
  END LOOP;
END $$;

-- ================================================
-- CREATE RLS POLICIES
-- ================================================

-- USERS POLICIES
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Master admin can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SALONS POLICIES
CREATE POLICY "Public can view active salons"
  ON salons FOR SELECT
  TO authenticated, anon
  USING (subscription_status = 'active');

CREATE POLICY "Salon owners can view their salons"
  ON salons FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Master admin can view all salons"
  ON salons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

CREATE POLICY "Master admin can insert salons"
  ON salons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

CREATE POLICY "Master admin can update salons"
  ON salons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

CREATE POLICY "Salon owners can update their salons"
  ON salons FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- SERVICE CATEGORIES POLICIES
CREATE POLICY "Public can view service categories"
  ON service_categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Master admin can manage categories"
  ON service_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

-- SERVICES POLICIES
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  TO authenticated, anon
  USING (
    active = true AND
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = services.salon_id
      AND salons.subscription_status = 'active'
    )
  );

CREATE POLICY "Salon owners can manage their services"
  ON services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = services.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

-- PROVIDERS POLICIES
CREATE POLICY "Public can view active providers"
  ON providers FOR SELECT
  TO authenticated, anon
  USING (
    active = true AND
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = providers.salon_id
      AND salons.subscription_status = 'active'
    )
  );

CREATE POLICY "Salon owners can manage their providers"
  ON providers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = providers.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

-- BOOKINGS POLICIES
CREATE POLICY "Clients can view their bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Salon owners can view their salon bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = bookings.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Master admin can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Salon owners can update their salon bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = bookings.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

-- PAYMENTS POLICIES
CREATE POLICY "Users can view their booking payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

CREATE POLICY "Salon owners can view their salon payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN salons ON salons.id = bookings.salon_id
      WHERE bookings.id = payments.booking_id
      AND salons.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Master admin can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

-- REVIEWS POLICIES
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Clients can create reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.client_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Salon owners can respond to reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = reviews.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NOTIFICATION TEMPLATES POLICIES
CREATE POLICY "Master admin can manage templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'master'
    )
  );

CREATE POLICY "All users can view templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (true);

-- CUSTOM FEATURES POLICIES
CREATE POLICY "Salon owners can manage their features"
  ON custom_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = custom_features.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

-- MARKETING POLICIES
CREATE POLICY "Public can view active promotions"
  ON marketing FOR SELECT
  TO authenticated, anon
  USING (active = true);

CREATE POLICY "Salon owners can manage their marketing"
  ON marketing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salons
      WHERE salons.id = marketing.salon_id
      AND salons.owner_user_id = auth.uid()
    )
  );

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);
CREATE INDEX IF NOT EXISTS idx_salons_status ON salons(subscription_status);
CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_providers_salon ON providers(salon_id);
CREATE INDEX IF NOT EXISTS idx_providers_active ON providers(active);
CREATE INDEX IF NOT EXISTS idx_bookings_salon ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ================================================
-- INSERT DEFAULT SERVICE CATEGORIES
-- ================================================

INSERT INTO service_categories (name, description)
VALUES
  ('Cabelo', 'Serviços para cabelo como corte, coloração e tratamentos'),
  ('Unhas', 'Manicure, pedicure e nail art'),
  ('Estética Facial', 'Limpeza de pele, tratamentos faciais e skincare'),
  ('Depilação', 'Depilação a cera, laser e outros métodos'),
  ('Massagem', 'Massagens relaxantes e terapêuticas'),
  ('Maquiagem', 'Maquiagem para eventos e dia a dia'),
  ('Sobrancelhas', 'Design, henna e micropigmentação'),
  ('Corpo', 'Tratamentos corporais e estéticos')
ON CONFLICT (name) DO NOTHING;
