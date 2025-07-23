// import { supabase } from './supabase'; // Commented out for MemStorage development
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

// PostgresStorage class (disabled for development - requires Supabase configuration)
export class PostgresStorage implements IStorage {
  constructor() {
    console.warn('PostgresStorage requires Supabase configuration. Use MemStorage for development.');
  }

  async getUser(id: number): Promise<User | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async deleteUser(id: number): Promise<boolean> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async getAllUsers(): Promise<User[]> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async getPaymentByCheckoutRequestId(checkoutRequestId: string): Promise<Payment | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async updatePayment(id: string, updates: UpdatePayment): Promise<Payment | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
  }

  async updatePaymentStatus(checkoutRequestId: string, status: Payment['status'], receiptNumber?: string): Promise<Payment | undefined> {
    throw new Error('PostgresStorage not available without Supabase configuration. Use MemStorage for development.');
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
      user_id: insertPayment.user_id ?? null, // Ensure user_id is not undefined
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
export const storage = new MemStorage(); // Using MemStorage for development
export const memStorage = new MemStorage(); // Available for testing