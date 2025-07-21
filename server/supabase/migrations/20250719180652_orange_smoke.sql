/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (integer, primary key, auto-increment)
      - `username` (text, unique, not null)
      - Additional user fields can be added as needed

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to create users
    - Add policy for authenticated users to read all users (for username lookup)

  3. Notes
    - Using integer ID to match your existing interface
    - Username is unique and required
    - RLS policies allow basic CRUD operations for authenticated users
*/

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR true); -- Allow reading all users for username lookup

-- Policy for users to create new users
CREATE POLICY "Users can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();