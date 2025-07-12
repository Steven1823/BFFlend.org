/**
 * Item Service
 * 
 * This service handles item-related operations including:
 * - IPFS metadata upload
 * - Item registration and management
 * - Image processing and storage
 * - Integration with ItemNFT contract (if needed)
 */

import { ethers } from 'ethers';
import { uploadToIPFS, uploadImageToIPFS } from '../utils/ipfs';
import { logger } from '../utils/logger';

export interface ItemMetadata {
  name: string;
  description: string;
  image: string;
  attributes: ItemAttribute[];
  category: string;
  condition: string;
  location: string;
  pricePerDay: string;
  securityDeposit: string;
  owner: string;
}

export interface ItemAttribute {
  trait_type: string;
  value: string | number;
}

export interface CreateItemParams {
  name: string;
  description: string;
  category: string;
  condition: string;
  location: string;
  pricePerDay: string; // in ETH
  securityDeposit: string; // in ETH
  ownerAddress: string;
  imageFile?: Buffer;
  imageFileName?: string;
}

export interface CreateItemResult {
  success: boolean;
  metadataUri?: string;
  imageUri?: string;
  error?: string;
}

/**
 * Create and upload item metadata to IPFS
 * @param params - Item creation parameters
 * @returns Promise<CreateItemResult>
 */
export const createItemMetadata = async (params: CreateItemParams): Promise<CreateItemResult> => {
  try {
    logger.info('Creating item metadata', {
      name: params.name,
      category: params.category,
      location: params.location,
      owner: params.ownerAddress
    });

    // Validate required fields
    if (!params.name || !params.description || !params.category) {
      return {
        success: false,
        error: 'Missing required fields: name, description, or category'
      };
    }

    // Validate address
    if (!ethers.isAddress(params.ownerAddress)) {
      return {
        success: false,
        error: 'Invalid owner address'
      };
    }

    // Validate price values
    try {
      ethers.parseEther(params.pricePerDay);
      ethers.parseEther(params.securityDeposit);
    } catch {
      return {
        success: false,
        error: 'Invalid price or security deposit format'
      };
    }

    let imageUri = '';

    // Upload image to IPFS if provided
    if (params.imageFile && params.imageFileName) {
      try {
        imageUri = await uploadImageToIPFS(params.imageFile, params.imageFileName);
        logger.info('Image uploaded to IPFS', { imageUri });
      } catch (error) {
        logger.warn('Failed to upload image to IPFS', { error });
        // Continue without image - not critical
      }
    }

    // Create metadata object
    const metadata: ItemMetadata = {
      name: params.name,
      description: params.description,
      image: imageUri,
      attributes: [
        {
          trait_type: 'Category',
          value: params.category
        },
        {
          trait_type: 'Condition',
          value: params.condition
        },
        {
          trait_type: 'Location',
          value: params.location
        },
        {
          trait_type: 'Price Per Day (ETH)',
          value: params.pricePerDay
        },
        {
          trait_type: 'Security Deposit (ETH)',
          value: params.securityDeposit
        },
        {
          trait_type: 'Created At',
          value: new Date().toISOString()
        }
      ],
      category: params.category,
      condition: params.condition,
      location: params.location,
      pricePerDay: params.pricePerDay,
      securityDeposit: params.securityDeposit,
      owner: params.ownerAddress
    };

    // Upload metadata to IPFS
    const metadataUri = await uploadToIPFS(metadata, `${params.name}-metadata.json`);
    
    logger.info('Item metadata created and uploaded', {
      name: params.name,
      metadataUri,
      imageUri
    });

    return {
      success: true,
      metadataUri,
      imageUri
    };

  } catch (error) {
    logger.error('Failed to create item metadata', { params, error });
    return {
      success: false,
      error: 'Failed to create and upload metadata'
    };
  }
};

/**
 * Update item metadata
 * @param existingMetadataUri - Current metadata URI
 * @param updates - Fields to update
 * @returns Promise<CreateItemResult>
 */
