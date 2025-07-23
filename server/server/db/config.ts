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
    console.warn('Missing Supabase environment variables. Using MemStorage for development.');
    return false;
  }
  return true;
}

// Create Supabase client with service role for server-side operations
export function createSupabaseClient() {
  if (!validateConfig()) {
    throw new Error('Supabase not configured. Use MemStorage instead.');
  }
  
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
  if (!validateConfig()) {
    throw new Error('Supabase not configured. Use MemStorage instead.');
  }
  
  return createClient<Database>(
    dbConfig.supabase.url,
    dbConfig.supabase.anonKey
  );
}

// Database connection instance - only create if configured
export const supabase = (() => {
  try {
    return createSupabaseClient();
  } catch (error) {
    console.warn('Supabase client not created:', error);
    return null;
  }
})();

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!supabase) {
      console.log('Supabase not configured, using MemStorage');
      return false;
    }
    
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
  
  if (!supabase) {
    console.log('✅ Using in-memory storage for development');
    return true;
  }
  
  const isConnected = await checkDatabaseConnection();
  
  if (isConnected) {
    console.log('✅ Database connected successfully');
  } else {
    console.log('⚠️ Database connection failed, falling back to MemStorage');
  }
  
  return true; // Always return true to allow app to start with MemStorage
}