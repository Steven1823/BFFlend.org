# BFFlend - P2P Rental Marketplace Smart Contracts

A decentralized peer-to-peer rental marketplace built for African users, deployed on the Celo blockchain. FriendLend enables secure, trustless rentals of physical items through smart contracts and on-chain identity verification.

## 🌟 Features

### Core Functionality
- **KYC-Verified Users**: Soulbound tokens for verified user identities
- **Secure Escrow**: Automated rental payment and security deposit handling
- **Item Tokenization**: NFTs representing rental items with metadata
- **Dispute Resolution**: Built-in arbitration system for rental conflicts
- **Platform Fees**: Configurable fee collection for marketplace sustainability

### Security Features
- **Access Control**: Role-based permissions with OpenZeppelin
- **Reentrancy Protection**: Secure fund transfers
- **Pause Functionality**: Emergency controls for all contracts
- **Input Validation**: Comprehensive parameter checking

## 🏗️ Architecture

### Smart Contracts

#### 1. SoulboundToken.sol
Non-transferable ERC721 tokens for user identity verification:
- **Purpose**: Prove on-chain identity after KYC completion
- **Features**: Admin-only minting, non-transferable, revokable
- **Functions**: `mintTo()`, `isVerified()`, `revokeVerification()`

#### 2. RentalEscrow.sol
Secure escrow service for rental payments:
- **Purpose**: Handle deposits, releases, and dispute resolution
- **Features**: Time-locked payments, security deposits, platform fees
- **Functions**: `createEscrow()`, `deposit()`, `releaseToLender()`, `raiseDispute()`

#### 3. ItemNFT.sol
ERC721 tokens representing rental items:
- **Purpose**: Tokenize rental items with rich metadata
- **Features**: Categories, conditions, location tracking
- **Functions**: `listItem()`, `updateItem()`, `getAvailableItems()`

## 🚀 Getting Started

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) (for frontend integration)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/friendlend-contracts
cd friendlend-contracts
```

2. **Install dependencies**
```bBFFBFFash
forge install
```

3. **Run tests**
```bash
forge test
```

4. **Build contracts**
```bash
forge build
```

### Deployment

#### Local Development
```bash
# Start local anvil node
anvil

# Deploy to local network
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

#### Alfajores Testnet
```bash
# Set environment variables
export ALFAJORES_RPC="https://alfajores-forno.celo-testnet.org"
export PRIVATE_KEY="your-private-key"

# Deploy and verify
forge script script/Deploy.s.sol --rpc-url $ALFAJORES_RPC --broadcast --verify
```

#### Celo Mainnet
```bash
# Set environment variables
export CELO_RPC="https://forno.celo.org"
export PRIVATE_KEY="your-private-key"

# Deploy and verify
forge script script/Deploy.s.sol --rpc-url $CELO_RPC --broadcast --verify
```

## 📋 Contract Addresses

### Alfajores Testnet
- **SoulboundToken**: `TBD`
- **RentalEscrow**: `TBD`
- **ItemNFT**: `TBD`

### Celo Mainnet
- **SoulboundToken**: `TBD`
- **RentalEscrow**: `TBD`
- **ItemNFT**: `TBD`

## 🔧 Configuration

### Environment Variables
```bash
# RPC URLs
ALFAJORES_RPC="https://alfajores-forno.celo-testnet.org"
CELO_RPC="https://forno.celo.org"

# Private Key
PRIVATE_KEY="your-private-key"

# Block Explorer API
CELOSCAN_API_KEY="your-api-key"
```

### Frontend Integration
```typescript
// Contract addresses for frontend
const CONTRACTS = {
  SOULBOUND_TOKEN: "0x...",
  RENTAL_ESCROW: "0x...",
  ITEM_NFT: "0x...",
};
```

## 🔄 Workflow

### 1. User Onboarding
1. User completes KYC verification
2. Admin mints SoulboundToken to user's address
3. User can now access platform features

### 2. Item Listing
1. Verified user lists item via `ItemNFT.listItem()`
2. NFT is minted with metadata (price, location, condition)
3. Item appears in marketplace

### 3. Rental Process
1. **Create Escrow**: Borrower creates escrow agreement
2. **Deposit**: Borrower deposits rental amount + security deposit
3. **Activate**: Lender confirms item handover
4. **Complete**: After rental period, lender releases payment
5. **Return**: Security deposit returned to borrower

### 4. Dispute Resolution
1. Either party can raise dispute during rental
2. Admin reviews case and makes decision
3. Funds distributed according to resolution

## 🧪 Testing

### Run All Tests
```bash
forge test
```

### Run Specific Test Files
```bash
forge test --match-path test/SoulboundToken.t.sol
forge test --match-path test/RentalEscrow.t.sol
forge test --match-path test/ItemNFT.t.sol
```

### Test Coverage
```bash
forge coverage
```

### Gas Analysis
```bash
forge test --gas-report
```

## 📊 Gas Optimization

### Deployment Costs (Estimated)
- **SoulboundToken**: ~800,000 gas
- **RentalEscrow**: ~1,200,000 gas  
- **ItemNFT**: ~1,000,000 gas

### Transaction Costs
- **Mint Identity Token**: ~80,000 gas
- **Create Escrow**: ~120,000 gas
- **List Item**: ~100,000 gas
- **Complete Rental**: ~90,000 gas

## 🔐 Security Considerations

### Access Controls
- Admin-only functions for sensitive operations
- Verified user requirements for core features
- Emergency pause functionality

### Economic Security
- Platform fee collection for sustainability
- Security deposits to prevent abuse
- Dispute resolution for edge cases

### Technical Security
- Reentrancy protection on all payable functions
- Input validation and custom errors
- Comprehensive event logging

## 🤝 Contributing

### Development Guidelines
1. Follow Solidity style guide
2. Add comprehensive comments
3. Write thorough tests
4. Update documentation

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Documentation
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Celo Documentation](https://docs.celo.org/)

### Community
- Discord: [Join our community](https://discord.gg/BFF)
- Telegram: [@friendlend](https://t.me/BFF)
- Twitter: [@friendlend](https://twitter.com/BFF)

## 🗺️ Roadmap

### Phase 1: Core Contracts ✅
- [x] SoulboundToken implementation
- [x] RentalEscrow functionality
- [x] ItemNFT tokenization
- [x] Deployment scripts

### Phase 2: Enhanced Features 🔄
- [ ] Multi-token support (cUSD, cEUR)
- [ ] Advanced dispute resolution
- [ ] Reputation system
- [ ] Bulk operations

### Phase 3: Ecosystem Integration 📋
- [ ] DeFi yield farming
- [ ] Cross-chain compatibility
- [ ] Mobile SDK
- [ ] Merchant tools

---

**Built with ❤️ for the African ecosystem on Celo**