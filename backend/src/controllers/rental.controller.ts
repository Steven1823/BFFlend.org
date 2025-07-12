/**
 * Rental Controller
 * 
 * Handles HTTP requests related to rental escrow operations:
 * - Create escrow agreements
 * - Make deposits
 * - Activate rentals
 * - Release payments
 * - Handle disputes
 * - Get escrow details
 */

import { Request, Response } from 'express';
import {
  createEscrow,
  makeDeposit,
  activateRental,
  releaseToLender,
  raiseDispute,
  getEscrowDetails,
  getUserEscrows,
  EscrowState
} from '../services/escrow.service';
import { isUserVerified } from '../services/sbt.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Validation schemas
const addressSchema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();
const ethAmountSchema = Joi.string().pattern(/^\d+(\.\d{1,18})?$/).required();
const escrowIdSchema = Joi.number().integer().min(0).required();

const createEscrowSchema = Joi.object({
  borrowerAddress: addressSchema,
  lenderAddress: addressSchema,
  rentalAmount: ethAmountSchema,
  securityDeposit: ethAmountSchema,
  durationHours: Joi.number().integer().min(1).max(8760).required(), // 1 hour to 1 year
  itemDescription: Joi.string().min(1).max(500).required()
});

/**
 * POST /rental/create
 * Create a new escrow agreement
 * Body: { borrowerAddress, lenderAddress, rentalAmount, securityDeposit, durationHours, itemDescription }
 */
export const createRentalEscrow = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = createEscrowSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { borrowerAddress, lenderAddress, rentalAmount, securityDeposit, durationHours, itemDescription } = value;

    logger.info('Creating rental escrow', {
      borrower: borrowerAddress,
      lender: lenderAddress,
      rentalAmount,
      securityDeposit,
      duration: durationHours
    });

    // Verify both parties are KYC verified
    const [borrowerVerified, lenderVerified] = await Promise.all([
      isUserVerified(borrowerAddress),
      isUserVerified(lenderAddress)
    ]);

    if (!borrowerVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Borrower is not verified. Please complete KYC verification.'
      });
    }

    if (!lenderVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Lender is not verified. Please complete KYC verification.'
      });
    }

    // Create escrow
    const result = await createEscrow(borrowerAddress, {
      lenderAddress,
      rentalAmount,
      securityDeposit,
      durationHours,
      itemDescription
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          escrowId: result.escrowId,
          transactionHash: result.transactionHash,
          borrower: borrowerAddress,
          lender: lenderAddress,
          rentalAmount,
          securityDeposit,
          duration: durationHours
        },
        message: 'Escrow created successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to create rental escrow', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to create escrow'
    });
  }
};

/**
 * POST /rental/deposit
 * Make a deposit to an escrow (borrower pays rental + security deposit)
 * Body: { borrowerAddress, escrowId }
 */
export const makeRentalDeposit = async (req: Request, res: Response) => {
  try {
    const { borrowerAddress, escrowId } = req.body;

    // Validate request body
    const { error } = Joi.object({
      borrowerAddress: addressSchema,
      escrowId: escrowIdSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Making rental deposit', { borrower: borrowerAddress, escrowId });

    // Verify borrower
    const borrowerVerified = await isUserVerified(borrowerAddress);
    if (!borrowerVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Borrower is not verified'
      });
    }

    const result = await makeDeposit(borrowerAddress, escrowId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          escrowId,
          transactionHash: result.transactionHash
        },
        message: 'Deposit made successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to make rental deposit', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to make deposit'
    });
  }
};

/**
 * POST /rental/activate
 * Activate rental (lender confirms item handover)
 * Body: { lenderAddress, escrowId }
 */
export const activateRentalAgreement = async (req: Request, res: Response) => {
  try {
    const { lenderAddress, escrowId } = req.body;

    // Validate request body
    const { error } = Joi.object({
      lenderAddress: addressSchema,
      escrowId: escrowIdSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Activating rental', { lender: lenderAddress, escrowId });

    // Verify lender
    const lenderVerified = await isUserVerified(lenderAddress);
    if (!lenderVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Lender is not verified'
      });
    }

    const result = await activateRental(lenderAddress, escrowId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          escrowId,
          transactionHash: result.transactionHash
        },
        message: 'Rental activated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to activate rental', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to activate rental'
    });
  }
};

