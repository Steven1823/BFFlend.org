/**
 * Auth Routes
 * 
 * Defines all routes related to authentication:
 * - Wallet signature verification
 * - Nonce generation
 * - Authentication status
 * - Session management
 */

import { Router } from 'express';
import {
  verifySignature,
  getNonce,
  getAuthStatus,
  logout,
  healthCheck
} from '../controllers/auth.controller';

const router = Router();

/**
 * POST /auth/verify-signature
 * Verify wallet signature for authentication
 * Body: { address, message, signature }
 */
router.post('/verify-signature', verifySignature);

/**
 * GET /auth/nonce/:address
 * Generate a nonce for wallet signature
 * This creates a unique message that the user must sign
 */
router.get('/nonce/:address', getNonce);

/**
 * GET /auth/status/:address
 * Get authentication status for an address
 */
router.get('/status/:address', getAuthStatus);

/**
 * POST /auth/logout
 * Logout user (clear session if using sessions)
 * Body: { address }
 */
router.post('/logout', logout);

/**
 * GET /auth/health
 * Health check endpoint for auth service
 */
router.get('/health', healthCheck);

export default router;