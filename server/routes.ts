import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { darajaService } from "./payments/daraja";

export async function registerRoutes(app: Express): Promise<Server> {
  // Payment routes
  app.post('/api/payments/initiate', async (req, res) => {
    try {
      const { phoneNumber, amount, accountReference, transactionDesc } = req.body;
      
      if (!phoneNumber || !amount || !accountReference) {
        return res.status(400).json({ 
          error: 'Missing required fields: phoneNumber, amount, accountReference' 
        });
      }

      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/callback`;
      
      const paymentResponse = await darajaService.initiatePayment({
        phoneNumber,
        amount,
        accountReference,
        transactionDesc: transactionDesc || 'BFFlend Transaction',
        callbackUrl
      });

      res.json(paymentResponse);
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate payment' });
    }
  });

  app.post('/api/payments/callback', async (req, res) => {
    try {
      const callbackData = req.body;
      console.log('Payment callback received:', callbackData);
      
      const result = darajaService.processCallback(callbackData);
      
      if (result.success) {
        console.log('Payment successful:', result);
        // Here you would update your database with the successful payment
        // storage.updatePaymentStatus(result.transactionId, 'completed');
      } else {
        console.log('Payment failed:', result.errorMessage);
        // Handle failed payment
      }

      res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
      console.error('Callback processing error:', error);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
    }
  });

  app.get('/api/payments/status/:checkoutRequestId', async (req, res) => {
    try {
      const { checkoutRequestId } = req.params;
      const status = await darajaService.checkPaymentStatus(checkoutRequestId);
      res.json(status);
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({ error: 'Failed to check payment status' });
    }
  });

  // User routes (placeholder)
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const user = await storage.createUser({ username, password });
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
