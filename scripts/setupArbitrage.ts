import { getNamedAccounts, network, artifacts, ethers } from 'hardhat'
import { isLocalEnv } from './utility'
import IUniswapV2FactoryAbi from '@sushiswap/core/build/abi/IUniswapV2Factory.json'
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json'
import { SetupResult } from './types'
import { Tokens, DEX } from './constants'

const FlashSwapContractNames: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'FlashSwapPangolin',
    [DEX.SUSHISWAP]: 'FlashSwapSushi',
    [DEX.TRADERJOE]: 'FlashSwapJoe',
}

const FactoryNamedAccounts: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'pangolinFactory',
    [DEX.SUSHISWAP]: 'sushiFactory',
    [DEX.TRADERJOE]: 'joeFactory',
}

const RouterNamedAccounts: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'pangolinRouter',
    [DEX.SUSHISWAP]: 'sushiRouter',
    [DEX.TRADERJOE]: 'joeRouter',
}

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
    } else {
        // todo
        // flashSwapFirst = flashSwapSushiPangoAddr
        // flashSwapSecond = flashSwapPangolinSushiAddr
    }

    const IUniswapV2PairArtifact = await artifacts.readArtifact('IUniswapV2Pair')
    const IPangolinPairArtifact = await artifacts.readArtifact('IPangolinPair')

    const firstFactoryContract = new ethers.Contract(
        namedAccounts[FactoryNamedAccounts[firstDex]], // Factory Address
        IUniswapV2FactoryAbi, // todo
        signers[0]
    )

    const secondFactoryContract = new ethers.Contract(
        namedAccounts[FactoryNamedAccounts[secondDex]], // Factory Address
        IPangolinFactoryArtifact.abi, // todo
        signers[0]
    )

    const firstTokenAddress = namedAccounts[firstToken]
    const secondTokenAddress = namedAccounts[secondToken]
    const firstPair = new ethers.Contract(
        await firstFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IUniswapV2PairArtifact.abi, // todo
        signers[0]
    )

    const secondPair = new ethers.Contract(
        await secondFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi, // todo
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
