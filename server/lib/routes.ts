import type { Express } from "express";
import { createServer, type Server } from "http";
import { UserController, PaymentController } from "../server/controllers";
import { initializeDatabase } from "../server/db/config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database connection
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw here to allow server to start even if DB is not ready
    // This allows for graceful degradation during development
  }

  // Payment routes
  app.post('/api/payments/initiate', PaymentController.initiatePayment);
  app.post('/api/payments/callback', PaymentController.handleCallback);
  app.get('/api/payments/status/:checkoutRequestId', PaymentController.getPaymentStatus);
  app.get('/api/payments/:id', PaymentController.getPayment);
  app.get('/api/payments', PaymentController.getAllPayments);

  // User routes
  app.get('/api/users/:id', UserController.getUser);
  app.get('/api/users/username/:username', UserController.getUserByUsername);
  app.post('/api/users', UserController.createUser);
  app.put('/api/users/:id', UserController.updateUser);
  app.delete('/api/users/:id', UserController.deleteUser);
  app.get('/api/users', UserController.getAllUsers);
  
  // User payments route
  app.get('/api/users/:id/payments', PaymentController.getUserPayments);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  const httpServer = createServer(app);

  return httpServer;
}