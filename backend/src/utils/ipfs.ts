/**
 * IPFS Utility Functions
 * 
 * This module handles uploading files and metadata to IPFS using NFT.Storage.
 * NFT.Storage provides free IPFS storage specifically for NFT metadata and assets.
 * 
 * Features:
 * - Upload JSON metadata to IPFS
 * - Upload images and files to IPFS
 * - Generate proper IPFS URIs
 * - Error handling and retry logic
 */

import { NFTStorage, File } from 'nft.storage';
import { logger } from './logger';

// Initialize NFT.Storage client
const client = new NFTStorage({ 
  token: process.env.NFT_STORAGE_API_KEY || '' 
});

/**
 * Upload JSON metadata to IPFS
 * @param metadata - Metadata object to upload
 * @param filename - Optional filename for the metadata
 * @returns Promise<string> - IPFS URI (ipfs://...)
 */
export const uploadToIPFS = async (metadata: any, filename: string = 'metadata.json'): Promise<string> => {
  try {
    if (!process.env.NFT_STORAGE_API_KEY) {
      throw new Error('NFT_STORAGE_API_KEY is not configured');
    }

    logger.info('Uploading metadata to IPFS', { filename });

    // Convert metadata to JSON string
    const jsonString = JSON.stringify(metadata, null, 2);
    
    // Create File object
    const file = new File([jsonString], filename, { type: 'application/json' });
    
    // Upload to IPFS
    const cid = await client.storeBlob(file);
    const ipfsUri = `ipfs://${cid}`;
    
    logger.info('Metadata uploaded to IPFS successfully', { 
      filename, 
      cid, 
      ipfsUri,
      size: jsonString.length 
    });

    return ipfsUri;

  } catch (error) {
    logger.error('Failed to upload metadata to IPFS', { filename, error });
    throw new Error(`IPFS upload failed: ${error}`);
  }
};

/**
 * Upload image file to IPFS
 * @param imageBuffer - Image file buffer
 * @param filename - Image filename
 * @returns Promise<string> - IPFS URI (ipfs://...)
 */
export const uploadImageToIPFS = async (imageBuffer: Buffer, filename: string): Promise<string> => {
  try {
    if (!process.env.NFT_STORAGE_API_KEY) {
      throw new Error('NFT_STORAGE_API_KEY is not configured');
    }

    logger.info('Uploading image to IPFS', { filename, size: imageBuffer.length });

    // Determine MIME type based on file extension
    const mimeType = getMimeType(filename);
    
    // Create File object
    const file = new File([imageBuffer], filename, { type: mimeType });
    
    // Upload to IPFS
    const cid = await client.storeBlob(file);
    const ipfsUri = `ipfs://${cid}`;
    
    logger.info('Image uploaded to IPFS successfully', { 
      filename, 
      cid, 
      ipfsUri,
      size: imageBuffer.length,
      mimeType
    });

    return ipfsUri;

  } catch (error) {
    logger.error('Failed to upload image to IPFS', { filename, error });
    throw new Error(`Image upload failed: ${error}`);
  }
};

/**
 * Upload multiple files to IPFS as a directory
 * @param files - Array of {name: string, content: Buffer | string}
 * @returns Promise<string> - IPFS directory URI
 */
export const uploadDirectoryToIPFS = async (
  files: Array<{ name: string; content: Buffer | string; type?: string }>
): Promise<string> => {
  try {
    if (!process.env.NFT_STORAGE_API_KEY) {
      throw new Error('NFT_STORAGE_API_KEY is not configured');
    }

    logger.info('Uploading directory to IPFS', { fileCount: files.length });

    // Convert to File objects
    const fileObjects = files.map(file => {
      const content = typeof file.content === 'string' ? file.content : file.content;
      const type = file.type || getMimeType(file.name);
      return new File([content], file.name, { type });
    });

    // Upload directory
    const cid = await client.storeDirectory(fileObjects);
    const ipfsUri = `ipfs://${cid}`;
    
    logger.info('Directory uploaded to IPFS successfully', { 
      fileCount: files.length,
      cid, 
      ipfsUri
    });

    return ipfsUri;

  } catch (error) {
    logger.error('Failed to upload directory to IPFS', { fileCount: files.length, error });
    throw new Error(`Directory upload failed: ${error}`);
  }
};

/**
 * Get file from IPFS
 * @param ipfsUri - IPFS URI (ipfs://... or just the CID)
 * @returns Promise<string> - File content as string
 */
export const getFromIPFS = async (ipfsUri: string): Promise<string> => {
  try {
    // Extract CID from URI
    const cid = ipfsUri.replace('ipfs://', '');
    
    logger.info('Fetching file from IPFS', { cid });

    // Use public IPFS gateway
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    logger.info('File fetched from IPFS successfully', { 
      cid, 
      size: content.length 
    });

    return content;

  } catch (error) {
    logger.error('Failed to fetch file from IPFS', { ipfsUri, error });
    throw new Error(`IPFS fetch failed: ${error}`);
  }
};

/**
 * Get JSON metadata from IPFS
 * @param ipfsUri - IPFS URI
 * @returns Promise<any> - Parsed JSON object
 */
export const getJSONFromIPFS = async (ipfsUri: string): Promise<any> => {
  try {
    const content = await getFromIPFS(ipfsUri);
    return JSON.parse(content);
  } catch (error) {
    logger.error('Failed to parse JSON from IPFS', { ipfsUri, error });
    throw new Error(`JSON parsing failed: ${error}`);
  }
};

/**
 * Convert IPFS URI to HTTP URL using public gateway
 * @param ipfsUri - IPFS URI (ipfs://...)
 * @param gateway - IPFS gateway URL (default: ipfs.io)
 * @returns string - HTTP URL
 */
export const ipfsToHttp = (ipfsUri: string, gateway: string = 'https://ipfs.io'): string => {
  const cid = ipfsUri.replace('ipfs://', '');
  return `${gateway}/ipfs/${cid}`;
};

/**
 * Validate IPFS URI format
 * @param uri - URI to validate
 * @returns boolean - Whether URI is valid IPFS format
 */
export const isValidIPFSUri = (uri: string): boolean => {
  return uri.startsWith('ipfs://') && uri.length > 7;
};

/**
 * Get MIME type based on file extension
 * @param filename - File name with extension
 * @returns string - MIME type
 */
const getMimeType = (filename: string): string => {
  const extension = filename.toLowerCase().split('.').pop();
  
  const mimeTypes: { [key: string]: string } = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'json': 'application/json',
    'txt': 'text/plain',
    'pdf': 'application/pdf'
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
};

/**
 * Check NFT.Storage service status
 * @returns Promise<boolean> - Service availability
 */
export const checkIPFSService = async (): Promise<boolean> => {
  try {
    if (!process.env.NFT_STORAGE_API_KEY) {
      logger.warn('NFT.Storage API key not configured');
      return false;
    }

    // Try to upload a small test file
    const testData = { test: true, timestamp: Date.now() };
    await uploadToIPFS(testData, 'health-check.json');
    
    logger.info('IPFS service is healthy');
    return true;

  } catch (error) {
    logger.error('IPFS service health check failed', { error });
    return false;
  }
};

/**
 * Get storage usage statistics (if supported by provider)
 * @returns Promise<{used: number, limit: number} | null>
 */
export const getStorageStats = async (): Promise<{ used: number; limit: number } | null> => {
  try {
    // NFT.Storage doesn't provide usage stats via API
    // This is a placeholder for future implementation
    logger.info('Storage stats not available for NFT.Storage');
    return null;

  } catch (error) {
    logger.error('Failed to get storage stats', { error });
    return null;
  }
};