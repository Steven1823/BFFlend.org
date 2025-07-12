// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SoulboundToken
 * @dev A non-transferable ERC721 token (Soulbound Token) for KYC verification
 * @notice This contract issues identity tokens to verified users after KYC completion
 * 
 * Key Features:
 * - Non-transferable: Once minted, tokens cannot be transferred between addresses
 * - KYC Verification: Represents verified user identity on-chain
 * - Admin Control: Only admin can mint new tokens
 * - Pausable: Contract can be paused for maintenance
 * 
 * Use Cases:
 * - Verify user identity for platform access
 * - Gate certain functions to verified users only
 * - Build trust in P2P rental marketplace
 */
contract SoulboundToken is ERC721, Ownable, Pausable {
    /// @dev Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @dev Mapping to track verified addresses
    mapping(address => bool) public verifiedUsers;
    
    /// @dev Mapping from token ID to user address (for easy lookup)
    mapping(uint256 => address) public tokenToUser;
    
    /// @dev Mapping from user address to token ID
    mapping(address => uint256) public userToToken;
    
    // Events
    event UserVerified(address indexed user, uint256 indexed tokenId);
    event UserRevoked(address indexed user, uint256 indexed tokenId);
    
    /// @dev Custom errors for better gas efficiency
    error TokenNotTransferable();
    error UserAlreadyVerified();
    error UserNotVerified();
    error InvalidAddress();
    
    constructor() ERC721("FriendLend Identity", "FLID") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a soulbound token to a user after KYC verification
     * @param to Address to mint the token to
     * @notice Only admin can call this function
     * @notice User must not already have a token
     */
    function mintTo(address to) external onlyOwner whenNotPaused {
        if (to == address(0)) revert InvalidAddress();
        if (verifiedUsers[to]) revert UserAlreadyVerified();
        
        uint256 tokenId = _tokenIdCounter++;
        
        // Update state
        verifiedUsers[to] = true;
        tokenToUser[tokenId] = to;
        userToToken[to] = tokenId;
        
        // Mint the token
        _safeMint(to, tokenId);
        
        emit UserVerified(to, tokenId);
    }
    
    /**
     * @dev Revoke verification and burn the token
     * @param user Address to revoke verification from
     * @notice Only admin can call this function
     */
    function revokeVerification(address user) external onlyOwner {
        if (!verifiedUsers[user]) revert UserNotVerified();
        
        uint256 tokenId = userToToken[user];
        
        // Update state
        verifiedUsers[user] = false;
        delete tokenToUser[tokenId];
        delete userToToken[user];
        
        // Burn the token
        _burn(tokenId);
        
        emit UserRevoked(user, tokenId);
    }
    
    /**
     * @dev Check if an address is verified
     * @param user Address to check
     * @return bool True if user is verified
     */
    function isVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }
    
    /**
     * @dev Get token ID for a user
     * @param user Address to get token ID for
     * @return uint256 Token ID (0 if not verified)
     */
    function getTokenId(address user) external view returns (uint256) {
        return userToToken[user];
    }
    
    /**
     * @dev Get user address for a token ID
     * @param tokenId Token ID to get user for
     * @return address User address
     */
    function getUser(uint256 tokenId) external view returns (address) {
        return tokenToUser[tokenId];
    }
    
    /**
     * @dev Modifier to restrict access to verified users only
     */
    modifier onlyVerified() {
        if (!verifiedUsers[msg.sender]) revert UserNotVerified();
        _;
    }
    
    /**
     * @dev Override transfer functions to make tokens non-transferable
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert TokenNotTransferable();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Override approve to prevent approvals
     */
    function approve(address, uint256) public pure override {
        revert TokenNotTransferable();
    }
    
    /**
     * @dev Override setApprovalForAll to prevent approvals
     */
    function setApprovalForAll(address, bool) public pure override {
        revert TokenNotTransferable();
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
     * @dev Get total number of verified users
     * @return uint256 Total token count
     */
    function totalVerifiedUsers() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Override tokenURI to return metadata
     * @param tokenId Token ID
     * @return string Token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        // TODO: Implement proper metadata URI
        // This should point to IPFS or centralized metadata service
        return string(abi.encodePacked(
            "https://api.friendlend.com/metadata/identity/",
            toString(tokenId)
        ));
    }
    
    /**
     * @dev Convert uint256 to string
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
