/**
 * Rental Escrow Service
 * 
 * This service handles all interactions with the RentalEscrow smart contract.
 * It manages the secure escrow process for rental payments, deposits, and releases.
 * 
 * Key Functions:
 * - Create escrow agreements
 * - Handle deposits from borrowers
 * - Release payments to lenders
 * - Manage dispute resolution
 * - Track escrow states
 */

import { ethers } from 'ethers';
import { rentalEscrowContract, estimateGas, getOptimalGasPrice, waitForTransaction } from './web3';
import { isUserVerified } from './sbt.service';
import { logger } from '../utils/logger';

export interface EscrowAgreement {
  borrower: string;
  lender: string;
  rentalAmount: string;
  securityDeposit: string;
  startTime: number;
  endTime: number;
  createdAt: number;
  state: EscrowState;
  itemDescription: string;
  lenderConfirmed: boolean;
  borrowerConfirmed: boolean;
}

export enum EscrowState {
  Created = 0,
  Deposited = 1,
  Active = 2,
  Completed = 3,
  Disputed = 4,
  Refunded = 5,
  Cancelled = 6
}

export interface CreateEscrowParams {
  lenderAddress: string;
  rentalAmount: string; // in ETH
  securityDeposit: string; // in ETH
  durationHours: number;
  itemDescription: string;
}

export interface CreateEscrowResult {
  success: boolean;
  escrowId?: number;
  transactionHash?: string;
  error?: string;
}

/**
 * Create a new escrow agreement
 * @param borrowerAddress - Address of the borrower
 * @param params - Escrow parameters
 * @returns Promise<CreateEscrowResult>
 */
