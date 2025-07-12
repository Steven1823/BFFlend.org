/**
 * Item Routes
 * 
 * Defines all routes related to item operations:
 * - Uploading items with images
 * - Registering item metadata
 * - Getting item information
 * - Searching and filtering items
 * - Managing item categories and conditions
 */

import { Router } from 'express';
import {
  uploadItem,
  registerItem,
  getItemMetadataByUri,
  getCategories,
  getConditions,
  searchItemsEndpoint,
  updateItem,
  healthCheck
} from '../controllers/item.controller';

const router = Router();

/**
 * POST /item/upload
 * Upload item metadata and images to IPFS
 * Multipart form data with image file and item details
 */
router.post('/upload', uploadItem);

/**
 * POST /item/register
 * Register item metadata without file upload (metadata only)
 * Body: { name, description, category, condition, location, pricePerDay, securityDeposit, ownerAddress }
 */
router.post('/register', registerItem);

/**
 * GET /item/metadata/:uri
 * Get item metadata from IPFS URI
 * URI should be URL encoded
 */
router.get('/metadata/:uri', getItemMetadataByUri);

/**
 * GET /item/categories
 * Get available item categories
 */
router.get('/categories', getCategories);

/**
 * GET /item/conditions
 * Get available item conditions
 */
router.get('/conditions', getConditions);

/**
 * GET /item/search
 * Search items by criteria
 * Query params: category, location, maxPrice, condition, query
 */
router.get('/search', searchItemsEndpoint);

/**
 * PUT /item/update/:uri
 * Update item metadata
 * URI should be URL encoded
 * Body: Partial item data to update
 */
router.put('/update/:uri', updateItem);

/**
 * GET /item/health
 * Health check endpoint for item service
 */
router.get('/health', healthCheck);

export default router;