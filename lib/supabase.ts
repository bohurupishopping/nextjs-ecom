import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_price?: number;
  sku: string;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  inventory_quantity: number;
  weight?: number | null;
  dimensions?: string | null;
  requires_shipping?: boolean;
  taxable?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  compare_price?: number;
  sku: string;
  inventory_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  items?: OrderItem[];
  users?: {
    email?: string;
    user_profiles?: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'customer' | 'admin';
}