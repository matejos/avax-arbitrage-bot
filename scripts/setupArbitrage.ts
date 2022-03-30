import { getNamedAccounts, network, artifacts, ethers } from 'hardhat'
import { isLocalEnv } from './utility'
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json'
import { SetupResult } from './types'
import {
    Tokens,
    DEX,
    FactoryNamedAccounts,
    FlashSwapContractNames,
    RouterNamedAccounts,
} from './constants'

const setupArbitrage = async (
    firstToken: Tokens,
    secondToken: Tokens,
    firstDex: DEX,
    secondDex: DEX
): Promise<SetupResult> => {
    const namedAccounts = await getNamedAccounts()
    const signers = await ethers.getSigners()
    let flashSwapFirst, flashSwapSecond

    if (isLocalEnv(network.name)) {
        const FlashSwapFirst = await ethers.getContractFactory(FlashSwapContractNames[firstDex])
        const flashSwapFirstDeployed = await FlashSwapFirst.deploy(
            namedAccounts[FactoryNamedAccounts[firstDex]],
            namedAccounts[RouterNamedAccounts[secondDex]]
        )
        console.log('flashSwapFirstDeployed.address', flashSwapFirstDeployed.address)
        flashSwapFirst = flashSwapFirstDeployed.address
        const FlashSwapSecond = await ethers.getContractFactory(FlashSwapContractNames[secondDex])
        const flashSwapSecondDeployed = await FlashSwapSecond.deploy(
            namedAccounts[FactoryNamedAccounts[secondDex]],
            namedAccounts[RouterNamedAccounts[firstDex]]
        )
        flashSwapSecond = flashSwapSecondDeployed.address
        console.log('flashSwapSecondDeployed.address', flashSwapSecondDeployed.address)
    } else {
        flashSwapFirst = namedAccounts[`flashSwap${firstDex}${secondDex}`]
        flashSwapSecond = namedAccounts[`flashSwap${secondDex}${firstDex}`]
    }

    const IPangolinPairArtifact = await artifacts.readArtifact('IPangolinPair')

    const firstFactoryContract = new ethers.Contract(
        namedAccounts[FactoryNamedAccounts[firstDex]],
        IPangolinFactoryArtifact.abi, // todo
        signers[0]
    )

    const secondFactoryContract = new ethers.Contract(
        namedAccounts[FactoryNamedAccounts[secondDex]],
        IPangolinFactoryArtifact.abi, // todo
        signers[0]
    )

    const firstTokenAddress = namedAccounts[firstToken]
    const secondTokenAddress = namedAccounts[secondToken]
    const firstPair = new ethers.Contract(
        await firstFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi,
        signers[0]
    )

    const secondPair = new ethers.Contract(
        await secondFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi,
        signers[0]
    )

    const tokens =
        firstTokenAddress < secondTokenAddress
            ? { token0: firstToken, token1: secondToken }
            : { token0: secondToken, token1: firstToken }

    return {
        firstPair,
        secondPair,
        flashSwapFirst,
        flashSwapSecond,
        tokens,
    }
}

export default setupArbitrage
