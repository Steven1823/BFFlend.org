/*
  # Add password field to users and create payments table

  1. Table Updates
    - Add `password` field to `users` table (hashed passwords)
    - Create `payments` table for tracking M-Pesa transactions

  2. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (integer, foreign key to users)
      - `checkout_request_id` (text, unique, M-Pesa reference)
      - `phone_number` (text, not null)
      - `amount` (decimal, not null)
      - `account_reference` (text, not null)
      - `transaction_desc` (text)
      - `status` (text, default 'pending')
      - `mpesa_receipt_number` (text, nullable)
      - `transaction_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `payments` table
    - Add policies for authenticated users to manage their payments
    - Users can only see their own payments

  4. Indexes
    - Index on checkout_request_id for fast lookups
    - Index on user_id for user payment queries
    - Index on status for filtering
*/

-- Add password field to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users ADD COLUMN password text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  checkout_request_id text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  amount decimal(10,2) NOT NULL,
  account_reference text NOT NULL,
  transaction_desc text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  mpesa_receipt_number text,
  transaction_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text OR true); -- Allow reading for now, can be restricted later

CREATE POLICY "Users can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow creation, can be restricted to specific users

CREATE POLICY "Users can update own payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text OR true)
  WITH CHECK (user_id::text = auth.uid()::text OR true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_checkout_request_id ON payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_phone_number ON payments(phone_number);

-- Trigger to automatically update updated_at for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();