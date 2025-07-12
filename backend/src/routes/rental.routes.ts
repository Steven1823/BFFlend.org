/**
 * Rental Routes
 * 
 * Defines all routes related to rental escrow operations:
 * - Creating escrow agreements
 * - Making deposits
 * - Activating rentals
 * - Releasing payments
 * - Handling disputes
 * - Getting escrow information
 */

import { Router } from 'express';
import {
  createRentalEscrow,
  makeRentalDeposit,
  activateRentalAgreement,
  releasePayment,
  raiseRentalDispute,
  getEscrow,
  getUserRentals,
  healthCheck
} from '../controllers/rental.controller';

const router = Router();

/**
 * POST /rental/create
 * Create a new escrow agreement
 * Body: { borrowerAddress, lenderAddress, rentalAmount, securityDeposit, durationHours, itemDescription }
 */
router.post('/create', createRentalEscrow);

/**
 * POST /rental/deposit
 * Make a deposit to an escrow (borrower pays rental + security deposit)
 * Body: { borrowerAddress, escrowId }
 */
router.post('/deposit', makeRentalDeposit);

/**
 * POST /rental/activate
 * Activate rental (lender confirms item handover)
 * Body: { lenderAddress, escrowId }
 */
router.post('/activate', activateRentalAgreement);

/**
 * POST /rental/release
 * Release payment to lender (after rental completion)
 * Body: { lenderAddress, escrowId }
 */
router.post('/release', releasePayment);

/**
 * POST /rental/dispute
 * Raise a dispute for an escrow
 * Body: { userAddress, escrowId, reason }
 */
router.post('/dispute', raiseRentalDispute);

/**
 * GET /rental/:escrowId
 * Get escrow details by ID
 */
router.get('/:escrowId', getEscrow);

/**
 * GET /rental/user/:address
 * Get all escrows for a user
 */
router.get('/user/:address', getUserRentals);

/**
 * GET /rental/health
 * Health check endpoint for rental service
 */
router.get('/health', healthCheck);

export default router;