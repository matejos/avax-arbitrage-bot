import { BigNumber } from 'ethers'
import { ethers, getNamedAccounts, network } from 'hardhat'
import AggregatorV3InterfaceABI from './AggregatorV3InterfaceABI'
import { Tokens } from './constants'
import { MaxProfitResult, ReservesType } from './types'

let chainLinkPricesCache: { [token in Tokens]?: BigNumber } = {}

export function setupNewBlock() {
    chainLinkPricesCache = {}
}

export function isLocalEnv(envName: string) {
    return ['hardhat', 'local'].includes(envName)
}

export function logIfLocal(...args: any[]) {
    if (isLocalEnv(network.name)) {
        console.log(...args)
    }
}

export function getNullAddress(): string {
    return '0x0000000000000000000000000000000000000000'
}

export function expandTo18Decimals(n: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

export function expandToXDecimals(n: number, expandAmount: number): BigNumber {
    return BigNumber.from(n).mul(BigNumber.from(10).pow(expandAmount))
}

export function bigNumberToNumber(number: BigNumber): number {
    try {
        return number.toNumber()
    } catch (err) {
        return +ethers.utils.formatEther(number)
    }
}

export function computeProfitForTokenAmount(x: BigNumber, reserves: ReservesType): BigNumber {
    return x.sub(
        reserves.secondaryA
            .mul(reserves.primaryB.mul(x).mul(1000).mul(1000))
            .div(reserves.primaryA.sub(x).mul(997))
            .div(
                reserves.secondaryB
                    .sub(reserves.primaryB.mul(x).mul(1000).div(reserves.primaryA.sub(x).mul(997)))
                    .mul(997)
            )
    )
}

// Find approximation of token amount with maximum profit
export function findMaxProfit(reserves: ReservesType): MaxProfitResult {
    let a = BigNumber.from(0)
    let b = (
        reserves.primaryA.lt(reserves.secondaryA) ? reserves.primaryA : reserves.secondaryA
    ).div(5)
    // 10 steps is enough for approximation
    for (let i = 0; i < 10; i++) {
        const r = a.add(b.sub(a).div(3))
        const s = b.sub(b.sub(a).div(3))
        const fr = computeProfitForTokenAmount(r, reserves)
        const fs = computeProfitForTokenAmount(s, reserves)
        const fb = computeProfitForTokenAmount(b, reserves)
        if (fr.lt(fb) && fs.lt(fb)) {
            a = s
        } else if (fr.gt(fb) && fs.gt(fb)) {
            if (fr.gt(fs)) {
                b = s
            } else {
                a = r
            }
        } else {
            a = r
        }
    }

    const tokenAmount = a.add(b).div(2)
    return {
        tokenAmount,
        profit: computeProfitForTokenAmount(tokenAmount, reserves),
    }
}

export async function getChainlinkPrice(token: Tokens): Promise<BigNumber | null> {
    try {
        if (chainLinkPricesCache[token]) return chainLinkPricesCache[token]
        const tokenChainLink = (await getNamedAccounts())[`${token}ChainLink`]
        if (!tokenChainLink) {
            return null
        }
        const priceFeed = new ethers.Contract(
            tokenChainLink,
            AggregatorV3InterfaceABI,
            ethers.provider
        )
        const roundData = await priceFeed.latestRoundData()
        const result = expandToXDecimals(bigNumberToNumber(roundData.answer), 10)
        chainLinkPricesCache[token] = result
        return result
    } catch (err) {
        // console.log('Error getting price feed from chain link', err)
        return null
    }
}

export async function calculateGasCost(): Promise<BigNumber> {
    try {
        // Get current AVAX price from Chainlink
        const avaxPrice = await getChainlinkPrice(Tokens.WAVAX)
        logIfLocal('AVAX price', bigNumberToNumber(avaxPrice))

        // Use price to calculate gas cost
        const gas = 280000
        let gasPrice = (await ethers.provider.getGasPrice()) as BigNumber

        if (gasPrice.toNumber() < 25000000000) {
            gasPrice = expandToXDecimals(25, 9) // Make sure gas price is no less then 25 gwei
        }

        const gasCost = gasPrice.mul(gas)

        logIfLocal('Max gas cost in avax', bigNumberToNumber(gasCost))

        logIfLocal(
            'Max gas cost in usd',
            bigNumberToNumber(gasCost.mul(avaxPrice).div(expandTo18Decimals(1)))
        )

        return gasCost.mul(avaxPrice).div(expandTo18Decimals(1))
    } catch (err) {
        console.log('Error while calculating gas cost', err)
    }
}
