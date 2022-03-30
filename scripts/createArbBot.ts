import setupArbitrage from './setupArbitrage'
import executeFlashSwap from './executeFlashSwap'
import { DEX, Tokens } from './constants'
import { ethers, network } from 'hardhat'
import { isLocalEnv } from './utility'

export class ArbitrageStatus {
    public arbInProgress: boolean
}

const createAndStartArbBot = async (
    firstToken: Tokens,
    secondToken: Tokens,
    firstDex: DEX,
    secondDex: DEX
) => {
    const setup = await setupArbitrage(firstToken, secondToken, firstDex, secondDex)
    const arbStatus = new ArbitrageStatus()
    console.log(`${firstToken}-${secondToken}:${firstDex}-${secondDex} Bot started!`)
    ethers.provider.on('block', async (blockNumber) => {
        console.log('block', blockNumber)
        executeFlashSwap(setup, arbStatus)
        if (isLocalEnv(network.name)) {
            ethers.provider.off('block')
        }
    })
}

export default createAndStartArbBot
