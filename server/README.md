# BFFlend.org Database Setup

This project uses PostgreSQL via Supabase for data storage, supporting both user management and M-Pesa payment processing. The application follows a clean architecture with separated concerns using controllers, models, and database configuration.

## Setup Instructions

1. **Connect to Supabase**: Click the "Connect to Supabase" button in the top right to set up your Supabase project.

2. **Environment Variables**: After connecting, your `.env` file will be automatically populated with the necessary Supabase credentials. You'll also need to add your Daraja (M-Pesa) credentials:
   ```
   DARAJA_CONSUMER_KEY=your_consumer_key
   DARAJA_CONSUMER_SECRET=your_consumer_secret
   DARAJA_PASSKEY=your_passkey
   DARAJA_SHORT_CODE=your_short_code
   DARAJA_ENVIRONMENT=sandbox
   ```

3. **Database Schema**: The database migration will create a `users` table with the following structure:
   - `id` (SERIAL PRIMARY KEY)
   - `username` (TEXT UNIQUE NOT NULL)
   - `password` (TEXT NOT NULL)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

   And a `payments` table for M-Pesa transactions:
   - `id` (UUID PRIMARY KEY)
   - `user_id` (INTEGER, foreign key to users)
   - `checkout_request_id` (TEXT UNIQUE, M-Pesa reference)
   - `phone_number` (TEXT NOT NULL)
   - `amount` (DECIMAL NOT NULL)
   - `account_reference` (TEXT NOT NULL)
   - `transaction_desc` (TEXT)
   - `status` (TEXT, 'pending'|'completed'|'failed'|'cancelled')
   - `mpesa_receipt_number` (TEXT)
   - `transaction_date` (TIMESTAMPTZ)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

## Storage Interface

## Project Structure

```
server/
├── db/
│   ├── config.ts          # Database connection and configuration
│   └── models.ts          # Zod schemas and validation
├── controllers/
│   ├── userController.ts  # User-related business logic
│   ├── paymentController.ts # Payment-related business logic
│   └── index.ts          # Controller exports
lib/
├── storage.ts            # Database storage implementation
├── payments/
│   └── daraja.ts         # M-Pesa integration
└── routes.ts             # Express route definitions
```

## Database Configuration

The database configuration is centralized in `server/db/config.ts`:

```typescript
import { initializeDatabase, supabase } from './server/db/config';

// Initialize database connection
await initializeDatabase();
```

## Models and Validation

All data models use Zod for runtime validation in `server/db/models.ts`:

```typescript
import { validateUser, validatePayment } from './server/db/models';

// Validate user input
const userData = validateUser(req.body);
```

## Controllers

Business logic is separated into controllers:

### UserController
- `getUser(req, res)` - Get user by ID
- `getUserByUsername(req, res)` - Get user by username
- `createUser(req, res)` - Create new user
- `updateUser(req, res)` - Update user
- `deleteUser(req, res)` - Delete user
- `getAllUsers(req, res)` - Get all users (admin)

### PaymentController
- `initiatePayment(req, res)` - Initiate M-Pesa payment
- `handleCallback(req, res)` - Handle M-Pesa callback
- `getPaymentStatus(req, res)` - Check payment status
- `getUserPayments(req, res)` - Get user's payments
- `getPayment(req, res)` - Get payment by ID
- `getAllPayments(req, res)` - Get all payments (admin)

## Storage Interface

```typescript
interface IStorage {
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
```

## Usage

### Using Controllers

```typescript
import { UserController, PaymentController } from './server/controllers';

// In your routes
app.get('/api/users/:id', UserController.getUser);
app.post('/api/payments/initiate', PaymentController.initiatePayment);
```

### Direct Storage Usage

