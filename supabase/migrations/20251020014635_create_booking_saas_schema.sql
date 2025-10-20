/*
  # Create Beauty Salon Booking SaaS Database Schema

  ## Overview
  Complete database schema for a multi-tenant SaaS booking system for beauty salons.
  Supports master admin, salon owners, and end clients with full booking capabilities.

  ## New Tables

  ### 1. users
  Main user table for all user types (master admin, salon owners, end clients)
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address
  - `role` (text) - User role: 'master', 'owner', 'client'
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. salons
  Salon/business entities owned by users
  - `id` (uuid, primary key) - Unique salon identifier
  - `owner_user_id` (uuid, foreign key) - Reference to owner in users table
  - `name` (text) - Salon business name
  - `slug` (text, unique) - URL-friendly identifier for booking page
  - `subscription_status` (text) - 'active', 'past_due', 'cancelled'
  - `payment_due` (date) - Next payment due date
  - `address` (text) - Physical address
  - `phone` (text) - Contact phone
  - `created_at` (timestamptz) - Salon creation date

  ### 3. services
  Services offered by each salon
  - `id` (uuid, primary key) - Unique service identifier
  - `salon_id` (uuid, foreign key) - Reference to salon
  - `name` (text) - Service name (e.g., "Haircut", "Manicure")
  - `description` (text) - Service description
  - `duration_min` (integer) - Duration in minutes
  - `price` (decimal) - Base price
  - `add_ons` (jsonb) - Additional options/add-ons
  - `active` (boolean) - Service availability status
  - `created_at` (timestamptz)

  ### 4. providers
  Staff members who perform services
  - `id` (uuid, primary key) - Unique provider identifier
  - `salon_id` (uuid, foreign key) - Reference to salon
  - `name` (text) - Provider name
  - `email` (text) - Contact email
  - `schedule` (jsonb) - Weekly schedule and special dates
  - `active` (boolean) - Provider availability
  - `created_at` (timestamptz)

  ### 5. bookings
  Customer appointments/bookings
  - `id` (uuid, primary key) - Unique booking identifier
  - `service_id` (uuid, foreign key) - Reference to service
  - `provider_id` (uuid, foreign key) - Reference to provider
  - `client_id` (uuid, foreign key) - Reference to client user
  - `salon_id` (uuid, foreign key) - Reference to salon
  - `start_time` (timestamptz) - Appointment start time
  - `end_time` (timestamptz) - Appointment end time
  - `status` (text) - 'pending', 'confirmed', 'completed', 'cancelled'
  - `payment_status` (text) - 'unpaid', 'paid', 'refunded'
  - `notes` (text) - Additional booking notes
  - `created_at` (timestamptz)

  ### 6. payments
  Payment records for bookings
  - `id` (uuid, primary key) - Unique payment identifier
  - `booking_id` (uuid, foreign key) - Reference to booking
  - `amount` (decimal) - Payment amount
  - `status` (text) - 'pending', 'completed', 'failed', 'refunded'
  - `due_date` (date) - Payment due date
  - `paid_at` (timestamptz) - Payment completion timestamp
  - `created_at` (timestamptz)

  ### 7. notifications
  User notifications for various events
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - Reference to user
  - `type` (text) - Notification type
  - `message` (text) - Notification message
  - `read` (boolean) - Read status
  - `created_at` (timestamptz)

  ### 8. custom_features
  Feature flags for salon-specific customizations
  - `id` (uuid, primary key) - Unique feature identifier
  - `salon_id` (uuid, foreign key) - Reference to salon
  - `feature_name` (text) - Feature identifier
  - `enabled` (boolean) - Feature status
  - `config` (jsonb) - Feature configuration
  - `created_at` (timestamptz)

  ### 9. marketing
  Marketing and promotion management
  - `id` (uuid, primary key) - Unique marketing record identifier
  - `salon_id` (uuid, foreign key) - Reference to salon
  - `promotions` (jsonb) - Promotion details
  - `active` (boolean) - Campaign status
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for master admin (full access)
  - Policies for salon owners (access to their salon data)
  - Policies for clients (access to their own bookings)
  - Public read access to salons and services for booking pages
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('master', 'owner', 'client')),
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create salons table
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

-- Create services table
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

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  schedule jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
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

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create custom_features table
CREATE TABLE IF NOT EXISTS custom_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(salon_id, feature_name)
);

-- Create marketing table
CREATE TABLE IF NOT EXISTS marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES salons(id) ON DELETE CASCADE,
  promotions jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
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

-- RLS Policies for salons table
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

-- RLS Policies for services table
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

-- RLS Policies for providers table
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

-- RLS Policies for bookings table
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

-- RLS Policies for payments table
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

-- RLS Policies for notifications table
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for custom_features table
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

-- RLS Policies for marketing table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);
CREATE INDEX IF NOT EXISTS idx_services_salon ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_providers_salon ON providers(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_salon ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
