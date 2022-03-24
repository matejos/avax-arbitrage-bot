import { Contract } from 'ethers'

export type SetupResult = {
    firstPair: Contract
    secondPair: Contract
    flashSwapFirst: string
    flashSwapSecond: string
    tokens: {
        token0: string
        token1: string
    }
}
