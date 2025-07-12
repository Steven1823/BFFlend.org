# Contributing to FriendLend

Thank you for your interest in contributing to FriendLend! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### 1. Fork the Repository

```bash
git clone https://github.com/your-username/friendlend.git
cd friendlend
git remote add upstream https://github.com/original-repo/friendlend.git
```

### 2. Set Up Development Environment

Follow the [LOCAL_SETUP.md](./LOCAL_SETUP.md) guide to set up your development environment.

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 5. Test Your Changes

```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test

# Smart contract tests
forge test
```

### 6. Submit a Pull Request

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

## 📝 Code Style Guidelines

### TypeScript/JavaScript

```typescript
// Use TypeScript for type safety
interface UserProfile {
  address: string;
  isVerified: boolean;
  tokenId?: number;
}

// Use descriptive function names
const getUserVerificationStatus = async (address: string): Promise<UserProfile> => {
  // Implementation
};

// Use proper error handling
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error });
  throw new Error('Failed to complete operation');
}
```

### Solidity

```solidity
// Use clear contract structure
contract RentalEscrow {
    // State variables
    mapping(uint256 => EscrowAgreement) public escrows;
    
    // Events
    event EscrowCreated(uint256 indexed escrowId, address indexed borrower);
    
    // Modifiers
    modifier onlyVerified() {
        require(soulboundToken.isVerified(msg.sender), "Not verified");
        _;
    }
    
    // Functions (external, public, internal, private)
    function createEscrow(
        address lender,
        uint256 amount
    ) external onlyVerified returns (uint256) {
        // Implementation
    }
}
```

### React Components

```tsx
// Use functional components with TypeScript
interface ItemCardProps {
  item: Item;
  onSelect: (id: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  return (
    <div className="card" onClick={handleClick}>
      {/* Component content */}
    </div>
  );
};

export default ItemCard;
```

## 🧪 Testing Guidelines

### Frontend Testing

```typescript
// Component tests
import { render, screen, fireEvent } from '@testing-library/react';
import ItemCard from './ItemCard';

describe('ItemCard', () => {
  it('should render item information', () => {
    const mockItem = {
      id: '1',
      title: 'Test Item',
      price: '10'
    };

    render(<ItemCard item={mockItem} onSelect={jest.fn()} />);
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
  });
});
```

### Backend Testing

```typescript
// API endpoint tests
import request from 'supertest';
import app from '../app';

describe('POST /api/sbt/mint', () => {
  it('should mint token for valid address', async () => {
    const response = await request(app)
      .post('/api/sbt/mint')
      .send({ address: '0x1234567890123456789012345678901234567890' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tokenId).toBeDefined();
  });
});
```

### Smart Contract Testing

```solidity
// Contract tests
function testMintTo() public {
    address user = address(0x1);
    
    soulboundToken.mintTo(user);
    
    assertTrue(soulboundToken.isVerified(user));
    assertEq(soulboundToken.balanceOf(user), 1);
}
```

## 📋 Pull Request Guidelines

### PR Title Format

```
type(scope): description

Examples:
feat(frontend): add wallet connection modal
fix(backend): resolve IPFS upload timeout
docs(readme): update installation instructions
test(contracts): add escrow creation tests
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
```

## 🐛 Bug Reports

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots.
```

## 🏗️ Architecture Guidelines

### Frontend Architecture

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API calls and business logic
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── styles/             # Global styles and themes
```

### Backend Architecture

```
backend/src/
├── controllers/        # Request handlers
├── services/          # Business logic
├── routes/            # API route definitions
├── middleware/        # Express middleware
├── utils/             # Utility functions
├── types/             # TypeScript types
└── config/            # Configuration files
```

### Smart Contract Architecture

```
contracts/
├── interfaces/        # Contract interfaces
├── libraries/         # Reusable libraries
├── tokens/           # Token contracts
├── escrow/           # Escrow contracts
└── governance/       # Governance contracts
```

## 🔒 Security Guidelines

### Code Security

- Never commit private keys or secrets
- Use environment variables for configuration
- Validate all inputs
- Implement proper error handling
- Use secure coding practices

### Smart Contract Security

- Follow OpenZeppelin patterns
- Use reentrancy guards
- Implement access controls
- Add pause functionality
- Conduct thorough testing

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Creates a new rental escrow agreement
 * @param borrower - Address of the borrower
 * @param lender - Address of the lender
 * @param amount - Rental amount in wei
 * @param duration - Rental duration in seconds
 * @returns Promise resolving to escrow ID
 */
async function createEscrow(
  borrower: string,
  lender: string,
  amount: bigint,
  duration: number
): Promise<number> {
  // Implementation
}
```

### README Updates

- Keep installation instructions current
- Update feature lists
- Add new configuration options
- Include troubleshooting tips

## 🎯 Development Workflow

### 1. Planning
- Discuss features in issues
- Create detailed specifications
- Consider security implications
- Plan testing strategy

### 2. Development
- Write tests first (TDD)
- Implement features incrementally
- Regular commits with clear messages
- Code review before merging

### 3. Testing
- Unit tests for all functions
- Integration tests for workflows
- Manual testing on testnet
- Security testing

### 4. Deployment
- Test on staging environment
- Deploy to testnet first
- Monitor for issues
- Deploy to mainnet

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Community announcements
- Special contributor badges

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/friendlend)
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Email**: dev@friendlend.com

## 📄 License

By contributing to FriendLend, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to FriendLend! 🚀**

Together, we're building the future of P2P rentals in Africa.