export const createEscrow = async (
  borrowerAddress: string,
  params: CreateEscrowParams
): Promise<CreateEscrowResult> => {
  try {
    // Validate addresses
    if (!ethers.isAddress(borrowerAddress) || !ethers.isAddress(params.lenderAddress)) {
      throw new Error('Invalid address format');
    }

    // Check if both parties are verified
    const [borrowerVerified, lenderVerified] = await Promise.all([
      isUserVerified(borrowerAddress),
      isUserVerified(params.lenderAddress)
    ]);

    if (!borrowerVerified.isVerified) {
      return { success: false, error: 'Borrower is not verified' };
    }

    if (!lenderVerified.isVerified) {
      return { success: false, error: 'Lender is not verified' };
    }

    // Validate parameters
    if (params.durationHours < 1 || params.durationHours > 8760) { // 1 hour to 1 year
      return { success: false, error: 'Invalid rental duration' };
    }

    if (!params.itemDescription || params.itemDescription.length === 0) {
      return { success: false, error: 'Item description is required' };
    }

    logger.info('Creating escrow agreement', {
      borrower: borrowerAddress,
      lender: params.lenderAddress,
      rentalAmount: params.rentalAmount,
      securityDeposit: params.securityDeposit,
      duration: params.durationHours
    });

    // Convert amounts to wei
    const rentalAmountWei = ethers.parseEther(params.rentalAmount);
    const securityDepositWei = ethers.parseEther(params.securityDeposit);
    const durationSeconds = params.durationHours * 3600;

    // Estimate gas
    const gasLimit = await estimateGas(rentalEscrowContract, 'createEscrow', [
      params.lenderAddress,
      rentalAmountWei,
      securityDepositWei,
      durationSeconds,
      params.itemDescription
    ]);
    const gasPrice = await getOptimalGasPrice();

    // Create the escrow
    const tx = await rentalEscrowContract.createEscrow(
      params.lenderAddress,
      rentalAmountWei,
      securityDepositWei,
      durationSeconds,
      params.itemDescription,
      { gasLimit, gasPrice }
    );

    logger.info('Escrow creation transaction sent', { txHash: tx.hash });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    // Extract escrow ID from events
    const createEvent = receipt.logs.find(log => {
      try {
        const parsed = rentalEscrowContract.interface.parseLog(log);
        return parsed?.name === 'EscrowCreated';
      } catch {
        return false;
      }
    });

    let escrowId: number | undefined;
    if (createEvent) {
      const parsed = rentalEscrowContract.interface.parseLog(createEvent);
      escrowId = Number(parsed?.args.escrowId);
    }

    logger.info('Escrow created successfully', {
      escrowId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      success: true,
      escrowId,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to create escrow', { borrowerAddress, params, error });
    
    let errorMessage = 'Failed to create escrow';
    if (error instanceof Error) {
      if (error.message.includes('UnauthorizedAccess')) {
        errorMessage = 'User is not verified';
      } else if (error.message.includes('InvalidRentalDuration')) {
        errorMessage = 'Invalid rental duration';
      } else if (error.message.includes('InvalidAmount')) {
        errorMessage = 'Invalid rental amount or security deposit';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Make a deposit to an escrow (borrower pays rental + security deposit)
 * @param borrowerAddress - Address of the borrower
 * @param escrowId - ID of the escrow
 * @returns Promise<{success: boolean, transactionHash?: string, error?: string}>
 */
export const makeDeposit = async (borrowerAddress: string, escrowId: number) => {
  try {
    logger.info('Making escrow deposit', { borrowerAddress, escrowId });

    // Get escrow details to calculate total amount
    const escrow = await getEscrowDetails(escrowId);
    if (!escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // Verify borrower
    if (escrow.borrower.toLowerCase() !== borrowerAddress.toLowerCase()) {
      return { success: false, error: 'Unauthorized: Not the borrower' };
    }

    // Check escrow state
    if (escrow.state !== EscrowState.Created) {
      return { success: false, error: 'Escrow is not in created state' };
    }

    // Calculate total deposit amount
    const rentalAmountWei = ethers.parseEther(escrow.rentalAmount);
    const securityDepositWei = ethers.parseEther(escrow.securityDeposit);
    const totalAmount = rentalAmountWei + securityDepositWei;

    // Estimate gas
    const gasLimit = await estimateGas(rentalEscrowContract, 'deposit', [escrowId]);
    const gasPrice = await getOptimalGasPrice();

    // Make the deposit
    const tx = await rentalEscrowContract.deposit(escrowId, {
      value: totalAmount,
      gasLimit,
      gasPrice
    });

    logger.info('Deposit transaction sent', { 
      escrowId, 
      txHash: tx.hash,
      totalAmount: ethers.formatEther(totalAmount)
    });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    logger.info('Deposit made successfully', {
      escrowId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      success: true,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to make deposit', { borrowerAddress, escrowId, error });
    
    let errorMessage = 'Failed to make deposit';
    if (error instanceof Error) {
      if (error.message.includes('UnauthorizedAccess')) {
        errorMessage = 'Unauthorized access';
      } else if (error.message.includes('InvalidEscrowState')) {
        errorMessage = 'Invalid escrow state';
      } else if (error.message.includes('InsufficientDeposit')) {
        errorMessage = 'Insufficient deposit amount';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Activate rental (lender confirms item handover)
 * @param lenderAddress - Address of the lender
 * @param escrowId - ID of the escrow
 * @returns Promise<{success: boolean, transactionHash?: string, error?: string}>
 */
export const activateRental = async (lenderAddress: string, escrowId: number) => {
  try {
    logger.info('Activating rental', { lenderAddress, escrowId });

    // Get escrow details
    const escrow = await getEscrowDetails(escrowId);
    if (!escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // Verify lender
    if (escrow.lender.toLowerCase() !== lenderAddress.toLowerCase()) {
      return { success: false, error: 'Unauthorized: Not the lender' };
    }

    // Check escrow state
    if (escrow.state !== EscrowState.Deposited) {
      return { success: false, error: 'Escrow is not in deposited state' };
    }

    // Estimate gas
    const gasLimit = await estimateGas(rentalEscrowContract, 'activateRental', [escrowId]);
    const gasPrice = await getOptimalGasPrice();

    // Activate rental
    const tx = await rentalEscrowContract.activateRental(escrowId, {
      gasLimit,
      gasPrice
    });

    logger.info('Rental activation transaction sent', { escrowId, txHash: tx.hash });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    logger.info('Rental activated successfully', {
      escrowId,
      txHash: tx.hash
    });

    return {
      success: true,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to activate rental', { lenderAddress, escrowId, error });
    
    let errorMessage = 'Failed to activate rental';
    if (error instanceof Error) {
      if (error.message.includes('UnauthorizedAccess')) {
        errorMessage = 'Unauthorized access';
      } else if (error.message.includes('InvalidEscrowState')) {
        errorMessage = 'Invalid escrow state';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Release payment to lender (after rental completion)
 * @param lenderAddress - Address of the lender
 * @param escrowId - ID of the escrow
 * @returns Promise<{success: boolean, transactionHash?: string, error?: string}>
 */
export const releaseToLender = async (lenderAddress: string, escrowId: number) => {
  try {
    logger.info('Releasing payment to lender', { lenderAddress, escrowId });

    // Get escrow details
    const escrow = await getEscrowDetails(escrowId);
    if (!escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // Verify lender
    if (escrow.lender.toLowerCase() !== lenderAddress.toLowerCase()) {
      return { success: false, error: 'Unauthorized: Not the lender' };
    }

    // Check escrow state
    if (escrow.state !== EscrowState.Active) {
      return { success: false, error: 'Escrow is not active' };
    }

    // Check if rental period has ended
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < escrow.endTime) {
      return { success: false, error: 'Rental period has not ended yet' };
    }

    // Estimate gas
    const gasLimit = await estimateGas(rentalEscrowContract, 'releaseToLender', [escrowId]);
    const gasPrice = await getOptimalGasPrice();

    // Release payment
    const tx = await rentalEscrowContract.releaseToLender(escrowId, {
      gasLimit,
      gasPrice
    });

    logger.info('Payment release transaction sent', { escrowId, txHash: tx.hash });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    logger.info('Payment released successfully', {
      escrowId,
      txHash: tx.hash
    });

    return {
      success: true,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to release payment', { lenderAddress, escrowId, error });
    
    let errorMessage = 'Failed to release payment';
    if (error instanceof Error) {
      if (error.message.includes('UnauthorizedAccess')) {
        errorMessage = 'Unauthorized access';
      } else if (error.message.includes('InvalidEscrowState')) {
        errorMessage = 'Invalid escrow state';
      } else if (error.message.includes('RentalNotEnded')) {
        errorMessage = 'Rental period has not ended';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Raise a dispute for an escrow
 * @param userAddress - Address of the user raising dispute
 * @param escrowId - ID of the escrow
 * @param reason - Reason for the dispute
 * @returns Promise<{success: boolean, transactionHash?: string, error?: string}>
 */
export const raiseDispute = async (userAddress: string, escrowId: number, reason: string) => {
  try {
    logger.info('Raising dispute', { userAddress, escrowId, reason });

    // Get escrow details
    const escrow = await getEscrowDetails(escrowId);
    if (!escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // Verify user is either borrower or lender
    const isBorrower = escrow.borrower.toLowerCase() === userAddress.toLowerCase();
    const isLender = escrow.lender.toLowerCase() === userAddress.toLowerCase();
    
    if (!isBorrower && !isLender) {
      return { success: false, error: 'Unauthorized: Not a party to this escrow' };
    }

    // Check escrow state
    if (escrow.state !== EscrowState.Active) {
      return { success: false, error: 'Can only dispute active escrows' };
    }

    // Estimate gas
    const gasLimit = await estimateGas(rentalEscrowContract, 'raiseDispute', [escrowId, reason]);
    const gasPrice = await getOptimalGasPrice();

    // Raise dispute
    const tx = await rentalEscrowContract.raiseDispute(escrowId, reason, {
      gasLimit,
      gasPrice
    });

    logger.info('Dispute transaction sent', { escrowId, txHash: tx.hash });

    // Wait for confirmation
    const receipt = await waitForTransaction(tx.hash);
    
    if (receipt.status !== 1) {
      throw new Error('Transaction failed');
    }

    logger.info('Dispute raised successfully', {
      escrowId,
      txHash: tx.hash
    });

    return {
      success: true,
      transactionHash: tx.hash
    };

  } catch (error) {
    logger.error('Failed to raise dispute', { userAddress, escrowId, reason, error });
    
    let errorMessage = 'Failed to raise dispute';
    if (error instanceof Error) {
      if (error.message.includes('UnauthorizedAccess')) {
        errorMessage = 'Unauthorized access';
      } else if (error.message.includes('InvalidEscrowState')) {
        errorMessage = 'Invalid escrow state';
      } else if (error.message.includes('DisputeTimeoutExceeded')) {
        errorMessage = 'Dispute timeout exceeded';
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Get escrow details by ID
 * @param escrowId - ID of the escrow
 * @returns Promise<EscrowAgreement | null>
 */
export const getEscrowDetails = async (escrowId: number): Promise<EscrowAgreement | null> => {
  try {
    const escrow = await rentalEscrowContract.getEscrow(escrowId);
    
    return {
      borrower: escrow.borrower,
      lender: escrow.lender,
      rentalAmount: ethers.formatEther(escrow.rentalAmount),
      securityDeposit: ethers.formatEther(escrow.securityDeposit),
      startTime: Number(escrow.startTime),
      endTime: Number(escrow.endTime),
      createdAt: Number(escrow.createdAt),
      state: Number(escrow.state) as EscrowState,
      itemDescription: escrow.itemDescription,
      lenderConfirmed: escrow.lenderConfirmed,
      borrowerConfirmed: escrow.borrowerConfirmed
    };
  } catch (error) {
    logger.error('Failed to get escrow details', { escrowId, error });
    return null;
  }
};

/**
 * Get all escrows for a user
 * @param userAddress - User's wallet address
 * @returns Promise<number[]>
 */
export const getUserEscrows = async (userAddress: string): Promise<number[]> => {
  try {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid address format');
    }

    const escrowIds = await rentalEscrowContract.getUserEscrows(userAddress);
    return escrowIds.map((id: bigint) => Number(id));
  } catch (error) {
    logger.error('Failed to get user escrows', { userAddress, error });
    throw new Error('Failed to retrieve user escrows');
  }
};