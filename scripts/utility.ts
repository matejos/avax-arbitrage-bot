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
