/**
 * SoulboundToken Routes
 * 
 * Defines all routes related to SoulboundToken operations:
 * - Verification status checking
 * - Token minting (admin only)
 * - Verification revocation
 * - Statistics and health checks
 */

import { Router } from 'express';
import {
  checkVerificationStatus,
  mintToken,
  revokeVerification,
  getVerificationStats,
  getTokenId,
  batchCheckVerification,
  healthCheck
} from '../controllers/sbt.controller';

const router = Router();

/**
 * GET /sbt/:address/is-verified
 * Check if a user address is verified (has SBT)
 */
router.get('/:address/is-verified', checkVerificationStatus);

/**
 * POST /sbt/mint
 * Mint a new SoulboundToken to verify a user (admin only)
 * Body: { address: string }
 */
router.post('/mint', mintToken);

/**
 * POST /sbt/revoke
 * Revoke user verification by burning their SBT (admin only)
 * Body: { address: string }
 */
router.post('/revoke', revokeVerification);

/**
 * GET /sbt/stats
 * Get verification statistics
 */
router.get('/stats', getVerificationStats);

/**
 * GET /sbt/:address/token-id
 * Get user's token ID if verified
 */
router.get('/:address/token-id', getTokenId);

/**
 * POST /sbt/batch-check
 * Check verification status for multiple addresses
 * Body: { addresses: string[] }
 */
router.post('/batch-check', batchCheckVerification);

/**
 * GET /sbt/health
 * Health check endpoint for SBT service
 */
router.get('/health', healthCheck);

export default router;