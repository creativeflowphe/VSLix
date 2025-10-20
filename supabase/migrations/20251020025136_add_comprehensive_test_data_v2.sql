/*
  # Add Comprehensive Test Data for Dashboard Charts v2

  ## Overview
  Creates extensive test data to populate all dashboard metrics and charts with realistic data.

  ## Data Added

  ### 1. Additional Client Users
  Creates 15 test client users for realistic booking patterns

  ### 2. Additional Salons with Varied Status
  Creates 4 more salons with different subscription statuses and payment due dates

  ### 3. Enhanced Booking Data
  - 200+ bookings across all salons
  - Distributed over last 30 days for time-series analysis
  - Mix of statuses: completed, confirmed, pending, cancelled
  - Varied payment methods: stripe, pos, apple_pay, google_pay, cash

  ### 4. Payment Data with Full Details
  - Complete payment records for all bookings
  - Mix of pending, completed, and overdue payments
  - Tips and taxes calculated
  - Unique invoice numbers generated
  - Some overdue payments (due_date < now, status = pending)

  ## Use Cases
  This data enables testing of:
  - Client/salon growth charts
  - Overdue payment tracking
  - Popular services bar chart
  - Repeat clients and cancellation pie charts
  - Payment method distribution
  - Time-series booking trends

  ## Security
  No RLS changes - uses existing policies
*/

-- Create additional test client users
DO $$
DECLARE
  v_client_id uuid;
  i integer;
