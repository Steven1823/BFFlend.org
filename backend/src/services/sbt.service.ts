/**
 * SoulboundToken Service
 * 
 * This service handles all interactions with the SoulboundToken smart contract.
 * The SBT is used for KYC verification and identity management on the platform.
 * 
 * Key Functions:
 * - Check if user is verified
 * - Mint new identity tokens (admin only)
 * - Revoke user verification
 * - Get user statistics
 */

import { ethers } from 'ethers';
import { soulboundTokenContract, estimateGas, getOptimalGasPrice, waitForTransaction } from './web3';
import { logger } from '../utils/logger';

export interface VerificationStatus {
  isVerified: boolean;
  tokenId?: number;
  verifiedAt?: Date;
}

export interface MintResult {
  success: boolean;
  tokenId?: number;
  transactionHash?: string;
  error?: string;
}

/**
 * Check if a user address is verified (has SBT)
 * @param userAddress - User's wallet address
 * @returns Promise<VerificationStatus>
 */
export const isUserVerified = async (userAddress: string): Promise<VerificationStatus> => {
  try {
    // Validate address format
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    logger.info('Checking user verification status', { userAddress });

    // Call the smart contract
    const isVerified = await soulboundTokenContract.isVerified(userAddress);
    
    let tokenId: number | undefined;
    if (isVerified) {
      tokenId = await soulboundTokenContract.getTokenId(userAddress);
    }

    const result: VerificationStatus = {
      isVerified,
      tokenId: tokenId ? Number(tokenId) : undefined
    };

    logger.info('User verification status retrieved', { 
      userAddress, 
      isVerified, 
      tokenId 
    });

    return result;
  } catch (error) {
    logger.error('Failed to check user verification', { userAddress, error });
    throw new Error(`Failed to check verification status: ${error}`);
  }
};

/**
 * Mint a new SoulboundToken to verify a user (admin only)
 * @param userAddress - Address to mint token to
 * @returns Promise<MintResult>
 */
export const mintSoulboundToken = async (userAddress: string): Promise<MintResult> => {
  try {
    // Validate address
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    logger.info('Minting SoulboundToken', { userAddress });

    // Check if user is already verified
    const verificationStatus = await isUserVerified(userAddress);
    if (verificationStatus.isVerified) {
      return {
        success: false,
        error: 'User is already verified'
      };
    }

    // Estimate gas and get gas price
    const gasLimit = await estimateGas(soulboundTokenContract, 'mintTo', [userAddress]);
    const gasPrice = await getOptimalGasPrice();

    // Execute the mint transaction
    const tx = await soulboundTokenContract.mintTo(userAddress, {
      gasLimit,
      gasPrice
    });

    logger.info('SoulboundToken mint transaction sent', { 
      userAddress, 
      txHash: tx.hash,
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString()
    });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    // Extract token ID from events
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = soulboundTokenContract.interface.parseLog(log);
        return parsed?.name === 'UserVerified';
      } catch {
        return false;
      }
    });

    let tokenId: number | undefined;
    if (mintEvent) {
      const parsed = soulboundTokenContract.interface.parseLog(mintEvent);
      tokenId = Number(parsed?.args.tokenId);
    }

    logger.info('SoulboundToken minted successfully', { 
      userAddress, 
      tokenId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      success: true,
      tokenId,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to mint SoulboundToken', { userAddress, error });
    
    // Parse contract errors
    let errorMessage = 'Failed to mint token';
    if (error instanceof Error) {
      if (error.message.includes('UserAlreadyVerified')) {
        errorMessage = 'User is already verified';
      } else if (error.message.includes('InvalidAddress')) {
        errorMessage = 'Invalid address provided';
      } else if (error.message.includes('Ownable: caller is not the owner')) {
        errorMessage = 'Unauthorized: Only admin can mint tokens';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Revoke user verification by burning their SBT (admin only)
 * @param userAddress - Address to revoke verification from
 * @returns Promise<{success: boolean, transactionHash?: string, error?: string}>
 */
export const revokeUserVerification = async (userAddress: string) => {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    logger.info('Revoking user verification', { userAddress });

    // Check if user is verified
    const verificationStatus = await isUserVerified(userAddress);
    if (!verificationStatus.isVerified) {
      return {
        success: false,
        error: 'User is not verified'
      };
    }

    // Estimate gas
    const gasLimit = await estimateGas(soulboundTokenContract, 'revokeVerification', [userAddress]);
    const gasPrice = await getOptimalGasPrice();

    // Execute revocation
    const tx = await soulboundTokenContract.revokeVerification(userAddress, {
      gasLimit,
      gasPrice
    });

    logger.info('Revocation transaction sent', { userAddress, txHash: tx.hash });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    logger.info('User verification revoked successfully', { 
      userAddress, 
      txHash: tx.hash 
    });

    return {
      success: true,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to revoke user verification', { userAddress, error });
    
    let errorMessage = 'Failed to revoke verification';
    if (error instanceof Error) {
      if (error.message.includes('UserNotVerified')) {
        errorMessage = 'User is not verified';
      } else if (error.message.includes('Ownable: caller is not the owner')) {
        errorMessage = 'Unauthorized: Only admin can revoke verification';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get total number of verified users
 * @returns Promise<number>
 */
export const getTotalVerifiedUsers = async (): Promise<number> => {
  try {
    const total = await soulboundTokenContract.totalVerifiedUsers();
    return Number(total);
  } catch (error) {
    logger.error('Failed to get total verified users', { error });
    throw new Error('Failed to retrieve user statistics');
  }
};

/**
 * Get user's token ID if verified
 * @param userAddress - User's wallet address
 * @returns Promise<number | null>
 */
export const getUserTokenId = async (userAddress: string): Promise<number | null> => {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    const isVerified = await soulboundTokenContract.isVerified(userAddress);
    if (!isVerified) {
      return null;
    }

    const tokenId = await soulboundTokenContract.getTokenId(userAddress);
    return Number(tokenId);
  } catch (error) {
    logger.error('Failed to get user token ID', { userAddress, error });
    throw new Error('Failed to retrieve token ID');
  }
};

/**
 * Batch check verification status for multiple addresses
 * @param addresses - Array of wallet addresses
 * @returns Promise<{address: string, isVerified: boolean, tokenId?: number}[]>
 */
export const batchCheckVerification = async (addresses: string[]) => {
  try {
    const results = await Promise.allSettled(
      addresses.map(async (address) => {
        const status = await isUserVerified(address);
        return {
          address,
          isVerified: status.isVerified,
          tokenId: status.tokenId
        };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.warn('Failed to check verification for address', { 
          address: addresses[index], 
          error: result.reason 
        });
        return {
          address: addresses[index],
          isVerified: false,
          error: 'Failed to check verification'
        };
      }
    });
  } catch (error) {
    logger.error('Batch verification check failed', { error });
    throw new Error('Failed to perform batch verification check');
  }
};