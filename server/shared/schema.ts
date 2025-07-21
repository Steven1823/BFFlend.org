// Database types based on Supabase schema
export interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface UpdateUser {
  username?: string;
  password?: string;
}

// Payment types
export interface Payment {
  id: string;
  user_id: number | null;
  checkout_request_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  mpesa_receipt_number: string | null;
  transaction_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertPayment {
  user_id?: number | null;
  checkout_request_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc?: string | null;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  mpesa_receipt_number?: string | null;
  transaction_date?: string | null;
}

export interface UpdatePayment {
  user_id?: number | null;
  checkout_request_id?: string;
  phone_number?: string;
  amount?: number;
  account_reference?: string;
  transaction_desc?: string | null;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  mpesa_receipt_number?: string | null;
  transaction_date?: string | null;
}

// Re-export for compatibility
export { users } from './users';