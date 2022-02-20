pragma solidity >= 0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol';

import './libraries/PangolinLibrary.sol';
import './interfaces/V1/IUniswapV1Factory.sol';
import './interfaces/V1/IUniswapV1Exchange.sol';
import './interfaces/IPangolinRouter.sol';
import './interfaces/IERC20.sol';
import './interfaces/IWAVAX.sol';

contract FlashSwap is IUniswapV2Callee {
    IPangolinRouter immutable router;
    address immutable factory;

    constructor(address _factory, address _router) public {
        router = IPangolinRouter(_router);
        factory = _factory;
    }

    // needs to accept AVAX from any V1 exchange and WAVAX. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // gets tokens/WAVAX via a V2 flash swap, swaps for the AVAX/tokens on V1, repays V2, and keeps the rest!
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        address[] memory path = new address[](2);
        uint amountIn;
        { // scope for token{0,1}, avoids stack too deep errors
        address token0 = IPangolinPair(msg.sender).token0();
        address token1 = IPangolinPair(msg.sender).token1();
        assert(msg.sender == PangolinLibrary.pairFor(factory, token0, token1)); // ensure that msg.sender is actually a V2 pair
        assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
        path[0] = amount0 == 0 ? token0 : token1;
        path[1] = amount0 == 0 ? token1 : token0;
        amountIn = amount0 == 0 ? amount1 : amount0;
        }

        IERC20 token0 = IERC20(path[0]);
        IERC20 token1 = IERC20(path[1]);

        (uint amountOutMin) = abi.decode(data, (uint)); // slippage parameter for V1, passed in by caller
        token0.approve(address(router), amountIn);
        uint amountReceived = router.swapExactTokensForTokens(amountIn, amountOutMin, path, msg.sender, uint(-1))[1];
        uint amountRequired = PangolinLibrary.getAmountsIn(factory, amountIn, path)[0];
        assert(amountReceived > amountRequired); // fail if we didn't get enough AVAX back to repay our flash loan
        assert(token1.transfer(msg.sender, amountRequired)); // return WAVAX to V2 pair
        assert(token1.transfer(sender, amountReceived - amountRequired)); // keep the rest! (tokens)
    }
}