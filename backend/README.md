# FriendLend Backend

Node.js + Express + TypeScript backend for the FriendLend P2P rental marketplace. This backend provides REST API endpoints for interacting with smart contracts deployed on the Celo blockchain.

## 🚀 Features

### Core Functionality
- **SoulboundToken Integration**: KYC verification and identity management
- **Rental Escrow Management**: Secure rental payment processing
- **IPFS Integration**: Decentralized metadata and image storage
- **Authentication**: Wallet-based authentication with signature verification

### Technical Features
- **TypeScript**: Full type safety and modern JavaScript features
- **Ethers.js**: Blockchain interaction with Celo network
- **Express.js**: RESTful API with comprehensive middleware
- **Winston Logging**: Structured logging with multiple transports
- **Input Validation**: Joi-based request validation
- **Error Handling**: Comprehensive error handling and reporting

## 📁 Project Structure

```
backend/
├── contracts/                  # Smart contract ABIs and addresses
│   ├── SoulboundToken.json
│   └── RentalEscrow.json
├── src/
│   ├── controllers/           # Express route handlers
│   │   ├── auth.controller.ts
│   │   ├── rental.controller.ts
│   │   ├── item.controller.ts
│   │   └── sbt.controller.ts
│   ├── routes/               # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── rental.routes.ts
│   │   ├── item.routes.ts
│   │   └── sbt.routes.ts
│   ├── services/             # Business logic and blockchain interaction
│   │   ├── web3.ts
│   │   ├── escrow.service.ts
│   │   ├── sbt.service.ts
│   │   └── item.service.ts
│   ├── utils/               # Utility functions
│   │   ├── ipfs.ts
│   │   └── logger.ts
│   └── app.ts              # Express application entry point
├── logs/                   # Log files
├── .env.example           # Environment variables template
└── package.json
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Celo wallet with testnet CELO
- NFT.Storage API key (for IPFS)

### Setup

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Celo Blockchain Configuration
CELO_PROVIDER_URL=https://alfajores-forno.celo-testnet.org
PRIVATE_KEY=your_private_key_here

# Smart Contract Addresses (Alfajores Testnet)
SOULBOUND_TOKEN_ADDRESS=0x...
RENTAL_ESCROW_ADDRESS=0x...

# IPFS Configuration
NFT_STORAGE_API_KEY=your_nft_storage_api_key_here

# API Configuration
CORS_ORIGIN=http://localhost:3000
```

4. **Build and start the server**
```bash
# Development mode with hot reload
npm run dev

# Production build and start
npm run build
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
Most endpoints require users to be KYC verified (have a SoulboundToken). Some admin endpoints require additional authorization.

### Endpoints

#### SoulboundToken (KYC) Operations
```
GET    /sbt/:address/is-verified     # Check verification status
POST   /sbt/mint                     # Mint identity token (admin)
POST   /sbt/revoke                   # Revoke verification (admin)
GET    /sbt/stats                    # Get verification statistics
GET    /sbt/:address/token-id        # Get user's token ID
POST   /sbt/batch-check              # Batch verification check
GET    /sbt/health                   # Service health check
```

#### Rental Escrow Operations
```
POST   /rental/create                # Create escrow agreement
POST   /rental/deposit               # Make rental deposit
POST   /rental/activate              # Activate rental
POST   /rental/release               # Release payment to lender
POST   /rental/dispute               # Raise dispute
GET    /rental/:escrowId             # Get escrow details
GET    /rental/user/:address         # Get user's rentals
GET    /rental/health                # Service health check
```

#### Item Management
```
POST   /item/upload                  # Upload item with image
POST   /item/register                # Register item metadata
GET    /item/metadata/:uri           # Get item metadata
GET    /item/categories              # Get available categories
GET    /item/conditions              # Get available conditions
GET    /item/search                  # Search items
PUT    /item/update/:uri             # Update item metadata
GET    /item/health                  # Service health check
```

#### Authentication
```
POST   /auth/verify-signature        # Verify wallet signature
GET    /auth/nonce/:address          # Get signing nonce
GET    /auth/status/:address         # Get auth status
POST   /auth/logout                  # Logout user
GET    /auth/health                  # Service health check
```

### Example Requests

#### Check User Verification
```bash
curl -X GET http://localhost:3001/api/sbt/0x123.../is-verified
```

#### Create Rental Escrow
```bash
curl -X POST http://localhost:3001/api/rental/create \
  -H "Content-Type: application/json" \
  -d '{
    "borrowerAddress": "0x123...",
    "lenderAddress": "0x456...",
    "rentalAmount": "0.1",
    "securityDeposit": "0.05",
    "durationHours": 24,
    "itemDescription": "MacBook Pro for rental"
  }'
