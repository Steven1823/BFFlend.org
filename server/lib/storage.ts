import { supabase } from './supabase';
import type { User, InsertUser, Payment, InsertPayment, UpdatePayment } from '@shared/schema';

// Updated interface with additional methods for PostgreSQL
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: UpdatePayment): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  updatePaymentStatus(checkoutRequestId: string, status: Payment['status'], receiptNumber?: string): Promise<Payment | undefined>;
}

export class PostgresStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(insertUser)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(insertPayment)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      return undefined;
    }
  }

  async getPaymentByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | undefined> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching payment by checkout request ID:', error);
      return undefined;
    }
  }

  async updatePayment(id: string, updates: UpdatePayment): Promise<Payment | undefined> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating payment:', error);
      return undefined;
    }
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user payments:', error);
      return [];
    }
  }

  async updatePaymentStatus(
    checkoutRequestId: string, 
    status: Payment['status'], 
    receiptNumber?: string
  ): Promise<Payment | undefined> {
    try {
      const updates: UpdatePayment = { 
        status,
        ...(receiptNumber && { mpesa_receipt_number: receiptNumber }),
        ...(status === 'completed' && { transaction_date: new Date().toISOString() })
      };

      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('checkout_request_id', checkoutRequestId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return undefined;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return undefined;
    }
  }
}

// Keep the MemStorage class for testing/development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: now, 
      updated_at: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Payment methods for MemStorage (simplified for testing)
  private payments: Map<string, Payment> = new Map();
  private currentPaymentId = 1;

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = `payment_${this.currentPaymentId++}`;
    const now = new Date().toISOString();
    const payment: Payment = {
      id,
      ...insertPayment,
      status: insertPayment.status || 'pending',
      created_at: now,
      updated_at: now
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | undefined> {
    return Array.from(this.payments.values()).find(
      payment => payment.checkout_request_id === checkoutRequestId
    );
  }

  async updatePayment(id: string, updates: UpdatePayment): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    const updatedPayment: Payment = {
      ...payment,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.user_id === userId
    );
  }

  async updatePaymentStatus(
    checkoutRequestId: string, 
    status: Payment['status'], 
    receiptNumber?: string
  ): Promise<Payment | undefined> {
    const payment = Array.from(this.payments.values()).find(
      p => p.checkout_request_id === checkoutRequestId
    );
    
    if (!payment) return undefined;

    const updates: UpdatePayment = { 
      status,
      ...(receiptNumber && { mpesa_receipt_number: receiptNumber }),
      ...(status === 'completed' && { transaction_date: new Date().toISOString() })
    };

    return this.updatePayment(payment.id, updates);
  }
}

// Export the appropriate storage implementation
// Use PostgresStorage for production, MemStorage for testing
export const storage = new PostgresStorage();
export const memStorage = new MemStorage(); // Available for testing