```typescript
import { storage } from './lib/storage';

// Create a user
const newUser = await storage.createUser({ 
  username: 'john_doe', 
  password: 'hashed_password' 
});

// Get user by ID
const user = await storage.getUser(1);

// Get user by username
const userByName = await storage.getUserByUsername('john_doe');

// Update user
const updatedUser = await storage.updateUser(1, { 
  username: 'jane_doe' 
});

// Delete user
const deleted = await storage.deleteUser(1);

// Get all users
const allUsers = await storage.getAllUsers();

// Payment operations
const payment = await storage.createPayment({
  user_id: 1,
  checkout_request_id: 'ws_CO_123456789',
  phone_number: '254712345678',
  amount: 100.00,
  account_reference: 'BFF001',
  transaction_desc: 'Loan payment'
});

// Update payment status (typically from M-Pesa callback)
await storage.updatePaymentStatus(
  'ws_CO_123456789', 
  'completed', 
  'NLJ7RT61SV'
);

// Get user payments
const userPayments = await storage.getUserPayments(1);
```

## API Routes

### User Routes
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/username/:username` - Get user by username
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id/payments` - Get user's payments

### Payment Routes
- `POST /api/payments/initiate` - Initiate M-Pesa payment
- `POST /api/payments/callback` - M-Pesa callback handler
- `GET /api/payments/status/:checkoutRequestId` - Check payment status
- `GET /api/users/:id/payments` - Get user's payments
- `GET /api/payments/:id` - Get payment by ID
- `GET /api/payments` - Get all payments (admin)

## M-Pesa Integration

The system includes complete M-Pesa integration via Daraja API:

### Payment Flow
1. **Initiate Payment**: `POST /api/payments/initiate`
   ```json
   {
     "phoneNumber": "254712345678",
     "amount": 100,
     "accountReference": "BFF001",
     "transactionDesc": "Loan payment",
     "userId": 1
   }
   ```

2. **Callback Processing**: M-Pesa sends callbacks to `/api/payments/callback`
   - Automatically updates payment status in database
   - Stores M-Pesa receipt numbers

3. **Status Checking**: `GET /api/payments/status/:checkoutRequestId`
   - Returns both database status and real-time Daraja status

### Features
- ✅ STK Push payments
- ✅ Automatic callback processing
- ✅ Payment status tracking
- ✅ User payment history
- ✅ Transaction audit trail
- ✅ Sandbox and production support

## Security

- Row Level Security (RLS) is enabled on the users table
- RLS is also enabled on the payments table
- Authenticated users can perform CRUD operations
- Username uniqueness is enforced at the database level
- Payment data is isolated per user
- Automatic timestamp management for created_at and updated_at fields

## Important Notes

- **Clean Architecture**: The application follows separation of concerns with controllers handling business logic, models handling validation, and storage handling data persistence.
- **Input Validation**: All API inputs are validated using Zod schemas before processing.
- **Error Handling**: Comprehensive error handling with proper HTTP status codes and error messages.
- **Password Security**: The current implementation stores passwords as plain text. You should implement password hashing using bcrypt or similar before production use.
- **Authentication**: Consider implementing proper JWT-based authentication for API routes.
- **Payment Security**: Ensure proper validation of M-Pesa callbacks and implement webhook signature verification.
- **Admin Routes**: Some routes are marked as admin-only and require proper authentication/authorization implementation.

## Development

For testing purposes, you can still use the in-memory storage:

```typescript
import { memStorage } from './lib/storage';
// Use memStorage for testing
```

## Dependencies

The project uses the following key dependencies:
- `@supabase/supabase-js` - Supabase client
- `zod` - Runtime type validation
- `axios` - HTTP client for M-Pesa API
- `express` - Web framework

## Environment Variables

Required environment variables:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Daraja (M-Pesa)
DARAJA_CONSUMER_KEY=your_consumer_key
DARAJA_CONSUMER_SECRET=your_consumer_secret
DARAJA_PASSKEY=your_passkey
DARAJA_SHORT_CODE=your_short_code
DARAJA_ENVIRONMENT=sandbox
```