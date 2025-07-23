import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  checkout_request_id: text("checkout_request_id").notNull(),
  phone_number: text("phone_number").notNull(),
  amount: integer("amount").notNull(),
  account_reference: text("account_reference").notNull(),
  transaction_desc: text("transaction_desc"),
  status: text("status").notNull().default("pending"),
  mpesa_receipt_number: text("mpesa_receipt_number"),
  transaction_date: text("transaction_date"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updatePaymentSchema = createInsertSchema(payments).partial().omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
