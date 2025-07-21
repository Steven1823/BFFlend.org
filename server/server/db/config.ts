import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';

// Database configuration
export const dbConfig = {
  supabase: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  // Add other database configs here if needed
  postgres: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bfflend',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  }
};

// Validate required environment variables
function validateConfig() {
  if (!dbConfig.supabase.url || !dbConfig.supabase.anonKey) {
    throw new Error('Missing required Supabase environment variables. Please check your .env file.');
  }
}

// Create Supabase client with service role for server-side operations
export function createSupabaseClient() {
  validateConfig();
  
  return createClient<Database>(
    dbConfig.supabase.url,
    dbConfig.supabase.serviceRoleKey || dbConfig.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Create Supabase client for client-side operations
export function createSupabaseClientSide() {
  validateConfig();
  
  return createClient<Database>(
    dbConfig.supabase.url,
    dbConfig.supabase.anonKey
  );
}

// Database connection instance
export const supabase = createSupabaseClient();

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database connection
export async function initializeDatabase() {
  console.log('Initializing database connection...');
  
  const isConnected = await checkDatabaseConnection();
  
  if (isConnected) {
    console.log('✅ Database connected successfully');
  } else {
    console.error('❌ Database connection failed');
    throw new Error('Failed to connect to database');
  }
  
  return isConnected;
}