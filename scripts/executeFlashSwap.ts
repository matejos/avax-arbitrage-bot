import { BigNumber } from 'ethers'
import { ethers, network } from 'hardhat'
import { Tokens } from './constants'
import { ArbitrageStatus } from './createArbBot'
import { MaxProfitResult, SetupResult } from './types'
import {
    bigNumberToNumber,
    calculateGasCost,
    expandTo18Decimals,
    expandToXDecimals,
    findMaxProfit,
    getChainlinkPrice,
    isLocalEnv,
    logIfLocal,
    setupNewBlock,
} from './utility'

const executeFlashSwap = async (setup: SetupResult, arbStatus: ArbitrageStatus): Promise<any> => {
    let arbStartedByMe = false
    try {
        setupNewBlock()

        const { firstPair, secondPair, flashSwapFirst, flashSwapSecond, tokens } = setup

        const firstReserves = await firstPair.getReserves()
        const secondReserves = await secondPair.getReserves()

        let firstReserve0 = firstReserves[0]
        let firstReserve1 = firstReserves[1]
        let secondReserve0 = secondReserves[0]
        let secondReserve1 = secondReserves[1]
        if (tokens.token0 === Tokens.USDT) {
            firstReserve0 = expandToXDecimals(+firstReserve0.toString(), 12)
            secondReserve0 = expandToXDecimals(+secondReserve0.toString(), 12)
        } else if (tokens.token1 === Tokens.USDT) {
            firstReserve1 = expandToXDecimals(+firstReserve1.toString(), 12)
            secondReserve1 = expandToXDecimals(+secondReserve1.toString(), 12)
        }
        logIfLocal(
            `1st DEX reserves ${bigNumberToNumber(firstReserve0)} ${bigNumberToNumber(
                firstReserve1
            )}`
        )
        logIfLocal(
            `2nd DEX reserves ${bigNumberToNumber(secondReserve0)} ${bigNumberToNumber(
                secondReserve1
            )}`
        )
        logIfLocal('tokens.token0', tokens.token0)
        logIfLocal('tokens.token1', tokens.token1)

        const priceFirst = firstReserve0 / firstReserve1
        const priceSecond = secondReserve0 / secondReserve1
        logIfLocal(`Price on 1st DEX`, priceFirst)
        logIfLocal(`Price on 2nd DEX`, priceSecond)

        const priceDiff = Math.abs(priceFirst / priceSecond - 1)
        logIfLocal('Price difference', priceDiff * 100)

        // Price difference must be higher than 0.6% (swapping fees)
        if (priceDiff < 0.006) {
            logIfLocal('Difference in prices too low.')
            return
        }

        const shouldStartFirstDEXForToken0 = priceFirst > priceSecond
        const reserves = {
            primaryA: shouldStartFirstDEXForToken0 ? firstReserve0 : secondReserve0,
            primaryB: shouldStartFirstDEXForToken0 ? firstReserve1 : secondReserve1,
            secondaryA: shouldStartFirstDEXForToken0 ? secondReserve0 : firstReserve0,
            secondaryB: shouldStartFirstDEXForToken0 ? secondReserve1 : firstReserve1,
        }

        let maxProfitCalcStartingToken0: MaxProfitResult,
            maxProfitCalcStartingToken1: MaxProfitResult
        let profitStartingToken0: BigNumber = null
        let profitStartingToken1: BigNumber = null

        const token0Price = await getChainlinkPrice(tokens.token0)
        if (token0Price !== null) {
            maxProfitCalcStartingToken0 = findMaxProfit(reserves)

            profitStartingToken0 = maxProfitCalcStartingToken0.profit
                .mul(token0Price)
                .div(expandTo18Decimals(1))
            logIfLocal(
                'Arbitrage amount token0 ',
                bigNumberToNumber(maxProfitCalcStartingToken0.tokenAmount)
            )
            logIfLocal(
                'Profit prediction token0 ',
                bigNumberToNumber(maxProfitCalcStartingToken0.profit)
            )
            logIfLocal('Profit prediction token0 in usd', bigNumberToNumber(profitStartingToken0))
        }

        const token1Price = await getChainlinkPrice(tokens.token1)
        if (token1Price !== null) {
            maxProfitCalcStartingToken1 = findMaxProfit({
                primaryA: reserves.secondaryB,
                primaryB: reserves.secondaryA,
                secondaryA: reserves.primaryB,
                secondaryB: reserves.primaryA,
            })

            profitStartingToken1 = maxProfitCalcStartingToken1.profit
                .mul(token1Price)
                .div(expandTo18Decimals(1))

            logIfLocal(
                'Arbitrage amount token1  ',
                bigNumberToNumber(maxProfitCalcStartingToken1.tokenAmount)
            )
            logIfLocal(
                'Profit prediction token1 ',
                bigNumberToNumber(maxProfitCalcStartingToken1.profit)
            )
            logIfLocal('Profit prediction token1 in usd', bigNumberToNumber(profitStartingToken1))
        }

        const startWithToken0 = profitStartingToken0 > profitStartingToken1
        const profitInUsd = startWithToken0 ? profitStartingToken0 : profitStartingToken1
        logIfLocal('Max projected gross gain in usd', bigNumberToNumber(profitInUsd))

        if (profitInUsd.lt(0)) {
            logIfLocal('Arbitrage not profitable.')
            return
        }

        const shouldStartFirstDEX = startWithToken0
            ? shouldStartFirstDEXForToken0
            : !shouldStartFirstDEXForToken0
        const arbitrageAmount = startWithToken0
            ? maxProfitCalcStartingToken0.tokenAmount
            : maxProfitCalcStartingToken1.tokenAmount
        logIfLocal('Should we start with token0?', startWithToken0)
        logIfLocal('Should we start with first DEX?', shouldStartFirstDEX)
        const gasCost = await calculateGasCost()
        if (profitInUsd.lt(gasCost)) {
            logIfLocal('Arbitrage not profitable after deducting gas costs.')
            return
        }

        const amount0 = startWithToken0 ? arbitrageAmount : expandTo18Decimals(0)
        const amount1 = startWithToken0 ? expandTo18Decimals(0) : arbitrageAmount

        if (arbStatus.arbInProgress) {
            logIfLocal('Arbitrage already in progress.')
            return
        }

        arbStatus.arbInProgress = true
        arbStartedByMe = true
        const tx = await (shouldStartFirstDEX ? firstPair : secondPair).swap(
            amount0,
            amount1,
            shouldStartFirstDEX ? flashSwapFirst : flashSwapSecond,
            ethers.utils.toUtf8Bytes('1'),
            isLocalEnv(network.name)
                ? {}
                : {
                      gasLimit: 280000,
                  }
        )
        arbStatus.arbInProgress = false
        const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
        const logTable = {}

        logTable[tx.hash] = {
            'Block #': await ethers.provider.getBlockNumber(),
            'Gas Limit': tx.gasLimit.toString(),
            'Gas Used': receipt && receipt.gasUsed ? receipt.gasUsed.toString() : null,
            'Gas Price': tx.gasPrice.toString(),
            'Gas Fee':
                receipt && receipt.gasUsed ? receipt.gasUsed.mul(tx.gasPrice).toString() : null,
            'Gross Gain': bigNumberToNumber(profitInUsd).toFixed(4),
            'Net Profit':
                receipt && receipt.gasUsed
                    ? bigNumberToNumber(
                          profitInUsd.sub(
                              receipt.gasUsed
                                  .mul(tx.gasPrice)
                                  .mul(await getChainlinkPrice(Tokens.WAVAX))
                                  .div(expandTo18Decimals(1))
                          )
                      ).toFixed(4)
                    : null,
            Timestamp: new Date(Date.now()),
        }
        console.table(logTable)
    } catch (err) {
        console.log('Error executing flash swap', err)
        if (arbStartedByMe) {
            arbStatus.arbInProgress = false
        }
    }
}

export default executeFlashSwap
