import setupArbitrage from './setupArbitrage'
import executeFlashSwap from './executeFlashSwap'
import { DEX, Tokens } from './constants'
import { ethers, network } from 'hardhat'
import { getNullAddress, isLocalEnv, logIfLocal } from './utility'

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
    if (setup.firstPair.address == getNullAddress()) {
        throw 'Token pair not found on 1st DEX'
    } else if (setup.secondPair.address == getNullAddress()) {
        throw 'Token pair not found on 2nd DEX'
    }
    const arbStatus = new ArbitrageStatus()
    console.log(`${firstToken}-${secondToken}:${firstDex}-${secondDex} Bot started!`)
    ethers.provider.on('block', async (blockNumber) => {
        logIfLocal('block', blockNumber)
        executeFlashSwap(setup, arbStatus)
        if (isLocalEnv(network.name)) {
            ethers.provider.off('block')
        }
    })
}

export default createAndStartArbBot
