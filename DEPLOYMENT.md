# FriendLend Deployment Guide

This guide covers deploying FriendLend to production environments.

## 🚀 Frontend Deployment (Netlify)

### 1. Build Settings

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (set in Netlify dashboard)
VITE_CHAIN_ID=42220
VITE_RPC_URL=https://forno.celo.org
VITE_BLOCK_EXPLORER=https://celoscan.io
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_SOULBOUND_TOKEN_ADDRESS=0x...
VITE_RENTAL_ESCROW_ADDRESS=0x...
VITE_ITEM_NFT_ADDRESS=0x...
```

### 2. Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 3. Custom Domain Setup

1. Add your domain in Netlify dashboard
2. Update DNS records to point to Netlify
3. Enable HTTPS (automatic with Netlify)

## 🔧 Backend Deployment (Railway/Heroku/VPS)

### Railway Deployment

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
CELO_PROVIDER_URL=https://forno.celo.org
PRIVATE_KEY=your_mainnet_private_key
SOULBOUND_TOKEN_ADDRESS=0x...
RENTAL_ESCROW_ADDRESS=0x...
NFT_STORAGE_API_KEY=your_api_key
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📦 Smart Contract Deployment

### Celo Mainnet Deployment

```bash
# Set environment variables
export CELO_RPC="https://forno.celo.org"
export PRIVATE_KEY="your_private_key"
export CELOSCAN_API_KEY="your_api_key"

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url $CELO_RPC --broadcast --verify

# Update contract addresses in frontend and backend
```

### Contract Verification

```bash
# Verify on Celoscan
forge verify-contract \
  --chain-id 42220 \
  --num-of-optimizations 200 \
  --watch \
  --constructor-args $(cast abi-encode "constructor()" ) \
  --etherscan-api-key $CELOSCAN_API_KEY \
  --compiler-version v0.8.24+commit.e11b9ed9 \
  0xYourContractAddress \
  src/SoulboundToken.sol:SoulboundToken
```

## 🔒 Security Checklist

### Pre-Deployment

- [ ] All private keys secured
- [ ] Environment variables set correctly
- [ ] Smart contracts audited
- [ ] Frontend security headers configured
- [ ] API rate limiting enabled
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Error handling in place
- [ ] Logging configured

### Post-Deployment

- [ ] Monitor contract interactions
- [ ] Set up alerts for unusual activity
- [ ] Regular security updates
- [ ] Backup strategies in place
- [ ] Incident response plan ready

## 📊 Monitoring & Analytics

### Application Monitoring

```javascript
// Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Blockchain Monitoring

- Monitor contract events
- Track gas usage
- Alert on failed transactions
- Monitor wallet balances

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
          production-branch: main
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-contracts:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[deploy-contracts]')
    steps:
      - uses: actions/checkout@v3
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      - name: Deploy contracts
        run: |
          forge script script/Deploy.s.sol --rpc-url ${{ secrets.CELO_RPC }} --broadcast --verify
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          CELOSCAN_API_KEY: ${{ secrets.CELOSCAN_API_KEY }}
```

## 🌍 Multi-Environment Setup

### Development
- Celo Alfajores testnet
- Local backend
- Debug mode enabled

### Staging
- Celo Alfajores testnet
- Staging backend
- Production-like configuration

### Production
- Celo mainnet
- Production backend
- Optimized builds

## 📈 Performance Optimization

### Frontend Optimization

```javascript
// Code splitting
const LazyComponent = lazy(() => import('./Component'));

// Bundle analysis
npm run build -- --analyze

// Image optimization
import { optimizeImage } from './utils/imageOptimizer';
```

### Backend Optimization

```javascript
// Caching
import Redis from 'redis';
const redis = Redis.createClient();

// Database connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});
```

## 🔧 Maintenance

### Regular Tasks

- Update dependencies
- Monitor logs
- Check contract balances
- Review security alerts
- Update documentation
- Backup data

### Emergency Procedures

1. **Contract Pause**: Use emergency pause functions
2. **Frontend Rollback**: Revert to previous Netlify deployment
3. **Backend Rollback**: Revert to previous Railway deployment
4. **Communication**: Update status page and notify users

---

**Production Deployment Checklist Complete! ✅**

Remember to test everything thoroughly on testnet before mainnet deployment.