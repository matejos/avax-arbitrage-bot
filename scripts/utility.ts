import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'

export type ReservesType = {
    primaryA: BigNumber
    primaryB: BigNumber
    secondaryA: BigNumber
    secondaryB: BigNumber
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

export function findMaxProfit(reserves: ReservesType): {
    tokenAmount: BigNumber
    profit: BigNumber
} {
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

export async function calculateGasCost(): Promise<number> {
    try {
        // Get current AVAX price from Chainlink
        // const avaxPrice = await getChainlinkPrice(ChainlinkPriceOptions.AXAX)

        // Use price to calculate gas cost
        // const gas = 21000;
        const gas = 260000
        let gasPrice = (await ethers.provider.getGasPrice()) as BigNumber
        const feeData = (await ethers.provider.getFeeData()) as {
            gasPrice: BigNumber
            maxFeePerGas: BigNumber
            maxPriorityFeePerGas: BigNumber
        }

        console.log('Fee Data Gas Price', feeData.gasPrice.toString())
        console.log('Fee Data Max Fee Per Gas', feeData.maxFeePerGas.toString())
        console.log('Fee Data Max Priority Fee Per Gas', feeData.maxPriorityFeePerGas.toString())

        if (gasPrice.toNumber() < 30000000000) {
            gasPrice = expandToXDecimals(30, 9) // Make sure gas price is no less then 28 gwei
        }

        const gasCost = gasPrice.mul(gas)

        console.log('Gas Price', gasPrice.toString())
        console.log('Gas Cost w/o price', gasCost.toString())

        // console.log('Gas Cost w/o price', gasCost);
        // console.log('Gas cost with price', bigNumberToNumber(avaxPrice.mul(gasCost)))

        // return bigNumberToNumber(avaxPrice.mul(gasCost))
        return bigNumberToNumber(gasCost)
    } catch (err) {
        console.log('Error while calculating gas cost', err)
    }
}
