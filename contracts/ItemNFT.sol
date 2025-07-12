// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SoulboundToken.sol";

/**
 * @title ItemNFT
 * @dev ERC721 NFT representing rental items on the FriendLend platform
 * @notice Each NFT represents a unique item available for rent
 * 
 * Key Features:
 * - Represents rental items as NFTs
 * - Includes metadata (price, location, availability)
 * - Integration with KYC verification
 * - Rental status tracking
 * - Category and condition management
 * 
 * Use Cases:
 * - Tokenize rental items for better tracking
 * - Enable future marketplace features
 * - Integrate with external platforms
 * - Provide ownership verification
 */
contract ItemNFT is ERC721URIStorage, Ownable, Pausable {
    using Strings for uint256;
    
    /// @dev Reference to the SoulboundToken contract
    SoulboundToken public immutable soulboundToken;
    
    /// @dev Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @dev Item status enum
    enum ItemStatus {
        Available,    // Item is available for rent
        Rented,      // Item is currently rented
        Maintenance, // Item is under maintenance
        Inactive     // Item is not available
    }
    
    /// @dev Item categories
    enum ItemCategory {
        Electronics,
        Vehicles,
        Tools,
        Furniture,
        Sports,
        Books,
        Clothing,
        Other
    }
    
    /// @dev Item condition
    enum ItemCondition {
        New,
        Excellent,
        Good,
        Fair,
        Poor
    }
    
    /// @dev Item metadata structure
    struct ItemMetadata {
        address owner;              // Item owner
        string title;              // Item title
        string description;        // Item description
        string imageURI;          // Image URI (IPFS or HTTP)
        uint256 pricePerDay;      // Daily rental price in wei
        uint256 securityDeposit;  // Required security deposit
        string location;          // Item location (city, country)
        ItemCategory category;    // Item category
        ItemCondition condition;  // Item condition
        ItemStatus status;        // Current status
        uint256 createdAt;        // Creation timestamp
        uint256 totalRentals;     // Total number of rentals
        uint256 totalEarnings;    // Total earnings from rentals
        bool isActive;           // Whether item is active
    }
    
    /// @dev Mapping from token ID to metadata
    mapping(uint256 => ItemMetadata) public itemMetadata;
    
    /// @dev Mapping from owner to their item token IDs
    mapping(address => uint256[]) public ownerItems;
    
    /// @dev Mapping from category to item token IDs
    mapping(ItemCategory => uint256[]) public categoryItems;
    
    /// @dev Mapping from location to item token IDs
    mapping(string => uint256[]) public locationItems;
    
    /// @dev Base URI for metadata
    string private _baseTokenURI;
    
    // Events
    event ItemListed(
        uint256 indexed tokenId,
        address indexed owner,
        string title,
        uint256 pricePerDay,
        ItemCategory category,
        string location
    );
    
    event ItemUpdated(
        uint256 indexed tokenId,
        uint256 newPrice,
        ItemStatus newStatus
    );
    
    event ItemRented(
        uint256 indexed tokenId,
        address indexed renter,
        uint256 startTime,
        uint256 endTime
    );
    
    event ItemReturned(
        uint256 indexed tokenId,
        address indexed renter,
        uint256 returnTime
    );
    
    event ItemDelisted(
        uint256 indexed tokenId,
        address indexed owner
    );
    
    /// @dev Custom errors
    error UnauthorizedAccess();
    error InvalidPrice();
    error InvalidAddress();
    error ItemNotAvailable();
    error ItemNotExists();
    error InvalidCategory();
    error InvalidCondition();
    error InvalidStatus();
    error StringTooLong();
    
    /// @dev Modifier to ensure only verified users can interact
    modifier onlyVerified() {
        if (!soulboundToken.isVerified(msg.sender)) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    /// @dev Modifier to check if token exists
    modifier tokenExists(uint256 tokenId) {
        if (tokenId >= _tokenIdCounter) revert ItemNotExists();
        _;
    }
    
    /// @dev Modifier to check item ownership
    modifier onlyItemOwner(uint256 tokenId) {
        if (itemMetadata[tokenId].owner != msg.sender) {
            revert UnauthorizedAccess();
        }
        _;
    }
    
    constructor(
        address _soulboundToken,
        string memory baseURI
    ) ERC721("FriendLend Items", "FLI") Ownable(msg.sender) {
        soulboundToken = SoulboundToken(_soulboundToken);
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev List a new item for rent
     * @param title Item title
     * @param description Item description
     * @param imageURI Image URI
     * @param pricePerDay Daily rental price
     * @param securityDeposit Required security deposit
     * @param location Item location
     * @param category Item category
     * @param condition Item condition
     * @return tokenId The ID of the minted NFT
     */
    function listItem(
        string calldata title,
        string calldata description,
        string calldata imageURI,
        uint256 pricePerDay,
        uint256 securityDeposit,
        string calldata location,
        ItemCategory category,
        ItemCondition condition
    ) external onlyVerified whenNotPaused returns (uint256) {
        if (pricePerDay == 0) revert InvalidPrice();
        if (bytes(title).length == 0 || bytes(title).length > 100) revert StringTooLong();
        if (bytes(description).length > 1000) revert StringTooLong();
        if (bytes(location).length == 0 || bytes(location).length > 50) revert StringTooLong();
        if (uint256(category) > uint256(ItemCategory.Other)) revert InvalidCategory();
        if (uint256(condition) > uint256(ItemCondition.Poor)) revert InvalidCondition();
        
        uint256 tokenId = _tokenIdCounter++;
        
        // Create metadata
        itemMetadata[tokenId] = ItemMetadata({
            owner: msg.sender,
            title: title,
            description: description,
            imageURI: imageURI,
            pricePerDay: pricePerDay,
            securityDeposit: securityDeposit,
            location: location,
            category: category,
            condition: condition,
            status: ItemStatus.Available,
            createdAt: block.timestamp,
            totalRentals: 0,
            totalEarnings: 0,
            isActive: true
        });
        
        // Track ownership and categories
        ownerItems[msg.sender].push(tokenId);
        categoryItems[category].push(tokenId);
        locationItems[location].push(tokenId);
        
        // Mint the NFT
        _safeMint(msg.sender, tokenId);
        
        // Set token URI
        string memory tokenURI = string(abi.encodePacked(
            _baseTokenURI,
            tokenId.toString(),
            ".json"
        ));
        _setTokenURI(tokenId, tokenURI);
        
        emit ItemListed(
            tokenId,
            msg.sender,
            title,
            pricePerDay,
            category,
            location
        );
        
        return tokenId;
    }
    
    /**
     * @dev Update item details
     * @param tokenId Token ID to update
     * @param newPrice New daily rental price
     * @param newStatus New item status
     */
    function updateItem(
        uint256 tokenId,
        uint256 newPrice,
        ItemStatus newStatus
    ) external tokenExists(tokenId) onlyItemOwner(tokenId) {
        if (newPrice == 0) revert InvalidPrice();
        if (uint256(newStatus) > uint256(ItemStatus.Inactive)) revert InvalidStatus();
        
        ItemMetadata storage metadata = itemMetadata[tokenId];
        metadata.pricePerDay = newPrice;
        metadata.status = newStatus;
        
        emit ItemUpdated(tokenId, newPrice, newStatus);
    }
    
    /**
     * @dev Mark item as rented (called by escrow contract)
     * @param tokenId Token ID to mark as rented
     * @param renter Address of the renter
     * @param startTime Rental start time
     * @param endTime Rental end time
     */
    function markAsRented(
        uint256 tokenId,
        address renter,
        uint256 startTime,
        uint256 endTime
    ) external tokenExists(tokenId) {
        // TODO: Add access control for escrow contract
        // This should only be callable by the escrow contract
        ItemMetadata storage metadata = itemMetadata[tokenId];
        
        if (metadata.status != ItemStatus.Available) revert ItemNotAvailable();
        
        metadata.status = ItemStatus.Rented;
        metadata.totalRentals++;
        
        emit ItemRented(tokenId, renter, startTime, endTime);
    }
    
    /**
     * @dev Mark item as returned (called by escrow contract)
     * @param tokenId Token ID to mark as returned
     * @param renter Address of the renter
     * @param earnings Amount earned from this rental
     */
    function markAsReturned(
        uint256 tokenId,
        address renter,
        uint256 earnings
    ) external tokenExists(tokenId) {
        // TODO: Add access control for escrow contract
        ItemMetadata storage metadata = itemMetadata[tokenId];
        
        metadata.status = ItemStatus.Available;
        metadata.totalEarnings += earnings;
        
        emit ItemReturned(tokenId, renter, block.timestamp);
    }
    
    /**
     * @dev Delist item (burn NFT)
     * @param tokenId Token ID to delist
     */
    function delistItem(uint256 tokenId) external tokenExists(tokenId) onlyItemOwner(tokenId) {
        ItemMetadata storage metadata = itemMetadata[tokenId];
        
        if (metadata.status == ItemStatus.Rented) revert ItemNotAvailable();
        
        metadata.isActive = false;
        
        // Remove from tracking arrays
        _removeFromOwnerItems(msg.sender, tokenId);
        _removeFromCategoryItems(metadata.category, tokenId);
        _removeFromLocationItems(metadata.location, tokenId);
        
        // Burn the NFT
        _burn(tokenId);
        
        emit ItemDelisted(tokenId, msg.sender);
    }
    
    /**
     * @dev Get item metadata
     * @param tokenId Token ID
     * @return ItemMetadata Item metadata
     */
    function getItemMetadata(uint256 tokenId) external view tokenExists(tokenId) returns (ItemMetadata memory) {
        return itemMetadata[tokenId];
    }
    
    /**
     * @dev Get items by owner
     * @param owner Owner address
     * @return uint256[] Array of token IDs
     */
    function getItemsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerItems[owner];
    }
    
    /**
     * @dev Get items by category
     * @param category Item category
     * @return uint256[] Array of token IDs
     */
    function getItemsByCategory(ItemCategory category) external view returns (uint256[] memory) {
        return categoryItems[category];
    }
    
    /**
     * @dev Get items by location
     * @param location Location string
     * @return uint256[] Array of token IDs
     */
    function getItemsByLocation(string calldata location) external view returns (uint256[] memory) {
        return locationItems[location];
    }
    
    /**
     * @dev Get available items for rent
     * @return uint256[] Array of available token IDs
     */
    function getAvailableItems() external view returns (uint256[] memory) {
        uint256[] memory available = new uint256[](_tokenIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (itemMetadata[i].status == ItemStatus.Available && itemMetadata[i].isActive) {
                available[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = available[i];
        }
        
        return result;
    }
    
    /**
     * @dev Set base URI for metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Get base URI
     * @return string Base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
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
     * @dev Get total number of items
     * @return uint256 Total item count
     */
    function totalItems() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Remove token from owner's items array
     */
    function _removeFromOwnerItems(address owner, uint256 tokenId) internal {
        uint256[] storage items = ownerItems[owner];
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i] == tokenId) {
                items[i] = items[items.length - 1];
                items.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Remove token from category items array
     */
    function _removeFromCategoryItems(ItemCategory category, uint256 tokenId) internal {
        uint256[] storage items = categoryItems[category];
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i] == tokenId) {
                items[i] = items[items.length - 1];
                items.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Remove token from location items array
     */
    function _removeFromLocationItems(string memory location, uint256 tokenId) internal {
        uint256[] storage items = locationItems[location];
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i] == tokenId) {
                items[i] = items[items.length - 1];
                items.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Override _update to prevent transfers when item is rented
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        // Prevent transfers when item is rented
        if (tokenId < _tokenIdCounter) {
            ItemMetadata storage metadata = itemMetadata[tokenId];
            if (metadata.status == ItemStatus.Rented && to != address(0)) {
                revert ItemNotAvailable();
            }
        }
        
        return super._update(to, tokenId, auth);
    }
}