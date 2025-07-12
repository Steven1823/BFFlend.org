# FriendLend - Complete Local Setup Guide

This guide will help you set up the FriendLend P2P rental marketplace on your local machine.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** or another Web3 wallet (for testing)

## 🚀 Frontend Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd friendlend

# Install frontend dependencies
npm install

# Install additional required packages
npm install react-router-dom@latest
npm install @types/react-router-dom@latest
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend Environment Variables
VITE_APP_NAME=FriendLend
VITE_APP_VERSION=1.0.0

# Blockchain Configuration (Celo Alfajores Testnet)
VITE_CHAIN_ID=44787
VITE_RPC_URL=https://alfajores-forno.celo-testnet.org
VITE_BLOCK_EXPLORER=https://alfajores.celoscan.io

# Smart Contract Addresses (Update after deployment)
VITE_SOULBOUND_TOKEN_ADDRESS=0x...
VITE_RENTAL_ESCROW_ADDRESS=0x...
VITE_ITEM_NFT_ADDRESS=0x...

# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001/api

# IPFS Configuration
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Feature Flags
VITE_ENABLE_WALLET_CONNECT=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_DEBUG_MODE=true
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🔧 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Celo Blockchain Configuration
CELO_PROVIDER_URL=https://alfajores-forno.celo-testnet.org
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Smart Contract Addresses (Alfajores Testnet)
SOULBOUND_TOKEN_ADDRESS=0x...
RENTAL_ESCROW_ADDRESS=0x...
ITEM_NFT_ADDRESS=0x...

# IPFS Configuration (NFT.Storage)
NFT_STORAGE_API_KEY=your_nft_storage_api_key_here

# API Configuration
API_BASE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database (if using)
DATABASE_URL=postgresql://username:password@localhost:5432/friendlend

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
SESSION_SECRET=your_session_secret_here

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Webhook URLs (for external integrations)
WEBHOOK_SECRET=your_webhook_secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

### 4. Start Backend Development Server

```bash
npm run dev
```

The backend API will be available at `http://localhost:3001`

## 🔗 Blockchain Setup

### 1. Get Celo Alfajores Testnet Tokens

1. Visit [Celo Faucet](https://faucet.celo.org/)
2. Enter your wallet address
3. Request testnet CELO tokens

### 2. Deploy Smart Contracts

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Deploy contracts to Alfajores testnet
forge script script/Deploy.s.sol --rpc-url $ALFAJORES_RPC --broadcast --verify

# Update contract addresses in your .env files
```

### 3. Get Required API Keys

#### NFT.Storage (for IPFS)
1. Visit [NFT.Storage](https://nft.storage/)
2. Sign up for a free account
3. Generate an API key
4. Add to `NFT_STORAGE_API_KEY` in backend `.env`

#### Celoscan (for contract verification)
1. Visit [Celoscan](https://alfajores.celoscan.io/)
2. Create an account
3. Generate an API key
4. Add to `CELOSCAN_API_KEY` in your environment

## 📁 Project Structure

```
friendlend/
├── src/                          # Frontend React app
│   ├── components/              # Reusable components
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── styles/                  # CSS and styling
│   └── config/                  # Configuration files
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/           # Business logic
│   │   ├── routes/             # API routes
│   │   ├── utils/              # Utility functions
│   │   └── contracts/          # Smart contract ABIs
│   └── logs/                   # Log files
├── contracts/                   # Solidity smart contracts
├── script/                     # Deployment scripts
├── test/                       # Contract tests
└── public/                     # Static assets
```

## 🧪 Testing

### Frontend Testing
```bash
# Run frontend tests
npm test

# Run with coverage
npm run test:coverage
```

### Backend Testing
```bash
# Run backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

### Smart Contract Testing
```bash
# Run contract tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test testMintTo
```

## 🔍 Development Tools

### Useful Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm run start        # Start production server

# Smart Contracts
forge build          # Compile contracts
forge test           # Run tests
forge coverage       # Test coverage
forge fmt            # Format code
```

### Browser Extensions

1. **MetaMask** - Web3 wallet
2. **React Developer Tools** - Debug React components
3. **Redux DevTools** - Debug state management (if using Redux)

### VS Code Extensions

1. **Solidity** - Smart contract development
2. **ES7+ React/Redux/React-Native snippets**
3. **Tailwind CSS IntelliSense**
4. **TypeScript Importer**
5. **Auto Rename Tag**

## 🚨 Troubleshooting

### Common Issues

#### 1. "Failed to resolve import" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. Blockchain connection issues
- Check your `CELO_PROVIDER_URL` is correct
- Ensure you have testnet CELO tokens
- Verify your private key is valid (without 0x prefix)

#### 3. IPFS upload failures
- Verify your `NFT_STORAGE_API_KEY` is correct
- Check your internet connection
- Try uploading a smaller file first

#### 4. Contract deployment failures
- Ensure you have enough CELO for gas fees
- Check the contract addresses are correct
- Verify the network configuration

### Getting Help

1. **Check the logs** - Both frontend and backend log errors
2. **Use browser dev tools** - Check console for frontend errors
3. **Test API endpoints** - Use Postman or curl to test backend
4. **Verify contract state** - Use Celoscan to check transactions

## 🌍 Network Configuration

### Celo Alfajores Testnet
- **Chain ID**: 44787
- **RPC URL**: https://alfajores-forno.celo-testnet.org
- **Block Explorer**: https://alfajores.celoscan.io
- **Faucet**: https://faucet.celo.org

### Celo Mainnet (Production)
- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Block Explorer**: https://celoscan.io

## 📚 Additional Resources

- [Celo Documentation](https://docs.celo.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🔐 Security Notes

- **Never commit private keys** to version control
- **Use environment variables** for all sensitive data
- **Test thoroughly** on testnet before mainnet deployment
- **Keep dependencies updated** for security patches
- **Use HTTPS** in production
- **Implement rate limiting** for API endpoints

---

**Happy coding! 🚀**

For questions or issues, please check the troubleshooting section or create an issue in the repository.