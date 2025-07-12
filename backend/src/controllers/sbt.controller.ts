/**
 * SoulboundToken Controller
 * 
 * Handles HTTP requests related to SoulboundToken operations:
 * - Check user verification status
 * - Mint new identity tokens (admin only)
 * - Revoke user verification
 * - Get verification statistics
 */

import { Request, Response } from 'express';
import { 
  isUserVerified, 
  mintSoulboundToken, 
  revokeUserVerification, 
  getTotalVerifiedUsers,
  getUserTokenId,
  batchCheckVerification
} from '../services/sbt.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const addressSchema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();
const batchAddressSchema = Joi.array().items(addressSchema).max(50).required();

/**
 * GET /sbt/:address/is-verified
 * Check if a user address is verified (has SBT)
 */
export const checkVerificationStatus = async (req: Request, res: Response) => {
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

    logger.info('Checking verification status', { address });

    const verificationStatus = await isUserVerified(address);

    res.json({
      success: true,
      data: {
        address,
        isVerified: verificationStatus.isVerified,
        tokenId: verificationStatus.tokenId
      }
    });

  } catch (error) {
    logger.error('Failed to check verification status', { address: req.params.address, error });
    res.status(500).json({
      success: false,
      error: 'Failed to check verification status'
    });
  }
};

/**
 * POST /sbt/mint
 * Mint a new SoulboundToken to verify a user (admin only)
 * Body: { address: string }
 */
export const mintToken = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    // Validate request body
    const { error } = Joi.object({
      address: addressSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Minting SoulboundToken', { address });

    const result = await mintSoulboundToken(address);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          address,
          tokenId: result.tokenId,
          transactionHash: result.transactionHash
        },
        message: 'SoulboundToken minted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to mint SoulboundToken', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to mint token'
    });
  }
};

/**
 * POST /sbt/revoke
 * Revoke user verification by burning their SBT (admin only)
 * Body: { address: string }
 */
export const revokeVerification = async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    // Validate request body
    const { error } = Joi.object({
      address: addressSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Revoking user verification', { address });

    const result = await revokeUserVerification(address);

    if (result.success) {
      res.json({
        success: true,
        data: {
          address,
          transactionHash: result.transactionHash
        },
        message: 'User verification revoked successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to revoke verification', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to revoke verification'
    });
  }
};

/**
 * GET /sbt/stats
 * Get verification statistics
 */
export const getVerificationStats = async (req: Request, res: Response) => {
  try {
    logger.info('Getting verification statistics');

    const totalVerified = await getTotalVerifiedUsers();

    res.json({
      success: true,
      data: {
        totalVerifiedUsers: totalVerified,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get verification stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get verification statistics'
    });
  }
};

/**
 * GET /sbt/:address/token-id
 * Get user's token ID if verified
 */
export const getTokenId = async (req: Request, res: Response) => {
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

    logger.info('Getting user token ID', { address });

    const tokenId = await getUserTokenId(address);

    if (tokenId !== null) {
      res.json({
        success: true,
        data: {
          address,
          tokenId
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User is not verified'
      });
    }

  } catch (error) {
    logger.error('Failed to get token ID', { address: req.params.address, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get token ID'
    });
  }
};

/**
 * POST /sbt/batch-check
 * Check verification status for multiple addresses
 * Body: { addresses: string[] }
 */
export const batchCheckVerification = async (req: Request, res: Response) => {
  try {
    const { addresses } = req.body;

    // Validate request body
    const { error } = Joi.object({
      addresses: batchAddressSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Batch checking verification status', { count: addresses.length });

    const results = await batchCheckVerification(addresses);

    res.json({
      success: true,
      data: {
        results,
        total: addresses.length,
        verified: results.filter(r => r.isVerified).length
      }
    });

  } catch (error) {
    logger.error('Failed to batch check verification', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch verification check'
    });
  }
};

/**
 * GET /sbt/health
 * Health check endpoint for SBT service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Try to get total verified users as a health check
    const totalVerified = await getTotalVerifiedUsers();
    
    res.json({
      success: true,
      data: {
        service: 'SoulboundToken',
        status: 'healthy',
        totalVerifiedUsers: totalVerified,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('SBT service health check failed', { error });
    res.status(503).json({
      success: false,
      error: 'Service unavailable'
    });
  }
};