// SPDX-License-Identifier: MIT
pragma solidity >= 0.6.12;

import "@pangolindex/exchange-contracts/contracts/pangolin-periphery/libraries/PangolinLibrary.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-core/interfaces/IPangolinCallee.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-core/interfaces/IPangolinPair.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-core/interfaces/IERC20.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-lib/libraries/TransferHelper.sol";

import '@pangolindex/exchange-contracts/contracts/pangolin-periphery/interfaces/IPangolinRouter.sol';

contract FlashSwapPangolin is IPangolinCallee {
    IPangolinRouter immutable router;
    address immutable factory;
    uint constant deadline = 1 days;

    constructor(address _factory, address _router) public {
        router = IPangolinRouter(_router);
        factory = _factory;
    }

    // gets tokensA via V2 flash swap from first dex, swaps for required amount of tokensB via router of second dex,
    // repays, and keeps the rest!
    function pangolinCall(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        address[] memory path = new address[](2);
        uint amountToken;
        { // scope for token{0,1}, avoids stack too deep errors
        address token0 = IPangolinPair(msg.sender).token0();
        address token1 = IPangolinPair(msg.sender).token1();
        assert(msg.sender == PangolinLibrary.pairFor(factory, token0, token1)); // ensure that msg.sender is actually a V2 pair
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
        uint amountRequired = PangolinLibrary.getAmountsIn(factory, amountToken, pathReverse)[0];
        uint amountReceived = router.swapTokensForExactTokens(amountRequired, amountToken, path, msg.sender, block.timestamp + deadline)[0];

        TransferHelper.safeTransfer(address(token), sender, amountToken - amountReceived); // send me the profits!
    }
}