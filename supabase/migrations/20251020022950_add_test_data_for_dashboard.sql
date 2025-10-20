/*
  # Add Test Data for Dashboard Visualization

  ## Overview
  This migration adds sample data to test the admin dashboard charts and KPIs.
  
  ## Data Added
  
  1. Sample Services
    - Multiple services with different prices and durations
    
  2. Sample Providers
    - Multiple staff members for the salon
    
  3. Sample Bookings
    - 60 bookings spread over the last 30 days
    - Mix of statuses (pending, confirmed, completed, cancelled)
    - Mix of payment statuses (paid, unpaid)
    
  4. Sample Payments
    - Payment records for paid bookings
    
  ## Important Notes
  - Only adds data if no existing bookings found for the salon
  - Uses the first salon found in the database
  - Data is realistic and helps visualize trends
*/

DO $$
DECLARE
  v_salon_id uuid;
  v_owner_id uuid;
  v_service_ids uuid[];
  v_provider_ids uuid[];
  v_booking_id uuid;
  v_start_date date;
  v_service_idx int;
  v_provider_idx int;
  v_status_options text[] := ARRAY['pending', 'confirmed', 'completed', 'cancelled'];
  v_payment_status_options text[] := ARRAY['paid', 'unpaid'];
  v_status text;
  v_payment_status text;
BEGIN
  -- Get the first salon and owner
  SELECT id, owner_user_id INTO v_salon_id, v_owner_id
  FROM salons
  LIMIT 1;
  
  -- Only proceed if we have a salon
  IF v_salon_id IS NOT NULL THEN
    
    -- Check if test data already exists
    IF NOT EXISTS (SELECT 1 FROM bookings WHERE salon_id = v_salon_id LIMIT 1) THEN
      
      -- Insert sample services if they don't exist
      INSERT INTO services (salon_id, name, description, duration_min, price, active)
      VALUES
        (v_salon_id, 'Corte de Cabelo', 'Corte completo com lavagem e finalização', 45, 80.00, true),
        (v_salon_id, 'Manicure', 'Manicure completa com esmaltação', 60, 50.00, true),
        (v_salon_id, 'Pedicure', 'Pedicure completa com esmaltação', 60, 60.00, true),
        (v_salon_id, 'Hidratação', 'Hidratação profunda para cabelos', 90, 120.00, true),
        (v_salon_id, 'Maquiagem', 'Maquiagem profissional', 60, 150.00, true),
        (v_salon_id, 'Massagem', 'Massagem relaxante', 60, 100.00, true)
      ON CONFLICT DO NOTHING
      RETURNING ARRAY_AGG(id) INTO v_service_ids;
      
      -- Get service IDs if they already existed
      IF v_service_ids IS NULL THEN
        SELECT ARRAY_AGG(id) INTO v_service_ids
        FROM services
        WHERE salon_id = v_salon_id;
      END IF;
      
      -- Insert sample providers if they don't exist
      INSERT INTO providers (salon_id, name, email, active)
      VALUES
        (v_salon_id, 'Ana Silva', 'ana@salon.com', true),
        (v_salon_id, 'Carlos Santos', 'carlos@salon.com', true),
        (v_salon_id, 'Maria Oliveira', 'maria@salon.com', true),
        (v_salon_id, 'João Pereira', 'joao@salon.com', true)
      ON CONFLICT DO NOTHING
      RETURNING ARRAY_AGG(id) INTO v_provider_ids;
      
      -- Get provider IDs if they already existed
      IF v_provider_ids IS NULL THEN
        SELECT ARRAY_AGG(id) INTO v_provider_ids
        FROM providers
        WHERE salon_id = v_salon_id;
      END IF;
      
      -- Insert sample bookings for the last 30 days
      FOR i IN 0..59 LOOP
        -- Calculate date (spread over last 30 days)
        v_start_date := CURRENT_DATE - (i % 30);
        
        -- Randomly select service and provider
        v_service_idx := (random() * (array_length(v_service_ids, 1) - 1))::int + 1;
        v_provider_idx := (random() * (array_length(v_provider_ids, 1) - 1))::int + 1;
        
        -- Randomly select status (more completed and confirmed)
        IF random() < 0.5 THEN
          v_status := 'completed';
          v_payment_status := 'paid';
        ELSIF random() < 0.75 THEN
          v_status := 'confirmed';
          v_payment_status := 'unpaid';
        ELSIF random() < 0.9 THEN
          v_status := 'pending';
          v_payment_status := 'unpaid';
        ELSE
          v_status := 'cancelled';
          v_payment_status := 'unpaid';
        END IF;
        
        -- Insert booking
        INSERT INTO bookings (
          salon_id,
          service_id,
          provider_id,
          client_id,
          start_time,
          end_time,
          status,
          payment_status,
          notes
        )
        VALUES (
          v_salon_id,
          v_service_ids[v_service_idx],
          v_provider_ids[v_provider_idx],
          v_owner_id,
          v_start_date + (TIME '09:00:00' + (i % 8) * INTERVAL '1 hour'),
          v_start_date + (TIME '09:00:00' + (i % 8) * INTERVAL '1 hour' + INTERVAL '1 hour'),
          v_status,
          v_payment_status,
          'Agendamento de teste'
        )
        RETURNING id INTO v_booking_id;
        
        -- Insert payment if booking is paid
        IF v_payment_status = 'paid' THEN
          INSERT INTO payments (
            booking_id,
            amount,
            status,
            paid_at
          )
          SELECT
            v_booking_id,
            s.price,
            'completed',
            v_start_date + (TIME '09:00:00' + (i % 8) * INTERVAL '1 hour')
          FROM services s
          WHERE s.id = v_service_ids[v_service_idx];
        END IF;
      END LOOP;
      
      RAISE NOTICE 'Test data created successfully with % bookings', 60;
    ELSE
      RAISE NOTICE 'Test data already exists, skipping creation';
    END IF;
  ELSE
    RAISE NOTICE 'No salon found, skipping test data creation';
  END IF;
END $$;
