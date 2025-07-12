/**
 * FriendLend Backend Application
 * 
 * Express.js server for the FriendLend P2P rental marketplace.
 * Provides REST API endpoints for interacting with smart contracts
 * on the Celo blockchain.
 * 
 * Features:
 * - SoulboundToken (KYC verification) operations
 * - Rental escrow management
 * - Item metadata and IPFS integration
 * - Authentication and authorization
 * - Comprehensive logging and error handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { checkConnection } from './services/web3';
import { checkIPFSService } from './utils/ipfs';

// Import routes
import sbtRoutes from './routes/sbt.routes';
import rentalRoutes from './routes/rental.routes';
import itemRoutes from './routes/item.routes';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check blockchain connection
    const blockchainHealthy = await checkConnection();
    
    // Check IPFS service
    const ipfsHealthy = await checkIPFSService();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        blockchain: blockchainHealthy ? 'healthy' : 'unhealthy',
        ipfs: ipfsHealthy ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    const overallHealthy = blockchainHealthy && ipfsHealthy;

    res.status(overallHealthy ? 200 : 503).json({
      success: overallHealthy,
      data: health
    });

  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      error: 'Service unavailable'
    });
  }
});

// API routes
app.use('/api/sbt', sbtRoutes);
app.use('/api/rental', rentalRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FriendLend Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      sbt: '/api/sbt',
      rental: '/api/rental',
      item: '/api/item',
      auth: '/api/auth',
      health: '/health'
    }
  });
});

// API documentation endpoint (basic)
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      title: 'FriendLend API Documentation',
      version: '1.0.0',
      description: 'REST API for FriendLend P2P rental marketplace',
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
      endpoints: {
        sbt: {
          description: 'SoulboundToken operations for KYC verification',
          routes: [
            'GET /api/sbt/:address/is-verified',
            'POST /api/sbt/mint',
            'POST /api/sbt/revoke',
            'GET /api/sbt/stats',
            'GET /api/sbt/:address/token-id',
            'POST /api/sbt/batch-check',
            'GET /api/sbt/health'
          ]
        },
        rental: {
          description: 'Rental escrow operations',
          routes: [
            'POST /api/rental/create',
            'POST /api/rental/deposit',
            'POST /api/rental/activate',
            'POST /api/rental/release',
            'POST /api/rental/dispute',
            'GET /api/rental/:escrowId',
            'GET /api/rental/user/:address',
            'GET /api/rental/health'
          ]
        },
        item: {
          description: 'Item metadata and IPFS operations',
          routes: [
            'POST /api/item/upload',
            'POST /api/item/register',
            'GET /api/item/metadata/:uri',
            'GET /api/item/categories',
            'GET /api/item/conditions',
            'GET /api/item/search',
            'PUT /api/item/update/:uri',
            'GET /api/item/health'
          ]
        },
        auth: {
          description: 'Authentication and authorization',
          routes: [
            'POST /api/auth/verify-signature',
            'GET /api/auth/nonce/:address',
            'GET /api/auth/status/:address',
            'POST /api/auth/logout',
            'GET /api/auth/health'
          ]
        }
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      '/api/sbt',
      '/api/rental',
      '/api/item',
      '/api/auth',
      '/health',
      '/api/docs'
    ]
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Check initial connections
    logger.info('Starting FriendLend Backend...');
    
    // Check blockchain connection
    const blockchainHealthy = await checkConnection();
    if (!blockchainHealthy) {
      logger.warn('Blockchain connection failed, but starting server anyway');
    }

    // Check IPFS service
    const ipfsHealthy = await checkIPFSService();
    if (!ipfsHealthy) {
      logger.warn('IPFS service check failed, but starting server anyway');
    }

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info('FriendLend Backend started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        blockchain: blockchainHealthy ? 'connected' : 'disconnected',
        ipfs: ipfsHealthy ? 'connected' : 'disconnected'
      });

      // Log important configuration
      logger.info('Configuration loaded', {
        celoProvider: process.env.CELO_PROVIDER_URL,
        corsOrigin: process.env.CORS_ORIGIN,
        logLevel: process.env.LOG_LEVEL,
        hasNftStorageKey: !!process.env.NFT_STORAGE_API_KEY,
        hasSoulboundAddress: !!process.env.SOULBOUND_TOKEN_ADDRESS,
        hasEscrowAddress: !!process.env.RENTAL_ESCROW_ADDRESS
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;