/**
 * POST /rental/release
 * Release payment to lender (after rental completion)
 * Body: { lenderAddress, escrowId }
 */
export const releasePayment = async (req: Request, res: Response) => {
  try {
    const { lenderAddress, escrowId } = req.body;

    // Validate request body
    const { error } = Joi.object({
      lenderAddress: addressSchema,
      escrowId: escrowIdSchema
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Releasing payment to lender', { lender: lenderAddress, escrowId });

    // Verify lender
    const lenderVerified = await isUserVerified(lenderAddress);
    if (!lenderVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Lender is not verified'
      });
    }

    const result = await releaseToLender(lenderAddress, escrowId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          escrowId,
          transactionHash: result.transactionHash
        },
        message: 'Payment released successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to release payment', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to release payment'
    });
  }
};

/**
 * POST /rental/dispute
 * Raise a dispute for an escrow
 * Body: { userAddress, escrowId, reason }
 */
export const raiseRentalDispute = async (req: Request, res: Response) => {
  try {
    const { userAddress, escrowId, reason } = req.body;

    // Validate request body
    const { error } = Joi.object({
      userAddress: addressSchema,
      escrowId: escrowIdSchema,
      reason: Joi.string().min(10).max(500).required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    logger.info('Raising rental dispute', { user: userAddress, escrowId, reason });

    // Verify user
    const userVerified = await isUserVerified(userAddress);
    if (!userVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'User is not verified'
      });
    }

    const result = await raiseDispute(userAddress, escrowId, reason);

    if (result.success) {
      res.json({
        success: true,
        data: {
          escrowId,
          transactionHash: result.transactionHash,
          reason
        },
        message: 'Dispute raised successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to raise dispute', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to raise dispute'
    });
  }
};

/**
 * GET /rental/:escrowId
 * Get escrow details by ID
 */
export const getEscrow = async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;

    // Validate escrow ID
    const { error } = escrowIdSchema.validate(parseInt(escrowId));
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escrow ID'
      });
    }

    logger.info('Getting escrow details', { escrowId });

    const escrow = await getEscrowDetails(parseInt(escrowId));

    if (escrow) {
      res.json({
        success: true,
        data: {
          escrowId: parseInt(escrowId),
          ...escrow,
          stateText: EscrowState[escrow.state]
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Escrow not found'
      });
    }

  } catch (error) {
    logger.error('Failed to get escrow details', { escrowId: req.params.escrowId, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get escrow details'
    });
  }
};

/**
 * GET /rental/user/:address
 * Get all escrows for a user
 */
export const getUserRentals = async (req: Request, res: Response) => {
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

    logger.info('Getting user escrows', { address });

    const escrowIds = await getUserEscrows(address);

    // Get details for each escrow
    const escrowDetails = await Promise.allSettled(
      escrowIds.map(id => getEscrowDetails(id))
    );

    const escrows = escrowDetails
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map((result, index) => ({
        escrowId: escrowIds[index],
        ...result.value,
        stateText: EscrowState[result.value.state]
      }));

    res.json({
      success: true,
      data: {
        address,
        escrows,
        total: escrows.length
      }
    });

  } catch (error) {
    logger.error('Failed to get user rentals', { address: req.params.address, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get user rentals'
    });
  }
};

/**
 * GET /rental/health
 * Health check endpoint for rental service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Try to get a non-existent escrow as a health check
    // This will test the contract connection without side effects
    await getEscrowDetails(999999);
    
    res.json({
      success: true,
      data: {
        service: 'RentalEscrow',
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Expected error for non-existent escrow, but connection works
    if (error instanceof Error && error.message.includes('EscrowNotFound')) {
      res.json({
        success: true,
        data: {
          service: 'RentalEscrow',
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      logger.error('Rental service health check failed', { error });
      res.status(503).json({
        success: false,
        error: 'Service unavailable'
      });
    }
  }
};