/**
 * Item Controller
 * 
 * Handles HTTP requests related to item operations:
 * - Upload item metadata and images to IPFS
 * - Register items (create metadata)
 * - Get item information
 * - Search and filter items
 */

import { Request, Response } from 'express';
import multer from 'multer';
import {
  createItemMetadata,
  updateItemMetadata,
  getItemMetadata,
  validateItemData,
  getItemCategories,
  getItemConditions,
  searchItems
} from '../services/item.service';
import { isUserVerified } from '../services/sbt.service';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation schemas
const addressSchema = Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required();
const ethAmountSchema = Joi.string().pattern(/^\d+(\.\d{1,18})?$/).required();

const createItemSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(1).max(1000).required(),
  category: Joi.string().valid(...getItemCategories()).required(),
  condition: Joi.string().valid(...getItemConditions()).required(),
  location: Joi.string().min(1).max(100).required(),
  pricePerDay: ethAmountSchema,
  securityDeposit: ethAmountSchema,
  ownerAddress: addressSchema
});

/**
 * POST /item/upload
 * Upload item metadata and images to IPFS
 * Multipart form data with image file and item details
 */
export const uploadItem = async (req: Request, res: Response) => {
  try {
    // Handle file upload
    upload.single('image')(req, res, async (err) => {
      if (err) {
        logger.error('File upload error', { error: err.message });
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      try {
        // Validate request body
        const { error, value } = createItemSchema.validate(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            error: error.details[0].message
          });
        }

        const { name, description, category, condition, location, pricePerDay, securityDeposit, ownerAddress } = value;

        logger.info('Uploading item', {
          name,
          category,
          location,
          owner: ownerAddress,
          hasImage: !!req.file
        });

        // Verify owner is KYC verified
        const ownerVerified = await isUserVerified(ownerAddress);
        if (!ownerVerified.isVerified) {
          return res.status(403).json({
            success: false,
            error: 'Owner is not verified. Please complete KYC verification.'
          });
        }

        // Validate item data
        const validation = validateItemData({
          name,
          description,
          category,
          condition,
          location,
          pricePerDay,
          securityDeposit,
          ownerAddress,
          imageFile: req.file?.buffer,
          imageFileName: req.file?.originalname
        });

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: validation.errors.join(', ')
          });
        }

        // Create and upload metadata
        const result = await createItemMetadata({
          name,
          description,
          category,
          condition,
          location,
          pricePerDay,
          securityDeposit,
          ownerAddress,
          imageFile: req.file?.buffer,
          imageFileName: req.file?.originalname
        });

        if (result.success) {
          res.status(201).json({
            success: true,
            data: {
              name,
              metadataUri: result.metadataUri,
              imageUri: result.imageUri,
              owner: ownerAddress,
              category,
              condition,
              location,
              pricePerDay,
              securityDeposit
            },
            message: 'Item uploaded successfully'
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error
          });
        }

      } catch (error) {
        logger.error('Failed to upload item', { body: req.body, error });
        res.status(500).json({
          success: false,
          error: 'Failed to upload item'
        });
      }
    });

  } catch (error) {
    logger.error('Upload item error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /item/register
 * Register item metadata without file upload (metadata only)
 * Body: { name, description, category, condition, location, pricePerDay, securityDeposit, ownerAddress }
 */
export const registerItem = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = createItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { name, description, category, condition, location, pricePerDay, securityDeposit, ownerAddress } = value;

    logger.info('Registering item', {
      name,
      category,
      location,
      owner: ownerAddress
    });

    // Verify owner is KYC verified
    const ownerVerified = await isUserVerified(ownerAddress);
    if (!ownerVerified.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Owner is not verified. Please complete KYC verification.'
      });
    }

    // Validate item data
    const validation = validateItemData({
      name,
      description,
      category,
      condition,
      location,
      pricePerDay,
      securityDeposit,
      ownerAddress
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    // Create and upload metadata
    const result = await createItemMetadata({
      name,
      description,
      category,
      condition,
      location,
      pricePerDay,
      securityDeposit,
      ownerAddress
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          name,
          metadataUri: result.metadataUri,
          owner: ownerAddress,
          category,
          condition,
          location,
          pricePerDay,
          securityDeposit
        },
        message: 'Item registered successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to register item', { body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to register item'
    });
  }
};

/**
 * GET /item/metadata/:uri
 * Get item metadata from IPFS URI
 */
