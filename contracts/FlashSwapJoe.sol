// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.12;

import "hardhat/console.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoeCallee.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/libraries/JoeLibrary.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoePair.sol";
import "@traderjoe-xyz/core/contracts/interfaces/IERC20.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/libraries/TransferHelper.sol";

import '@pangolindex/exchange-contracts/contracts/pangolin-periphery/interfaces/IPangolinRouter.sol';

contract FlashSwapJoe is IJoeCallee {
    IPangolinRouter immutable router;
    address immutable factory;
    uint constant deadline = 1 days;

    constructor(address _factory, address _router) public {
        router = IPangolinRouter(_router);
        factory = _factory;
    }

    // needs to accept AVAX from any V1 exchange and WAVAX. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // gets tokensA via V2 flash swap, swaps for tokensB on other router, repays, and keeps the rest!
    function joeCall(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        address[] memory path = new address[](2);
        uint amountToken;
        { // scope for token{0,1}, avoids stack too deep errors
        address token0 = IJoePair(msg.sender).token0();
        address token1 = IJoePair(msg.sender).token1();
        assert(msg.sender == JoeLibrary.pairFor(factory, token0, token1)); // ensure that msg.sender is actually a V2 pair
        assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
        path[0] = amount0 == 0 ? token1 : token0;
        path[1] = amount0 == 0 ? token0 : token1;
        amountToken = amount0 == 0 ? amount1 : amount0;
        }

        IERC20 token = IERC20(path[0]);

        token.approve(address(router), amountToken);
        address[] memory pathReverse = new address[](2);
        pathReverse[0] = path[1];
        pathReverse[1] = path[0];
        uint amountRequired = JoeLibrary.getAmountsIn(factory, amountToken, pathReverse)[0];
        uint amountReceived = router.swapTokensForExactTokens(amountRequired, amountToken, path, msg.sender, block.timestamp + deadline)[0];

        TransferHelper.safeTransfer(address(token), sender, amountToken - amountReceived); // send me the profits!
    }
}