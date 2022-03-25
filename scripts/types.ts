import { BigNumber, Contract } from 'ethers'
import { Tokens } from './constants'

export type SetupResult = {
    firstPair: Contract
    secondPair: Contract
    flashSwapFirst: string
    flashSwapSecond: string
    tokens: {
        token0: Tokens
        token1: Tokens
    }
}

export type MaxProfitResult = {
    tokenAmount: BigNumber
    profit: BigNumber
}

export type ReservesType = {
    primaryA: BigNumber
    primaryB: BigNumber
    secondaryA: BigNumber
    secondaryB: BigNumber
}
