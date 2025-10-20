import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  role: 'master' | 'owner' | 'client';
  full_name: string;
  phone?: string;
  created_at: string;
}

export interface Salon {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  subscription_status: 'active' | 'past_due' | 'cancelled';
  payment_due?: string;
  address?: string;
  phone?: string;
  created_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description?: string;
  duration_min: number;
  price: number;
  add_ons?: any[];
  active: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  salon_id: string;
  name: string;
  email?: string;
  schedule?: any;
  active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  service_id: string;
  provider_id: string;
  client_id: string;
  salon_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  created_at: string;
}