BEGIN
  FOR i IN 1..15 LOOP
    INSERT INTO users (email, role, full_name, phone)
    VALUES (
      'client' || i || '@test.com',
      'client',
      'Cliente Teste ' || i,
      '(11) 9' || lpad((9000 + i)::text, 4, '0') || '-' || lpad((1000 + i)::text, 4, '0')
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Created 15 test client users';
END $$;

-- Create additional salons with varied statuses
DO $$
DECLARE
  v_owner_id uuid;
  v_salon_id uuid;
  v_service_id uuid;
  v_provider_id uuid;
  salon_names text[] := ARRAY['Beleza Pura', 'Espaço Glamour', 'Studio Elegance', 'Charme Total'];
  salon_slugs text[] := ARRAY['beleza-pura', 'espaco-glamour', 'studio-elegance', 'charme-total'];
  service_names text[] := ARRAY['Corte Feminino', 'Corte Masculino', 'Coloração', 'Escova', 'Depilação', 'Design de Sobrancelhas'];
  service_prices decimal[] := ARRAY[80.00, 45.00, 150.00, 60.00, 70.00, 40.00];
  service_durations integer[] := ARRAY[60, 30, 120, 45, 45, 30];
  provider_names text[] := ARRAY['Paula Costa', 'Roberto Lima', 'Fernanda Souza'];
  i integer;
  j integer;
BEGIN
  -- Get or create owner user
  SELECT id INTO v_owner_id FROM users WHERE role = 'owner' LIMIT 1;
  
  IF v_owner_id IS NULL THEN
    INSERT INTO users (email, role, full_name, phone)
    VALUES ('owner@test.com', 'owner', 'Dono Teste', '(11) 98888-8888')
    RETURNING id INTO v_owner_id;
  END IF;
  
  -- Create salons
  FOR i IN 1..4 LOOP
    INSERT INTO salons (
      owner_user_id,
      name,
      slug,
      subscription_status,
      payment_due,
      address,
      phone
    )
    VALUES (
      v_owner_id,
      salon_names[i],
      salon_slugs[i],
      CASE 
        WHEN i <= 2 THEN 'active'
        WHEN i = 3 THEN 'past_due'
        ELSE 'active'
      END,
      CASE 
        WHEN i = 3 THEN CURRENT_DATE - 5
        ELSE CURRENT_DATE + (i * 10)
      END,
      'Rua Teste ' || i || ', ' || (100 + i),
      '(11) 3000-000' || i
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_salon_id;
    
    -- Create services for this salon
    FOR j IN 1..6 LOOP
      INSERT INTO services (salon_id, name, description, duration_min, price, active)
      VALUES (
        v_salon_id,
        service_names[j],
        'Serviço profissional de ' || service_names[j],
        service_durations[j],
        service_prices[j],
        true
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Create providers for this salon
    FOR j IN 1..3 LOOP
      INSERT INTO providers (salon_id, name, email, active)
      VALUES (
        v_salon_id,
        provider_names[j],
        lower(replace(provider_names[j], ' ', '.')) || '@' || salon_slugs[i] || '.com',
        true
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created 4 additional salons with services and providers';
END $$;

-- Create comprehensive booking and payment data
DO $$
DECLARE
  v_salon record;
  v_service record;
  v_provider record;
  v_client record;
  v_booking_id uuid;
  v_date_offset integer;
  v_status text;
  v_payment_status text;
  v_payment_method text;
  v_amount decimal;
  v_tip decimal;
  v_tax decimal;
  bookings_per_salon integer := 50;
  payment_methods text[] := ARRAY['stripe', 'pos', 'apple_pay', 'google_pay', 'cash'];
  counter integer := 0;
BEGIN
  -- For each salon, create bookings
  FOR v_salon IN SELECT * FROM salons LOOP
    -- Create bookings for this salon
    FOR i IN 1..bookings_per_salon LOOP
      counter := counter + 1;
      
      -- Random date in last 30 days
      v_date_offset := (random() * 30)::integer;
      
      -- Random service from this salon
      SELECT * INTO v_service 
      FROM services 
      WHERE salon_id = v_salon.id 
      ORDER BY random() 
      LIMIT 1;
      
      -- Random provider from this salon
      SELECT * INTO v_provider 
      FROM providers 
      WHERE salon_id = v_salon.id 
      ORDER BY random() 
      LIMIT 1;
      
      -- Random client
      SELECT * INTO v_client 
      FROM users 
      WHERE role = 'client' 
      ORDER BY random() 
      LIMIT 1;
      
      -- Skip if we don't have all required data
      CONTINUE WHEN v_service IS NULL OR v_provider IS NULL OR v_client IS NULL;
      
      -- Determine status (weighted towards completed)
      IF random() < 0.60 THEN
        v_status := 'completed';
        v_payment_status := 'paid';
      ELSIF random() < 0.80 THEN
        v_status := 'confirmed';
        v_payment_status := 'unpaid';
      ELSIF random() < 0.90 THEN
        v_status := 'pending';
        v_payment_status := 'unpaid';
      ELSE
        v_status := 'cancelled';
        v_payment_status := 'unpaid';
      END IF;
      
      -- Random payment method
      v_payment_method := payment_methods[(random() * 4)::integer + 1];
      
      -- Calculate amounts
      v_amount := v_service.price;
      v_tip := CASE WHEN random() < 0.4 THEN (random() * 20)::decimal(10,2) ELSE 0 END;
      v_tax := (v_amount * 0.08)::decimal(10,2);
      
      -- Create booking
      INSERT INTO bookings (
        salon_id,
        service_id,
        provider_id,
        client_id,
        start_time,
        end_time,
        status,
        payment_status,
        notes,
        created_at
      )
      VALUES (
        v_salon.id,
        v_service.id,
        v_provider.id,
        v_client.id,
        (CURRENT_DATE - v_date_offset) + (TIME '09:00' + (i % 9) * INTERVAL '1 hour'),
        (CURRENT_DATE - v_date_offset) + (TIME '09:00' + (i % 9) * INTERVAL '1 hour' + (v_service.duration_min || ' minutes')::interval),
        v_status,
        v_payment_status,
        'Booking teste',
        CURRENT_TIMESTAMP - (v_date_offset || ' days')::interval
      )
      RETURNING id INTO v_booking_id;
      
      -- Create payment record with unique invoice number
      INSERT INTO payments (
        booking_id,
        amount,
        status,
        due_date,
        paid_at,
        stripe_payment_id,
        payment_method,
        tip_amount,
        tax_amount,
        invoice_number,
        created_at
      )
      VALUES (
        v_booking_id,
        v_amount,
        CASE 
          WHEN v_payment_status = 'paid' THEN 'completed'
          WHEN random() < 0.15 THEN 'pending'
          ELSE 'pending'
        END,
        CASE 
          WHEN v_payment_status = 'paid' THEN (CURRENT_DATE - v_date_offset)
          WHEN random() < 0.2 THEN (CURRENT_DATE - (random() * 10)::integer)
          ELSE (CURRENT_DATE + (random() * 30)::integer)
        END,
        CASE 
          WHEN v_payment_status = 'paid' THEN (CURRENT_TIMESTAMP - (v_date_offset || ' days')::interval)
          ELSE NULL
        END,
        CASE 
          WHEN v_payment_method = 'stripe' THEN 'pi_' || substr(md5(random()::text), 1, 24)
          ELSE NULL
        END,
        v_payment_method,
        v_tip,
        v_tax,
        'INV-' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS') || '-' || lpad(counter::text, 6, '0'),
        CURRENT_TIMESTAMP - (v_date_offset || ' days')::interval
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created comprehensive booking and payment data';
END $$;
