/**
 * Web3 Service - Ethers.js setup for Celo Alfajores
 * 
 * This service initializes the blockchain connection and provides
 * pre-configured contract instances for the FriendLend platform.
 * 
 * Features:
 * - Ethers.js provider for Celo Alfajores testnet
 * - Wallet instance with private key from environment
 * - Pre-loaded contract instances with ABIs
 * - Connection health checking
 * - Gas price optimization for Celo
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import soulboundTokenABI from '../../contracts/SoulboundToken.json';
import rentalEscrowABI from '../../contracts/RentalEscrow.json';
import { logger } from '../utils/logger';

dotenv.config();

// Environment validation
const requiredEnvVars = [
  'CELO_PROVIDER_URL',
  'PRIVATE_KEY',
  'SOULBOUND_TOKEN_ADDRESS',
  'RENTAL_ESCROW_ADDRESS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize provider for Celo Alfajores
export const provider = new ethers.JsonRpcProvider(process.env.CELO_PROVIDER_URL!);

// Initialize wallet with private key
export const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// Contract addresses from environment
const SOULBOUND_TOKEN_ADDRESS = process.env.SOULBOUND_TOKEN_ADDRESS!;
const RENTAL_ESCROW_ADDRESS = process.env.RENTAL_ESCROW_ADDRESS!;

// Initialize contract instances
export const soulboundTokenContract = new ethers.Contract(
  SOULBOUND_TOKEN_ADDRESS,
  soulboundTokenABI.abi,
  wallet
);

export const rentalEscrowContract = new ethers.Contract(
  RENTAL_ESCROW_ADDRESS,
  rentalEscrowABI.abi,
  wallet
);

/**
 * Check blockchain connection health
 * @returns Promise<boolean> - Connection status
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const balance = await provider.getBalance(wallet.address);
    
    logger.info('Blockchain connection established', {
      network: network.name,
      chainId: network.chainId.toString(),
      blockNumber,
      walletAddress: wallet.address,
      balance: ethers.formatEther(balance)
    });
    
    return true;
  } catch (error) {
    logger.error('Blockchain connection failed', { error });
    return false;
  }
};

/**
 * Get current gas price optimized for Celo
 * @returns Promise<bigint> - Gas price in wei
 */
export const getOptimalGasPrice = async (): Promise<bigint> => {
  try {
    const feeData = await provider.getFeeData();
    // Use gasPrice for Celo (not EIP-1559)
    return feeData.gasPrice || ethers.parseUnits('1', 'gwei');
  } catch (error) {
    logger.warn('Failed to get gas price, using default', { error });
    return ethers.parseUnits('1', 'gwei');
  }
};

/**
 * Estimate gas for a contract transaction
 * @param contract - Contract instance
 * @param method - Method name
 * @param params - Method parameters
 * @returns Promise<bigint> - Estimated gas limit
 */
export const estimateGas = async (
  contract: ethers.Contract,
  method: string,
  params: unknown[] = []
): Promise<bigint> => {
  try {
    const gasEstimate = await contract[method].estimateGas(...params);
    // Add 20% buffer for gas estimation
    return (gasEstimate * 120n) / 100n;
  } catch (error) {
    logger.warn(`Gas estimation failed for ${method}`, { error });
    return 200000n; // Default gas limit
  }
};

/**
 * Wait for transaction confirmation with timeout
 * @param txHash - Transaction hash
 * @param confirmations - Number of confirmations to wait for
 * @param timeout - Timeout in milliseconds
 * @returns Promise<ethers.TransactionReceipt>
 */
export const waitForTransaction = async (
  txHash: string,
  confirmations: number = 1,
  timeout: number = 60000
): Promise<ethers.TransactionReceipt> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Transaction timeout')), timeout);
  });
  
  const txPromise = provider.waitForTransaction(txHash, confirmations);

  const receipt = await Promise.race([txPromise, timeoutPromise]);

  if (!receipt) {
    throw new Error(`Transaction not found or failed: ${txHash}`);
  }
  
  return receipt;
};

/**
 * Get transaction status and details
 * @param txHash - Transaction hash
 * @returns Promise<object> - Transaction details
 */
export const getTransactionStatus = async (txHash: string) => {
  try {
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    return {
      hash: txHash,
      status: receipt?.status === 1 ? 'success' : 'failed',
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      effectiveGasPrice: receipt?.gasPrice?.toString(),
      confirmations: tx ? await tx.confirmations() : 0
    };
  } catch (error) {
    logger.error('Failed to get transaction status', { txHash, error });
    throw error;
  }
};

// Initialize connection on module load
checkConnection().catch(error => {
  logger.error('Initial blockchain connection failed', { error });
});

logger.info('Web3 service initialized', {
  providerUrl: process.env.CELO_PROVIDER_URL,
  walletAddress: wallet.address,
  soulboundTokenAddress: SOULBOUND_TOKEN_ADDRESS,
  rentalEscrowAddress: RENTAL_ESCROW_ADDRESS
});
