// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SoulboundToken.sol";
import "../contracts/ItemNFT.sol";

contract ItemNFTTest is Test {
    SoulboundToken public soulboundToken;
    ItemNFT public itemNFT;
    
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        soulboundToken = new SoulboundToken();
        itemNFT = new ItemNFT(address(soulboundToken), "https://api.test.com/metadata/");
        
        // Verify users
        soulboundToken.mintTo(user1);
        soulboundToken.mintTo(user2);
    }
    
    function testListItem() public {
        vm.prank(user1);
        uint256 tokenId = itemNFT.listItem(
            "Test Item",
            "A test item for rental",
            "https://example.com/image.jpg",
            1 ether,
            0.5 ether,
            "New York",
            ItemNFT.ItemCategory.Electronics,
            ItemNFT.ItemCondition.New
        );
        
        ItemNFT.ItemMetadata memory metadata = itemNFT.getItemMetadata(tokenId);
        assertEq(metadata.owner, user1);
        assertEq(metadata.title, "Test Item");
        assertEq(metadata.pricePerDay, 1 ether);
        assertEq(itemNFT.ownerOf(tokenId), user1);
    }
    
    function testUpdateItem() public {
        vm.prank(user1);
        uint256 tokenId = itemNFT.listItem(
            "Test Item",
            "Description",
            "image.jpg",
            1 ether,
            0.5 ether,
            "New York",
            ItemNFT.ItemCategory.Electronics,
            ItemNFT.ItemCondition.New
        );
        
        vm.prank(user1);
        itemNFT.updateItem(tokenId, 2 ether, ItemNFT.ItemStatus.Maintenance);
        
        ItemNFT.ItemMetadata memory metadata = itemNFT.getItemMetadata(tokenId);
        assertEq(metadata.pricePerDay, 2 ether);
        assertEq(uint256(metadata.status), uint256(ItemNFT.ItemStatus.Maintenance));
    }
    
    function testGetAvailableItems() public {
        vm.prank(user1);
        itemNFT.listItem(
            "Item 1",
            "Description",
            "image.jpg",
            1 ether,
            0.5 ether,
            "New York",
            ItemNFT.ItemCategory.Electronics,
            ItemNFT.ItemCondition.New
        );
        
        vm.prank(user2);
        itemNFT.listItem(
            "Item 2",
            "Description",
            "image.jpg",
            2 ether,
            1 ether,
            "Los Angeles",
            ItemNFT.ItemCategory.Furniture,
            ItemNFT.ItemCondition.Good
        );
        
        uint256[] memory availableItems = itemNFT.getAvailableItems();
        assertEq(availableItems.length, 2);
    }
}