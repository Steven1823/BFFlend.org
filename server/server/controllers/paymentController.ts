import type { Request, Response } from 'express';
import { storage } from '../../lib/storage';
import { darajaService } from '../../lib/payments/daraja';
import { 
  validateMPesaPaymentRequest,
  validateMPesaCallback,
  PaymentQuerySchema,
  UserPaymentsQuerySchema,
  formatPhoneNumber,
  type Payment 
} from '../db/models';
import { z } from 'zod';

export class PaymentController {
  /**
   * Initiate M-Pesa payment
   */
  static async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const paymentData = validateMPesaPaymentRequest(req.body);
      
      // Format phone number
      const formattedPhoneNumber = formatPhoneNumber(paymentData.phoneNumber);
      
      // Generate callback URL
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/callback`;
      
      // Initiate payment with Daraja
      const paymentResponse = await darajaService.initiatePayment({
        phoneNumber: formattedPhoneNumber,
        amount: paymentData.amount,
        accountReference: paymentData.accountReference,
        transactionDesc: paymentData.transactionDesc || 'BFFlend Transaction',
        callbackUrl
      });

      // Store payment in database if successful
      if (paymentResponse.CheckoutRequestID) {
        await storage.createPayment({
          user_id: paymentData.userId || null,
          checkout_request_id: paymentResponse.CheckoutRequestID,
          phone_number: formattedPhoneNumber,
          amount: paymentData.amount,
          account_reference: paymentData.accountReference,
          transaction_desc: paymentData.transactionDesc || 'BFFlend Transaction',
          status: 'pending'
        });
      }

      res.json(paymentResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      console.error('Payment initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate payment' });
    }
  }

  /**
   * Handle M-Pesa callback
   */
  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const callbackData = validateMPesaCallback(req.body);
      console.log('Payment callback received:', callbackData);
      
      const result = darajaService.processCallback(callbackData);
      
      if (result.success && result.checkoutRequestId) {
        console.log('Payment successful:', result);
        // Update payment status in database
        await storage.updatePaymentStatus(
          result.checkoutRequestId, 
          'completed',
          result.mpesaReceiptNumber
        );
      } else if (result.checkoutRequestId) {
        console.log('Payment failed:', result.errorMessage);
        // Update payment status to failed
        await storage.updatePaymentStatus(result.checkoutRequestId, 'failed');
      }

      res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid callback data:', error.errors);
        res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid callback data' });
        return;
      }
      
      console.error('Callback processing error:', error);
      res.status(500).json({ ResultCode: 1, ResultDesc: 'Error processing callback' });
    }
  }

  /**
   * Check payment status
   */
  static async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutRequestId } = PaymentQuerySchema.parse(req.params);
      
      // Get payment from database
      const payment = await storage.getPaymentByCheckoutRequestId(checkoutRequestId);
      
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      // Also check with Daraja service for real-time status
      let darajaStatus = null;
      try {
        darajaStatus = await darajaService.checkPaymentStatus(checkoutRequestId);
      } catch (error) {
        console.warn('Failed to get Daraja status:', error);
        // Continue with database status only
      }
      
      res.json({
        ...payment,
        darajaStatus
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Invalid checkout request ID', 
          details: error.errors[0]?.message 
        });
        return;
      }
      
      console.error('Payment status check error:', error);
      res.status(500).json({ error: 'Failed to check payment status' });
    }
  }

  /**
   * Get user payments
   */
  static async getUserPayments(req: Request, res: Response): Promise<void> {
    try {
      const { id, status, limit = 50, offset = 0 } = UserPaymentsQuerySchema.parse({
        ...req.params,
        ...req.query
      });
      
      let payments = await storage.getUserPayments(id);
      
      // Filter by status if provided
      if (status) {
        payments = payments.filter(payment => payment.status === status);
      }
      
      // Apply pagination
      const paginatedPayments = payments.slice(offset, offset + limit);
      
      res.json({
        payments: paginatedPayments,
        total: payments.length,
        limit,
        offset
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
        return;
      }
      
      console.error('Get user payments error:', error);
      res.status(500).json({ error: 'Failed to get user payments' });
    }
  }

  /**
   * Get payment by ID
   */
  static async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Payment ID is required' });
        return;
      }
      
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }
      
      res.json(payment);
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ error: 'Failed to get payment' });
    }
  }

  /**
   * Get all payments (admin function)
   */
  static async getAllPayments(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Add authentication/authorization check for admin users
      
      const { status, userId } = req.query;
      
      if (userId) {
        const payments = await storage.getUserPayments(parseInt(userId as string));
        res.json(payments);
      } else {
        // For now, return empty array - implement admin functionality as needed
        res.json([]);
      }
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({ error: 'Failed to get payments' });
    }
  }
}