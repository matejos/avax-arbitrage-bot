import { BigNumber } from 'ethers'
import { ethers, getNamedAccounts } from 'hardhat'
import AggregatorV3InterfaceABI from './AggregatorV3InterfaceABI'
import { Tokens } from './constants'
import { MaxProfitResult, ReservesType } from './types'

let chainLinkPricesCache: { [token in Tokens]?: BigNumber } = {}

export function setupNewBlock() {
    chainLinkPricesCache = {}
}

export function isLocalEnv(envName: string) {
    return !!(
        {
            hardhat: true,
            localhost: true,
        } as Record<string, true>
    )[envName]
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

export function findMaxProfit(reserves: ReservesType): MaxProfitResult {
    let a = BigNumber.from(0)
    let b = (
        reserves.primaryA.lt(reserves.secondaryA) ? reserves.primaryA : reserves.secondaryA
    ).div(5)
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
        console.log('AVAX price', bigNumberToNumber(avaxPrice))

        // Use price to calculate gas cost
        const gas = 240000
        let gasPrice = (await ethers.provider.getGasPrice()) as BigNumber
        const feeData = (await ethers.provider.getFeeData()) as {
            gasPrice: BigNumber
            maxFeePerGas: BigNumber
            maxPriorityFeePerGas: BigNumber
        }

        console.log('Fee Data Gas Price', feeData.gasPrice.toString())
        console.log('Fee Data Max Fee Per Gas', feeData.maxFeePerGas.toString())
        console.log('Fee Data Max Priority Fee Per Gas', feeData.maxPriorityFeePerGas.toString())

        if (gasPrice.toNumber() < 25000000000) {
            gasPrice = expandToXDecimals(25, 9) // Make sure gas price is no less then 25 gwei
        }

        const gasCost = gasPrice.mul(gas)

        console.log('Gas Price', gasPrice.toString())
        console.log('Gas Cost in avax', bigNumberToNumber(gasCost))

        console.log(
            'Gas cost in usd',
            bigNumberToNumber(gasCost.mul(avaxPrice).div(expandTo18Decimals(1)))
        )

        return gasCost.mul(avaxPrice).div(expandTo18Decimals(1))
    } catch (err) {
        console.log('Error while calculating gas cost', err)
    }
}