export const updateItemMetadata = async (
  existingMetadataUri: string,
  updates: Partial<CreateItemParams>
): Promise<CreateItemResult> => {
  try {
    logger.info('Updating item metadata', { existingMetadataUri, updates });

    // TODO: Fetch existing metadata from IPFS
    // For now, we'll create new metadata with updates
    // In production, you'd want to fetch the existing metadata first

    if (!updates.name || !updates.description) {
      return {
        success: false,
        error: 'Name and description are required for updates'
      };
    }

    // Create updated metadata
    const result = await createItemMetadata(updates as CreateItemParams);
    
    if (result.success) {
      logger.info('Item metadata updated successfully', {
        oldUri: existingMetadataUri,
        newUri: result.metadataUri
      });
    }

    return result;

  } catch (error) {
    logger.error('Failed to update item metadata', { existingMetadataUri, updates, error });
    return {
      success: false,
      error: 'Failed to update metadata'
    };
  }
};

/**
 * Get item metadata from IPFS
 * @param metadataUri - IPFS URI of the metadata
 * @returns Promise<ItemMetadata | null>
 */
export const getItemMetadata = async (metadataUri: string): Promise<ItemMetadata | null> => {
  try {
    // Extract IPFS hash from URI
    const ipfsHash = metadataUri.replace('ipfs://', '');
    const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata as ItemMetadata;

  } catch (error) {
    logger.error('Failed to get item metadata', { metadataUri, error });
    return null;
  }
};

/**
 * Validate item data before creation
 * @param params - Item parameters to validate
 * @returns {isValid: boolean, errors: string[]}
 */
export const validateItemData = (params: CreateItemParams) => {
  const errors: string[] = [];

  // Required fields
  if (!params.name || params.name.trim().length === 0) {
    errors.push('Item name is required');
  }

  if (!params.description || params.description.trim().length === 0) {
    errors.push('Item description is required');
  }

  if (!params.category) {
    errors.push('Item category is required');
  }

  if (!params.condition) {
    errors.push('Item condition is required');
  }

  if (!params.location || params.location.trim().length === 0) {
    errors.push('Item location is required');
  }

  if (!params.ownerAddress || !ethers.isAddress(params.ownerAddress)) {
    errors.push('Valid owner address is required');
  }

  // Validate price values
  try {
    const priceWei = ethers.parseEther(params.pricePerDay);
    if (priceWei <= 0) {
      errors.push('Price per day must be greater than 0');
    }
  } catch {
    errors.push('Invalid price per day format');
  }

  try {
    const depositWei = ethers.parseEther(params.securityDeposit);
    if (depositWei < 0) {
      errors.push('Security deposit cannot be negative');
    }
  } catch {
    errors.push('Invalid security deposit format');
  }

  // Validate text lengths
  if (params.name.length > 100) {
    errors.push('Item name must be 100 characters or less');
  }

  if (params.description.length > 1000) {
    errors.push('Item description must be 1000 characters or less');
  }

  if (params.location.length > 100) {
    errors.push('Location must be 100 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get available item categories
 * @returns string[]
 */
export const getItemCategories = (): string[] => {
  return [
    'Electronics',
    'Vehicles',
    'Tools',
    'Furniture',
    'Sports',
    'Books',
    'Clothing',
    'Other'
  ];
};

/**
 * Get available item conditions
 * @returns string[]
 */
export const getItemConditions = (): string[] => {
  return [
    'New',
    'Excellent',
    'Good',
    'Fair',
    'Poor'
  ];
};

/**
 * Search items by criteria (mock implementation)
 * In production, this would query a database or search service
 * @param criteria - Search criteria
 * @returns Promise<ItemMetadata[]>
 */
export const searchItems = async (criteria: {
  category?: string;
  location?: string;
  maxPrice?: string;
  condition?: string;
  query?: string;
}): Promise<ItemMetadata[]> => {
  try {
    logger.info('Searching items', { criteria });

    // TODO: Implement actual search logic
    // This would typically query a database or search index
    // For now, return empty array

    return [];

  } catch (error) {
    logger.error('Failed to search items', { criteria, error });
    throw new Error('Failed to search items');
  }
};