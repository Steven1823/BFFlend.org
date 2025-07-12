// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SoulboundToken.sol";

contract SoulboundTokenTest is Test {
    SoulboundToken public soulboundToken;
    address public owner;
    address public user1;
    address public user2;
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        soulboundToken = new SoulboundToken();
    }
    
    function testMintTo() public {
        soulboundToken.mintTo(user1);
        
        assertTrue(soulboundToken.isVerified(user1));
        assertEq(soulboundToken.balanceOf(user1), 1);
        assertEq(soulboundToken.ownerOf(0), user1);
    }
    
    function testCannotMintToSameUserTwice() public {
        soulboundToken.mintTo(user1);
        
        vm.expectRevert(SoulboundToken.UserAlreadyVerified.selector);
        soulboundToken.mintTo(user1);
    }
    
    function testCannotTransfer() public {
        soulboundToken.mintTo(user1);
        
        vm.prank(user1);
        vm.expectRevert(SoulboundToken.TokenNotTransferable.selector);
        soulboundToken.transferFrom(user1, user2, 0);
    }
    
    function testRevokeVerification() public {
        soulboundToken.mintTo(user1);
        assertTrue(soulboundToken.isVerified(user1));
        
        soulboundToken.revokeVerification(user1);
        assertFalse(soulboundToken.isVerified(user1));
        assertEq(soulboundToken.balanceOf(user1), 0);
    }
}