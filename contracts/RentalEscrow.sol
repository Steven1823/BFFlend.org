// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SoulboundToken.sol";

/**
 * @title RentalEscrow
 * @dev Secure escrow contract for P2P rental payments
 * @notice Handles rental deposits, releases, and dispute resolution
 * 
 * Key Features:
 * - Secure escrow for rental payments
 * - Security deposit handling
 * - Dispute resolution mechanism
 * - Integration with KYC verification
 * - Fee collection for platform
 * 
 * Workflow:
 * 1. Borrower deposits rental payment + security deposit
 * 2. Lender confirms item handover
 * 3. After rental period, lender releases payment
 * 4. Security deposit returned to borrower
 * 5. Dispute resolution if needed
 */
contract RentalEscrow is ReentrancyGuard, Ownable, Pausable {
    /// @dev Reference to the SoulboundToken contract
    SoulboundToken public immutable soulboundToken;
    
    /// @dev Platform fee percentage (in basis points, 100 = 1%)
    uint256 public platformFeePercentage = 250; // 2.5%
    
    /// @dev Minimum rental duration in seconds
    uint256 public constant MIN_RENTAL_DURATION = 1 hours;
    
    /// @dev Maximum rental duration in seconds
    uint256 public constant MAX_RENTAL_DURATION = 365 days;
    
    /// @dev Dispute resolution timeout (after rental ends)
    uint256 public constant DISPUTE_TIMEOUT = 7 days;
    
    /// @dev Escrow states
    enum EscrowState {
        Created,      // Initial state
        Deposited,    // Borrower has deposited
        Active,       // Rental is active
        Completed,    // Rental completed, payment released
        Disputed,     // In dispute
        Refunded,     // Refunded to borrower
        Cancelled     // Cancelled before start
    }
    
    /// @dev Escrow agreement structure
    struct EscrowAgreement {
        address borrower;           // Person renting the item
        address lender;            // Person lending the item
        uint256 rentalAmount;      // Amount to pay for rental
        uint256 securityDeposit;   // Security deposit amount
        uint256 startTime;         // When rental starts
        uint256 endTime;          // When rental ends
        uint256 createdAt;        // When escrow was created
        EscrowState state;        // Current state
        string itemDescription;   // Description of rented item
        bool lenderConfirmed;     // Lender confirmed item handover
        bool borrowerConfirmed;   // Borrower confirmed item return
    }
    
    /// @dev Mapping from escrow ID to agreement
    mapping(uint256 => EscrowAgreement) public escrows;
    
    /// @dev Counter for escrow IDs
    uint256 private _escrowIdCounter;
    
    /// @dev Mapping to track user's active escrows
    mapping(address => uint256[]) public userEscrows;
    
    /// @dev Platform fee collection
    uint256 public collectedFees;
    
    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed borrower,
        address indexed lender,
        uint256 rentalAmount,
        uint256 securityDeposit,
        uint256 startTime,
        uint256 endTime
    );
    
    event DepositMade(
        uint256 indexed escrowId,
        address indexed borrower,
        uint256 totalAmount
    );
    
    event RentalActivated(
        uint256 indexed escrowId,
        address indexed lender
    );
    
    event PaymentReleased(
        uint256 indexed escrowId,
        address indexed lender,
        uint256 rentalAmount,
        uint256 platformFee
    );
    
    event SecurityDepositReturned(
        uint256 indexed escrowId,
        address indexed borrower,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raiser,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed resolver,
        bool favorBorrower
    );
    
    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed canceller
    );
    
    event RefundIssued(
        uint256 indexed escrowId,
        address indexed borrower,
        uint256 amount
    );
    
    /// @dev Custom errors
    error InvalidRentalDuration();
    error InvalidAmount();
    error InvalidEscrowState();
    error UnauthorizedAccess();
    error InsufficientDeposit();
    error RentalNotStarted();
    error RentalNotEnded();
    error DisputeTimeoutExceeded();
    error EscrowNotFound();
    error TransferFailed();
    
    /// @dev Modifier to ensure only verified users can interact
    modifier onlyVerified() {
        if (!soulboundToken.isVerified(msg.sender)) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    /// @dev Modifier to check escrow exists
    modifier escrowExists(uint256 escrowId) {
        if (escrowId >= _escrowIdCounter) revert EscrowNotFound();
        _;
    }
    
    constructor(address _soulboundToken) Ownable(msg.sender) {
        soulboundToken = SoulboundToken(_soulboundToken);
    }
    
    /**
     * @dev Create a new escrow agreement
     * @param lender Address of the lender
     * @param rentalAmount Amount to pay for rental
     * @param securityDeposit Security deposit amount
     * @param duration Rental duration in seconds
     * @param itemDescription Description of the item being rented
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        address lender,
        uint256 rentalAmount,
        uint256 securityDeposit,
        uint256 duration,
        string calldata itemDescription
    ) external onlyVerified whenNotPaused returns (uint256) {
        if (lender == address(0) || lender == msg.sender) revert InvalidAmount();
        if (!soulboundToken.isVerified(lender)) revert UnauthorizedAccess();
        if (rentalAmount == 0) revert InvalidAmount();
        if (duration < MIN_RENTAL_DURATION || duration > MAX_RENTAL_DURATION) {
            revert InvalidRentalDuration();
        }
        
        uint256 escrowId = _escrowIdCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        
        escrows[escrowId] = EscrowAgreement({
            borrower: msg.sender,
            lender: lender,
            rentalAmount: rentalAmount,
            securityDeposit: securityDeposit,
            startTime: startTime,
            endTime: endTime,
            createdAt: block.timestamp,
            state: EscrowState.Created,
            itemDescription: itemDescription,
            lenderConfirmed: false,
            borrowerConfirmed: false
        });
        
        // Track user escrows
        userEscrows[msg.sender].push(escrowId);
        userEscrows[lender].push(escrowId);
        
        emit EscrowCreated(
            escrowId,
            msg.sender,
            lender,
            rentalAmount,
            securityDeposit,
            startTime,
            endTime
        );
        
        return escrowId;
    }
    
    /**
     * @dev Borrower deposits rental payment + security deposit
     * @param escrowId ID of the escrow agreement
     */
    function deposit(uint256 escrowId) external payable escrowExists(escrowId) nonReentrant {
        EscrowAgreement storage escrow = escrows[escrowId];
        
        if (msg.sender != escrow.borrower) revert UnauthorizedAccess();
        if (escrow.state != EscrowState.Created) revert InvalidEscrowState();
        
        uint256 totalRequired = escrow.rentalAmount + escrow.securityDeposit;
        if (msg.value != totalRequired) revert InsufficientDeposit();
        
        escrow.state = EscrowState.Deposited;
        
        emit DepositMade(escrowId, msg.sender, msg.value);
    }
    
    /**
     * @dev Lender confirms item handover and activates rental
     * @param escrowId ID of the escrow agreement
     */
    function activateRental(uint256 escrowId) external escrowExists(escrowId) {
        EscrowAgreement storage escrow = escrows[escrowId];
        
        if (msg.sender != escrow.lender) revert UnauthorizedAccess();
        if (escrow.state != EscrowState.Deposited) revert InvalidEscrowState();
        
        escrow.state = EscrowState.Active;
        escrow.lenderConfirmed = true;
        
        emit RentalActivated(escrowId, msg.sender);
    }
    
    /**
     * @dev Release payment to lender after rental completion
     * @param escrowId ID of the escrow agreement
     */
    function releaseToLender(uint256 escrowId) external escrowExists(escrowId) nonReentrant {
        EscrowAgreement storage escrow = escrows[escrowId];
        
        if (msg.sender != escrow.lender) revert UnauthorizedAccess();
        if (escrow.state != EscrowState.Active) revert InvalidEscrowState();
        if (block.timestamp < escrow.endTime) revert RentalNotEnded();
        
        escrow.state = EscrowState.Completed;
        
        // Calculate platform fee
        uint256 platformFee = (escrow.rentalAmount * platformFeePercentage) / 10000;
        uint256 lenderAmount = escrow.rentalAmount - platformFee;
        
        // Update collected fees
        collectedFees += platformFee;
        
        // Transfer payment to lender
        (bool success, ) = escrow.lender.call{value: lenderAmount}("");
        if (!success) revert TransferFailed();
        
        // Return security deposit to borrower
        (bool depositSuccess, ) = escrow.borrower.call{value: escrow.securityDeposit}("");
        if (!depositSuccess) revert TransferFailed();
        
        emit PaymentReleased(escrowId, escrow.lender, lenderAmount, platformFee);
        emit SecurityDepositReturned(escrowId, escrow.borrower, escrow.securityDeposit);
    }
    
    /**
     * @dev Raise a dispute
     * @param escrowId ID of the escrow agreement
     * @param reason Reason for the dispute
     */
    function raiseDispute(uint256 escrowId, string calldata reason) external escrowExists(escrowId) {
        EscrowAgreement storage escrow = escrows[escrowId];
        
        if (msg.sender != escrow.borrower && msg.sender != escrow.lender) {
            revert UnauthorizedAccess();
        }
        if (escrow.state != EscrowState.Active) revert InvalidEscrowState();
        if (block.timestamp > escrow.endTime + DISPUTE_TIMEOUT) {
            revert DisputeTimeoutExceeded();
        }
        
        escrow.state = EscrowState.Disputed;
        
        emit DisputeRaised(escrowId, msg.sender, reason);
    }
    
    /**
     * @dev Resolve dispute (only owner/admin)
     * @param escrowId ID of the escrow agreement
     * @param favorBorrower True if ruling in favor of borrower
     */
    function resolveDispute(uint256 escrowId, bool favorBorrower) external onlyOwner escrowExists(escrowId) nonReentrant {
        EscrowAgreement storage escrow = escrows[escrowId];
        
        if (escrow.state != EscrowState.Disputed) revert InvalidEscrowState();
        
        if (favorBorrower) {
            // Refund everything to borrower
            escrow.state = EscrowState.Refunded;
            uint256 refundAmount = escrow.rentalAmount + escrow.securityDeposit;
            
            (bool success, ) = escrow.borrower.call{value: refundAmount}("");
            if (!success) revert TransferFailed();
            
            emit RefundIssued(escrowId, escrow.borrower, refundAmount);
        } else {
            // Pay lender and return security deposit
            escrow.state = EscrowState.Completed;
            
            uint256 platformFee = (escrow.rentalAmount * platformFeePercentage) / 10000;
            uint256 lenderAmount = escrow.rentalAmount - platformFee;
            
            collectedFees += platformFee;
            
            (bool lenderSuccess, ) = escrow.lender.call{value: lenderAmount}("");
            if (!lenderSuccess) revert TransferFailed();
            
            (bool borrowerSuccess, ) = escrow.borrower.call{value: escrow.securityDeposit}("");
            if (!borrowerSuccess) revert TransferFailed();
            
            emit PaymentReleased(escrowId, escrow.lender, lenderAmount, platformFee);
            emit SecurityDepositReturned(escrowId, escrow.borrower, escrow.securityDeposit);
        }
        
        emit DisputeResolved(escrowId, msg.sender, favorBorrower);
    }
    
    /**
     * @dev Cancel escrow before deposit (only borrower or lender)
     * @param escrowId ID of the escrow agreement
     */
    function cancelEscrow(uint256 escrowId) external escrowExists(escrowId) {
        EscrowAgreement storage escrow = escrows[escrowId];
        
        if (msg.sender != escrow.borrower && msg.sender != escrow.lender) {
            revert UnauthorizedAccess();
        }
        if (escrow.state != EscrowState.Created) revert InvalidEscrowState();
        
        escrow.state = EscrowState.Cancelled;
        
        emit EscrowCancelled(escrowId, msg.sender);
    }
    
    /**
     * @dev Get escrow details
     * @param escrowId ID of the escrow agreement
     * @return EscrowAgreement The escrow agreement details
     */
    function getEscrow(uint256 escrowId) external view escrowExists(escrowId) returns (EscrowAgreement memory) {
        return escrows[escrowId];
    }
    
    /**
     * @dev Get user's escrow IDs
     * @param user Address of the user
     * @return uint256[] Array of escrow IDs
     */
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }
    
    /**
     * @dev Withdraw platform fees (only owner)
     * @param to Address to withdraw to
     */
    function withdrawFees(address to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAmount();
        
        uint256 amount = collectedFees;
        collectedFees = 0;
        
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Update platform fee percentage (only owner)
     * @param newFeePercentage New fee percentage in basis points
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        if (newFeePercentage > 1000) revert InvalidAmount(); // Max 10%
        platformFeePercentage = newFeePercentage;
    }
    
    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get total number of escrows created
     * @return uint256 Total escrow count
     */
    function getTotalEscrows() external view returns (uint256) {
        return _escrowIdCounter;
    }
    
    /**
     * @dev Emergency withdrawal (only owner, when paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused nonReentrant {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert TransferFailed();
    }
}
