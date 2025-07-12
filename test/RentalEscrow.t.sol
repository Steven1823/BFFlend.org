// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/SoulboundToken.sol";
import "../contracts/RentalEscrow.sol";

contract RentalEscrowTest is Test {
    SoulboundToken public soulboundToken;
    RentalEscrow public rentalEscrow;
    
    address public owner;
    address public borrower;
    address public lender;
    
    function setUp() public {
        owner = address(this);
        borrower = address(0x1);
        lender = address(0x2);
        
        soulboundToken = new SoulboundToken();
        rentalEscrow = new RentalEscrow(address(soulboundToken));
        
        // Verify users
        soulboundToken.mintTo(borrower);
        soulboundToken.mintTo(lender);
        
        // Fund accounts
        vm.deal(borrower, 10 ether);
        vm.deal(lender, 10 ether);
    }
    
    function testCreateEscrow() public {
        vm.prank(borrower);
        uint256 escrowId = rentalEscrow.createEscrow(
            lender,
            1 ether,  // rental amount
            0.5 ether, // security deposit
            86400,    // 1 day
            "Test item"
        );
        
        RentalEscrow.EscrowAgreement memory escrow = rentalEscrow.getEscrow(escrowId);
        assertEq(escrow.borrower, borrower);
        assertEq(escrow.lender, lender);
        assertEq(escrow.rentalAmount, 1 ether);
        assertEq(escrow.securityDeposit, 0.5 ether);
    }
    
    function testDepositAndActivate() public {
        vm.prank(borrower);
        uint256 escrowId = rentalEscrow.createEscrow(
            lender,
            1 ether,
            0.5 ether,
            86400,
            "Test item"
        );
        
        // Borrower deposits
        vm.prank(borrower);
        rentalEscrow.deposit{value: 1.5 ether}(escrowId);
        
        // Lender activates rental
        vm.prank(lender);
        rentalEscrow.activateRental(escrowId);
        
        RentalEscrow.EscrowAgreement memory escrow = rentalEscrow.getEscrow(escrowId);
        assertEq(uint256(escrow.state), uint256(RentalEscrow.EscrowState.Active));
    }
    
    function testCompleteRental() public {
        vm.prank(borrower);
        uint256 escrowId = rentalEscrow.createEscrow(
            lender,
            1 ether,
            0.5 ether,
            86400,
            "Test item"
        );
        
        vm.prank(borrower);
        rentalEscrow.deposit{value: 1.5 ether}(escrowId);
        
        vm.prank(lender);
        rentalEscrow.activateRental(escrowId);
        
        // Fast forward time
        vm.warp(block.timestamp + 86401);
        
        uint256 lenderBalanceBefore = lender.balance;
        uint256 borrowerBalanceBefore = borrower.balance;
        
        vm.prank(lender);
        rentalEscrow.releaseToLender(escrowId);
        
        // Check balances (accounting for platform fee)
        uint256 platformFee = (1 ether * 250) / 10000; // 2.5%
        uint256 lenderAmount = 1 ether - platformFee;
        
        assertEq(lender.balance, lenderBalanceBefore + lenderAmount);
        assertEq(borrower.balance, borrowerBalanceBefore + 0.5 ether); // Security deposit returned
    }
}