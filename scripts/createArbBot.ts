import setupArbitrage from './setupArbitrage'
import executeFlashSwap from './executeFlashSwap'
import { DEX, Tokens } from './constants'
import { ethers, network } from 'hardhat'
import { isLocalEnv } from './utility'

const createAndStartArbBot = async (
    firstToken: Tokens,
    secondToken: Tokens,
    firstDex: DEX,
    secondDex: DEX
) => {
    const setup = await setupArbitrage(firstToken, secondToken, firstDex, secondDex)
    console.log(`${firstToken}-${secondToken}:${firstDex}-${secondDex} Bot started!`)
    ethers.provider.on('block', async (blockNumber) => {
        console.log('block', blockNumber)
        await executeFlashSwap(setup)
        if (isLocalEnv(network.name)) {
            ethers.provider.off('block')
        }
    })
}

export default createAndStartArbBot
