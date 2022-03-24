import { Contract } from 'ethers'
import { ethers, getNamedAccounts } from 'hardhat'
import { SetupResult } from './types'
import { bigNumberToNumber, calculateGasCost, expandTo18Decimals, findMaxProfit } from './utility'

const executeFlashSwap = async (setup: SetupResult): Promise<any> => {
    const { firstPair, secondPair, flashSwapFirst, flashSwapSecond, tokens } = setup

    console.log('first pair', firstPair.address)
    console.log('second pair', secondPair.address)
    const firstReserves = await firstPair.getReserves()
    const secondReserves = await secondPair.getReserves()

    const firstReserve0 = firstReserves[0]
    const firstReserve1 = firstReserves[1]
    const secondReserve0 = secondReserves[0]
    const secondReserve1 = secondReserves[1]
    const { usdt } = await getNamedAccounts()
    console.log(
        `first reserves ${ethers.utils.formatUnits(
            firstReserve0,
            tokens.token0 == usdt ? 6 : 18
        )} ${ethers.utils.formatUnits(firstReserve1, tokens.token1 == usdt ? 6 : 18)}`
    )
    console.log(
        `second reserves ${ethers.utils.formatUnits(
            secondReserve0,
            tokens.token0 == usdt ? 6 : 18
        )} ${ethers.utils.formatUnits(secondReserve1, tokens.token1 == usdt ? 6 : 18)}`
    )
    console.log('tokens.token0', tokens.token0)
    console.log('tokens.token1', tokens.token1)
    console.log('usdt', usdt)

    const priceFirst = firstReserve0 / firstReserve1
    const priceSecond = secondReserve0 / secondReserve1
    console.log('priceFirst', priceFirst)
    console.log('priceSecond', priceSecond)

    const shouldStartFirst = priceFirst > priceSecond
    console.log('Should we start with the first DEX?', shouldStartFirst)
    const spread = Math.abs((priceSecond / priceFirst - 1) * 100) - 0.6
    const maxProfitCalc = findMaxProfit({
        primaryA: shouldStartFirst ? firstReserve0 : secondReserve0,
        primaryB: shouldStartFirst ? firstReserve1 : secondReserve1,
        secondaryA: shouldStartFirst ? secondReserve0 : firstReserve0,
        secondaryB: shouldStartFirst ? secondReserve1 : firstReserve1,
    })

    // If token0 is USDT then set amount0 to  0 else set its value to 1 since its WAVAX
    const amount0 = maxProfitCalc.tokenAmount
    // If token0 is USDT then set amount1 to 1 else set its value to 0 since its USDT
    const amount1 = expandTo18Decimals(0)

    const gasCost = await calculateGasCost()

    console.log('Estimated gas cost', gasCost)
    console.log('Arbitrage amount  ', bigNumberToNumber(maxProfitCalc.tokenAmount))
    console.log('Profit prediction ', bigNumberToNumber(maxProfitCalc.profit))

    if (bigNumberToNumber(maxProfitCalc.profit) > gasCost) {
        const tx = await (shouldStartFirst ? firstPair : secondPair).swap(
            amount0,
            amount1,
            shouldStartFirst ? flashSwapFirst : flashSwapSecond,
            ethers.utils.toUtf8Bytes('1')
        )
        const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
        const logTable = {}

        logTable[tx.hash] = {
            'Block Number': await ethers.provider.getBlockNumber(),
            'Gas Limit': tx.gasLimit.toString(),
            'Gas Used': receipt && receipt.gasUsed ? receipt.gasUsed.toString() : null,
            'Gas Price': tx.gasPrice.toString(),
            'Gas Fee':
                receipt && receipt.gasUsed ? receipt.gasUsed.mul(tx.gasPrice).toString() : null,
            Profit: bigNumberToNumber(maxProfitCalc.profit),
            Net:
                receipt && receipt.gasUsed
                    ? bigNumberToNumber(maxProfitCalc.profit.sub(receipt.gasUsed.mul(tx.gasPrice)))
                    : null,
            Timestamp: new Date(Date.now()),
        }
        console.table(logTable)
    }
}

export default executeFlashSwap
