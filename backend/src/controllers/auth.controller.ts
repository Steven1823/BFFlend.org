/**
 * Auth Controller
 * 
 * Handles authentication-related operations:
 * - Wallet signature verification
 * - Session management (optional)
 * - User authentication status
 * 
 * Note: This is a basic implementation. In production, you might want
 * to implement JWT tokens, session management, or other auth mechanisms.
 */

import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { isUserVerified } from '../services/sbt.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const addressSchema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();

/**
 * POST /auth/verify-signature
 * Verify wallet signature for authentication
 * Body: { address, message, signature }
 */
export const verifySignature = async (req: Request, res: Response) => {
  try {
    const { address, message, signature } = req.body;

    // Validate request body
    const { error } = Joi.object({
      address: addressSchema,
      message: Joi.string().required(),
      signature: Joi.string().pattern(/^0x[a-fA-F0-9]{130}$/).required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Verifying wallet signature', { address });

    try {
      // Recover address from signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Check if recovered address matches provided address
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
      }

      // Check if user is verified (has SBT)
      const verificationStatus = await isUserVerified(address);

      logger.info('Signature verified successfully', { 
        address, 
        isVerified: verificationStatus.isVerified 
      });

      res.json({
        success: true,
        data: {
          address,
          isVerified: verificationStatus.isVerified,
          tokenId: verificationStatus.tokenId,
          authenticated: true
        },
        message: 'Signature verified successfully'
      });

    } catch (signatureError) {
      logger.warn('Invalid signature provided', { address, error: signatureError });
      res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

  } catch (error) {
    logger.error('Failed to verify signature', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to verify signature'
    });
  }
};

/**
 * GET /auth/nonce/:address
 * Generate a nonce for wallet signature
 * This creates a unique message that the user must sign
 */
export const getNonce = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Validate address format
    const { error } = addressSchema.validate(address);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    // Generate a unique nonce
    const timestamp = Date.now();
    const randomValue = Math.random().toString(36).substring(2);
    const nonce = `${timestamp}-${randomValue}`;
    
    // Create message to sign
    const message = `Welcome to FriendLend!\n\nPlease sign this message to authenticate your wallet.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date(timestamp).toISOString()}`;

    logger.info('Generated nonce for authentication', { address, nonce });

    res.json({
      success: true,
      data: {
        address,
        nonce,
        message,
        timestamp
      }
    });

  } catch (error) {
    logger.error('Failed to generate nonce', { address: req.params.address, error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce'
    });
  }
};

/**
 * GET /auth/status/:address
 * Get authentication status for an address
 */
export const getAuthStatus = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Validate address format
    const { error } = addressSchema.validate(address);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid address format'
      });
    }

    logger.info('Getting auth status', { address });

    // Check verification status
    const verificationStatus = await isUserVerified(address);

    res.json({
      success: true,
      data: {
        address,
        isVerified: verificationStatus.isVerified,
        tokenId: verificationStatus.tokenId,
        canUseApp: verificationStatus.isVerified,
        requiresKYC: !verificationStatus.isVerified
      }
    });

  } catch (error) {
    logger.error('Failed to get auth status', { address: req.params.address, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get authentication status'
    });
  }
};

/**
 * POST /auth/logout
 * Logout user (clear session if using sessions)
 * Body: { address }
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    // Validate address format
    const { error } = Joi.object({
      address: addressSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('User logout', { address });

    // In a session-based system, you would clear the session here
    // For now, we just acknowledge the logout

    res.json({
      success: true,
      data: {
        address,
        loggedOut: true
      },
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Failed to logout', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
};

/**
 * GET /auth/health
 * Health check endpoint for auth service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        service: 'AuthService',
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Auth service health check failed', { error });
    res.status(503).json({
      success: false,
      error: 'Service unavailable'
    });
  }
};

/**
 * Middleware to verify user is authenticated and verified
 * This can be used to protect routes that require authentication
 */
export const requireAuth = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required'
      });
    }

    // In a real implementation, you would verify the JWT token here
    // For now, we'll extract the address from the token (simplified)
    const token = authHeader.substring(7);
    
    // This is a simplified example - in production, use proper JWT verification
    try {
      const address = token; // Assuming token is just the address for simplicity
      
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid address in token');
      }

      // Check if user is verified
      const verificationStatus = await isUserVerified(address);
      
      if (!verificationStatus.isVerified) {
        return res.status(403).json({
          success: false,
          error: 'User is not verified'
        });
      }

      // Add user info to request
      (req as any).user = {
        address,
        isVerified: true,
        tokenId: verificationStatus.tokenId
      };

      next();

    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};