```

#### Upload Item with Image
```bash
curl -X POST http://localhost:3001/api/item/upload \
  -F "name=MacBook Pro" \
  -F "description=2021 MacBook Pro 16-inch" \
  -F "category=Electronics" \
  -F "condition=Excellent" \
  -F "location=Lagos, Nigeria" \
  -F "pricePerDay=0.1" \
  -F "securityDeposit=0.5" \
  -F "ownerAddress=0x123..." \
  -F "image=@macbook.jpg"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `CELO_PROVIDER_URL` | Celo RPC endpoint | Yes |
| `PRIVATE_KEY` | Backend wallet private key | Yes |
| `SOULBOUND_TOKEN_ADDRESS` | SBT contract address | Yes |
| `RENTAL_ESCROW_ADDRESS` | Escrow contract address | Yes |
| `NFT_STORAGE_API_KEY` | IPFS storage API key | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | No |
| `LOG_LEVEL` | Logging level | No (default: info) |

### Smart Contract Integration

The backend automatically loads contract ABIs and addresses from the `contracts/` directory. Update these files when deploying new contract versions:

```json
// contracts/SoulboundToken.json
{
  "contractName": "SoulboundToken",
  "abi": [...],
  "networks": {
    "44787": {
      "address": "0x...",
      "transactionHash": "0x..."
    }
  }
}
```

## 🧪 Testing

### Manual Testing
Use the health check endpoints to verify service status:

```bash
# Overall health
curl http://localhost:3001/health

# Service-specific health checks
curl http://localhost:3001/api/sbt/health
curl http://localhost:3001/api/rental/health
curl http://localhost:3001/api/item/health
curl http://localhost:3001/api/auth/health
```

### Integration Testing
Test the complete workflow:

1. **Verify user KYC status**
2. **Create rental escrow**
3. **Upload item metadata**
4. **Process rental workflow**

## 📊 Monitoring and Logging

### Logging
The application uses Winston for structured logging:

- **Console**: Colored output for development
- **Files**: JSON logs in `logs/` directory
- **Levels**: error, warn, info, http, debug

### Health Monitoring
Monitor service health via:
- `/health` - Overall system health
- Individual service health endpoints
- Blockchain connection status
- IPFS service availability

## 🚀 Deployment

### Production Deployment

1. **Build the application**
```bash
npm run build
```

2. **Set production environment variables**
```bash
export NODE_ENV=production
export PORT=3001
# ... other variables
```

3. **Start the server**
```bash
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment-Specific Configuration

#### Alfajores Testnet
```env
CELO_PROVIDER_URL=https://alfajores-forno.celo-testnet.org
```

#### Celo Mainnet
```env
CELO_PROVIDER_URL=https://forno.celo.org
```

## 🔒 Security Considerations

### Private Key Management
- Never commit private keys to version control
- Use environment variables or secure key management
- Rotate keys regularly in production

### API Security
- Implement rate limiting for production
- Use HTTPS in production
- Validate all inputs thoroughly
- Implement proper authentication middleware

### Smart Contract Security
- Verify contract addresses before deployment
- Monitor contract interactions
- Implement circuit breakers for critical operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Use structured logging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Blockchain Connection Failed**
- Check CELO_PROVIDER_URL is correct
- Verify network connectivity
- Ensure private key has sufficient balance

**IPFS Upload Failed**
- Verify NFT_STORAGE_API_KEY is valid
- Check file size limits
- Ensure network connectivity

**Contract Interaction Failed**
- Verify contract addresses are correct
- Check if contracts are deployed
- Ensure user has required permissions

### Getting Help
- Check the logs in `logs/` directory
- Use health check endpoints for diagnostics
- Review environment variable configuration
- Check smart contract deployment status

---

**Built with ❤️ for the African ecosystem on Celo**