export const getItemMetadataByUri = async (req: Request, res: Response) => {
  try {
    const { uri } = req.params;

    // Decode URI parameter
    const metadataUri = decodeURIComponent(uri);

    logger.info('Getting item metadata', { metadataUri });

    // Validate IPFS URI format
    if (!metadataUri.startsWith('ipfs://')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IPFS URI format'
      });
    }

    const metadata = await getItemMetadata(metadataUri);

    if (metadata) {
      res.json({
        success: true,
        data: metadata
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Metadata not found'
      });
    }

  } catch (error) {
    logger.error('Failed to get item metadata', { uri: req.params.uri, error });
    res.status(500).json({
      success: false,
      error: 'Failed to get item metadata'
    });
  }
};

/**
 * GET /item/categories
 * Get available item categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = getItemCategories();

    res.json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    logger.error('Failed to get categories', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
};

/**
 * GET /item/conditions
 * Get available item conditions
 */
export const getConditions = async (req: Request, res: Response) => {
  try {
    const conditions = getItemConditions();

    res.json({
      success: true,
      data: {
        conditions
      }
    });

  } catch (error) {
    logger.error('Failed to get conditions', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get conditions'
    });
  }
};

/**
 * GET /item/search
 * Search items by criteria
 * Query params: category, location, maxPrice, condition, query
 */
export const searchItemsEndpoint = async (req: Request, res: Response) => {
  try {
    const { category, location, maxPrice, condition, query } = req.query;

    logger.info('Searching items', { 
      category, 
      location, 
      maxPrice, 
      condition, 
      query 
    });

    // Validate query parameters
    const searchCriteria: any = {};

    if (category && typeof category === 'string') {
      if (!getItemCategories().includes(category)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category'
        });
      }
      searchCriteria.category = category;
    }

    if (location && typeof location === 'string') {
      searchCriteria.location = location;
    }

    if (maxPrice && typeof maxPrice === 'string') {
      // Validate price format
      if (!/^\d+(\.\d{1,18})?$/.test(maxPrice)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price format'
        });
      }
      searchCriteria.maxPrice = maxPrice;
    }

    if (condition && typeof condition === 'string') {
      if (!getItemConditions().includes(condition)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid condition'
        });
      }
      searchCriteria.condition = condition;
    }

    if (query && typeof query === 'string') {
      searchCriteria.query = query;
    }

    const items = await searchItems(searchCriteria);

    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        criteria: searchCriteria
      }
    });

  } catch (error) {
    logger.error('Failed to search items', { query: req.query, error });
    res.status(500).json({
      success: false,
      error: 'Failed to search items'
    });
  }
};

/**
 * PUT /item/update/:uri
 * Update item metadata
 * Body: Partial item data to update
 */
export const updateItem = async (req: Request, res: Response) => {
  try {
    const { uri } = req.params;
    const metadataUri = decodeURIComponent(uri);

    logger.info('Updating item metadata', { metadataUri });

    // Validate IPFS URI format
    if (!metadataUri.startsWith('ipfs://')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IPFS URI format'
      });
    }

    // Validate update data (partial validation)
    const updateSchema = Joi.object({
      name: Joi.string().min(1).max(100),
      description: Joi.string().min(1).max(1000),
      category: Joi.string().valid(...getItemCategories()),
      condition: Joi.string().valid(...getItemConditions()),
      location: Joi.string().min(1).max(100),
      pricePerDay: ethAmountSchema,
      securityDeposit: ethAmountSchema,
      ownerAddress: addressSchema
    }).min(1); // At least one field must be provided

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // If owner address is provided, verify they are KYC verified
    if (value.ownerAddress) {
      const ownerVerified = await isUserVerified(value.ownerAddress);
      if (!ownerVerified.isVerified) {
        return res.status(403).json({
          success: false,
          error: 'Owner is not verified'
        });
      }
    }

    const result = await updateItemMetadata(metadataUri, value);

    if (result.success) {
      res.json({
        success: true,
        data: {
          oldUri: metadataUri,
          newUri: result.metadataUri,
          imageUri: result.imageUri
        },
        message: 'Item updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Failed to update item', { uri: req.params.uri, body: req.body, error });
    res.status(500).json({
      success: false,
      error: 'Failed to update item'
    });
  }
};

/**
 * GET /item/health
 * Health check endpoint for item service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Test basic functionality
    const categories = getItemCategories();
    const conditions = getItemConditions();
    
    res.json({
      success: true,
      data: {
        service: 'ItemService',
        status: 'healthy',
        availableCategories: categories.length,
        availableConditions: conditions.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Item service health check failed', { error });
    res.status(503).json({
      success: false,
      error: 'Service unavailable'
    });
  }
};