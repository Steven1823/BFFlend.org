# BFFlend - P2P Rental Marketplace

A Web3-powered peer-to-peer rental marketplace designed for African users.

## Deployment to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up a Supabase project for your database
3. **M-Pesa Developer Account**: For payment processing (optional for initial deployment)

### Environment Variables

Set up the following environment variables in your Vercel dashboard:

#### Required for Database
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Required for M-Pesa Payments (Optional)
```
DARAJA_CONSUMER_KEY=your_daraja_consumer_key
DARAJA_CONSUMER_SECRET=your_daraja_consumer_secret
DARAJA_PASSKEY=your_daraja_passkey
DARAJA_SHORT_CODE=your_daraja_short_code
DARAJA_ENVIRONMENT=sandbox
```

#### Application Configuration
```
NODE_ENV=production
```

### Deployment Steps

1. **Connect Repository**: 
   - Go to Vercel dashboard
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: Other
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all the environment variables listed above

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Database Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy the project URL and anon key

2. **Run Migrations**:
   - Go to Supabase SQL Editor
   - Run the migration files from `server/supabase/migrations/`

3. **Configure RLS Policies**:
   - Ensure Row Level Security is enabled
   - Verify the policies are correctly applied

### API Routes

The following API endpoints will be available after deployment:

- `GET /api/health` - Health check
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/username/:username` - Get user by username
- `POST /api/payments/initiate` - Initiate M-Pesa payment
- `POST /api/payments/callback` - M-Pesa callback handler
- `GET /api/payments/status/:checkoutRequestId` - Check payment status

### Troubleshooting

1. **Build Errors**: Check that all dependencies are properly installed
2. **API Errors**: Verify environment variables are set correctly
3. **Database Errors**: Ensure Supabase is configured and migrations are run
4. **Payment Errors**: Verify Daraja API credentials (if using M-Pesa)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Considerations

1. **Security**: Implement proper authentication and authorization
2. **Error Handling**: Add comprehensive error logging
3. **Rate Limiting**: Implement API rate limiting
4. **Monitoring**: Set up application monitoring and alerts
5. **Backup**: Configure database backups

## Features

- User authentication and profiles
- Item listing and browsing
- M-Pesa payment integration
- Responsive design
- PWA support

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Payments**: M-Pesa (Daraja API)
- **Deployment**: Vercel