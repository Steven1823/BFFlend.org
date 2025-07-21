import { z } from 'zod';

// User model schemas
export const UserSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  created_at: z.string(),
  updated_at: z.string(),
});

export const InsertUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  password: z.string().min(6).optional(),
});

// Payment model schemas
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'cancelled']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.number().nullable(),
  checkout_request_id: z.string(),
  phone_number: z.string().regex(/^254\d{9}$/, 'Phone number must be in format 254XXXXXXXXX'),
  amount: z.number().positive().multipleOf(0.01),
  account_reference: z.string().min(1).max(50),
  transaction_desc: z.string().nullable(),
  status: PaymentStatusSchema,
  mpesa_receipt_number: z.string().nullable(),
  transaction_date: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const InsertPaymentSchema = z.object({
  user_id: z.number().nullable().optional(),
  checkout_request_id: z.string(),
  phone_number: z.string().regex(/^254\d{9}$/, 'Phone number must be in format 254XXXXXXXXX'),
  amount: z.number().positive().multipleOf(0.01),
  account_reference: z.string().min(1).max(50),
  transaction_desc: z.string().nullable().optional(),
  status: PaymentStatusSchema.optional().default('pending'),
  mpesa_receipt_number: z.string().nullable().optional(),
  transaction_date: z.string().nullable().optional(),
});

export const UpdatePaymentSchema = z.object({
  user_id: z.number().nullable().optional(),
  checkout_request_id: z.string().optional(),
  phone_number: z.string().regex(/^254\d{9}$/).optional(),
  amount: z.number().positive().multipleOf(0.01).optional(),
  account_reference: z.string().min(1).max(50).optional(),
  transaction_desc: z.string().nullable().optional(),
  status: PaymentStatusSchema.optional(),
  mpesa_receipt_number: z.string().nullable().optional(),
  transaction_date: z.string().nullable().optional(),
});

// M-Pesa specific schemas
export const MPesaPaymentRequestSchema = z.object({
  phoneNumber: z.string().regex(/^(0|254|\+254)\d{9}$/, 'Invalid phone number format'),
  amount: z.number().positive().multipleOf(0.01),
  accountReference: z.string().min(1).max(50),
  transactionDesc: z.string().optional(),
  userId: z.number().optional(),
});

export const MPesaCallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(z.object({
          Name: z.string(),
          Value: z.union([z.string(), z.number()]),
        }))
      }).optional()
    })
  })
});

// Query parameter schemas
export const UserQuerySchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)),
});

export const PaymentQuerySchema = z.object({
  checkoutRequestId: z.string(),
});

export const UserPaymentsQuerySchema = z.object({
  id: z.string().transform(val => parseInt(val, 10)),
  status: PaymentStatusSchema.optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
});

// Response schemas
export const UserResponseSchema = UserSchema.omit({ password: true });

export const PaymentResponseSchema = PaymentSchema;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type InsertUser = z.infer<typeof InsertUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;

export type Payment = z.infer<typeof PaymentSchema>;
export type InsertPayment = z.infer<typeof InsertPaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export type MPesaPaymentRequest = z.infer<typeof MPesaPaymentRequestSchema>;
export type MPesaCallback = z.infer<typeof MPesaCallbackSchema>;

export type UserQuery = z.infer<typeof UserQuerySchema>;
export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;
export type UserPaymentsQuery = z.infer<typeof UserPaymentsQuerySchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation helper functions
export function validateUser(data: unknown): InsertUser {
  return InsertUserSchema.parse(data);
}

export function validateUserUpdate(data: unknown): UpdateUser {
  return UpdateUserSchema.parse(data);
}

export function validatePayment(data: unknown): InsertPayment {
  return InsertPaymentSchema.parse(data);
}

export function validatePaymentUpdate(data: unknown): UpdatePayment {
  return UpdatePaymentSchema.parse(data);
}

export function validateMPesaPaymentRequest(data: unknown): MPesaPaymentRequest {
  return MPesaPaymentRequestSchema.parse(data);
}

export function validateMPesaCallback(data: unknown): MPesaCallback {
  return MPesaCallbackSchema.parse(data);
}

// Utility functions
export function sanitizeUser(user: User): UserResponse {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Convert to international format (254XXXXXXXXX)
  if (phoneNumber.startsWith('0')) {
    return '254' + phoneNumber.slice(1);
  } else if (phoneNumber.startsWith('+254')) {
    return phoneNumber.slice(1);
  } else if (phoneNumber.startsWith('254')) {
    return phoneNumber;
  }
  throw new Error('Invalid phone number format');
}