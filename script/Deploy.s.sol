// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/SoulboundToken.sol";
import "../contracts/RentalEscrow.sol";
import "../contracts/ItemNFT.sol";

/**
 * @title Deploy
 * @dev Deployment script for FriendLend contracts
 * @notice This script deploys all FriendLend contracts in the correct order
 * 
 * Deployment Order:
 * 1. SoulboundToken (identity verification)
 * 2. RentalEscrow (escrow service)
 * 3. ItemNFT (item tokenization)
 * 
 * Usage:
 * - Local deployment: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 * - Alfajores testnet: forge script script/Deploy.s.sol --rpc-url $ALFAJORES_RPC --broadcast --verify
 * - Celo mainnet: forge script script/Deploy.s.sol --rpc-url $CELO_RPC --broadcast --verify
 */
contract Deploy is Script {
    // Deployment configuration
    struct DeploymentConfig {
        string baseMetadataURI;
        uint256 platformFeePercentage;
        address deployer;
    }
    
    // Deployed contract addresses
    SoulboundToken public soulboundToken;
    RentalEscrow public rentalEscrow;
    ItemNFT public itemNFT;
    
    // Configuration for different networks
    mapping(uint256 => DeploymentConfig) public configs;
    
    function setUp() public {
        // Alfajores testnet configuration
        configs[44787] = DeploymentConfig({
            baseMetadataURI: "https://api.friendlend.com/metadata/items/",
            platformFeePercentage: 250, // 2.5%
            deployer: msg.sender
        });
        
        // Celo mainnet configuration
        configs[42220] = DeploymentConfig({
            baseMetadataURI: "https://api.friendlend.com/metadata/items/",
            platformFeePercentage: 250, // 2.5%
            deployer: msg.sender
        });
        
        // Local development configuration
        configs[31337] = DeploymentConfig({
            baseMetadataURI: "http://localhost:3000/metadata/items/",
            platformFeePercentage: 100, // 1% for testing
            deployer: msg.sender
        });
    }
    
    function run() public {
        uint256 chainId = block.chainid;
        DeploymentConfig memory config = configs[chainId];
        
        // Validate configuration
        require(bytes(config.baseMetadataURI).length > 0, "Invalid base URI");
        require(config.platformFeePercentage <= 1000, "Fee too high"); // Max 10%
        
        console.log("Deploying FriendLend contracts...");
        console.log("Chain ID:", chainId);
        console.log("Deployer:", msg.sender);
        console.log("Base URI:", config.baseMetadataURI);
        console.log("Platform Fee:", config.platformFeePercentage, "basis points");
        
        // Start broadcasting transactions
        vm.startBroadcast();
        
        // Deploy SoulboundToken first
        console.log("\n1. Deploying SoulboundToken...");
        soulboundToken = new SoulboundToken();
        console.log("SoulboundToken deployed at:", address(soulboundToken));
        
        // Deploy RentalEscrow with SoulboundToken address
        console.log("\n2. Deploying RentalEscrow...");
        rentalEscrow = new RentalEscrow(address(soulboundToken));
        console.log("RentalEscrow deployed at:", address(rentalEscrow));
        
        // Deploy ItemNFT with SoulboundToken address and base URI
        console.log("\n3. Deploying ItemNFT...");
        itemNFT = new ItemNFT(address(soulboundToken), config.baseMetadataURI);
        console.log("ItemNFT deployed at:", address(itemNFT));
        
        // Configure contracts
        console.log("\n4. Configuring contracts...");
        
        // Update platform fee if different from default
        if (config.platformFeePercentage != 250) {
            rentalEscrow.updatePlatformFee(config.platformFeePercentage);
            console.log("Platform fee updated to:", config.platformFeePercentage);
        }
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Chain ID", chainId);
        console.log("Deployer:", msg.sender);
        console.log("");
        console.log("SoulboundToken:", address(soulboundToken));
        console.log("RentalEscrow:", address(rentalEscrow));
        console.log("ItemNFT:", address(itemNFT));
        console.log("");
        console.log("Configuration:");
        console.log("- Base metadata URI:", config.baseMetadataURI);
        console.log("- Platform fee:", config.platformFeePercentage, "basis points");
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Update frontend configuration with contract addresses");
        console.log("3. Test basic functionality");
        console.log("4. Set up monitoring and alerts");
        console.log("");
        console.log("=== FRONTEND INTEGRATION ===");
        console.log("Add these addresses to your frontend configuration:");
        console.log("VITE_SOULBOUND_TOKEN_ADDRESS=", address(soulboundToken));
        console.log("VITE_RENTAL_ESCROW_ADDRESS=", address(rentalEscrow));
        console.log("VITE_ITEM_NFT_ADDRESS=", address(itemNFT));
        
        // Additional setup for testnet
        if (chainId == 44787) {
            console.log("");
            console.log("=== TESTNET SETUP ===");
            console.log("1. Get testnet CELO from faucet: https://faucet.celo.org");
            console.log("2. Test KYC verification process");
            console.log("3. Create test rental listings");
            console.log("4. Test escrow workflow");
        }
    }
    
    /**
     * @dev Verify deployment by checking contract states
     */
    function verifyDeployment() public view {
        console.log("\n=== DEPLOYMENT VERIFICATION ===");
        
        // Check SoulboundToken
        console.log("SoulboundToken verification:");
        console.log("- Name:", soulboundToken.name());
        console.log("- Symbol:", soulboundToken.symbol());
        console.log("- Owner:", soulboundToken.owner());
        console.log("- Total verified users:", soulboundToken.totalVerifiedUsers());
        
        // Check RentalEscrow
        console.log("\nRentalEscrow verification:");
        console.log("- SoulboundToken address:", address(rentalEscrow.soulboundToken()));
        console.log("- Platform fee:", rentalEscrow.platformFeePercentage(), "basis points");
        console.log("- Owner:", rentalEscrow.owner());
        console.log("- Total escrows:", rentalEscrow.getTotalEscrows());
        
        // Check ItemNFT
        console.log("\nItemNFT verification:");
        console.log("- Name:", itemNFT.name());
        console.log("- Symbol:", itemNFT.symbol());
        console.log("- SoulboundToken address:", address(itemNFT.soulboundToken()));
        console.log("- Owner:", itemNFT.owner());
        console.log("- Total items:", itemNFT.totalItems());
        
        console.log("\n All contracts deployed successfully!");
    }
    
    /**
     * @dev Get deployment addresses for a specific chain
     * @param chainId Chain ID to get addresses for
     * @return soulbound SoulboundToken address
     * @return escrow RentalEscrow address
     * @return items ItemNFT address
     */
    function getDeploymentAddresses(uint256 chainId) 
        public 
        pure 
        returns (
            address soulbound,
            address escrow,
            address items
        ) 
    {
        // This would be populated after deployment
        // For now, return zero addresses
        return (address(0), address(0), address(0));
    }
}