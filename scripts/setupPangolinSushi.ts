import { getNamedAccounts, network, artifacts, ethers } from 'hardhat'
import { isLocalEnv } from './utility'
import IUniswapV2FactoryAbi from '@sushiswap/core/build/abi/IUniswapV2Factory.json'
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json'

const setupPangolinSushi = async (
    firstTokenAddress: string,
    secondTokenAddress: string
    // swapFrom: ContractOptions
): Promise<any> => {
    const {
        sushiFactory,
        sushiRouter,
        pangolinFactory,
        pangolinRouter,
        // flashSwapSushiPangoAddr,
        // flashSwapPangolinSushiAddr,
    } = await getNamedAccounts()
    const signers = await ethers.getSigners()
    let flashSwapSushi, flashSwapPango

    if (isLocalEnv(network.name)) {
        // if (swapFrom === ContractOptions.SUSHI_SWAP) {
        const FlashSwapSushiPango = await ethers.getContractFactory('FlashSwapSushi')
        const flashSwapSushiPangoDeployed = await FlashSwapSushiPango.deploy(
            sushiFactory,
            pangolinRouter
        )
        flashSwapSushi = new ethers.Contract(
            flashSwapSushiPangoDeployed.address,
            flashSwapSushiPangoDeployed.interface,
            flashSwapSushiPangoDeployed.signer
        )
        // } else if (swapFrom === ContractOptions.PANGOLIN) {
        const FlashSwapPangoSushi = await ethers.getContractFactory('FlashSwapPangolin')
        const flashSwapPangoSushiDeployed = await FlashSwapPangoSushi.deploy(
            pangolinFactory,
            sushiRouter
        )
        flashSwapPango = new ethers.Contract(
            flashSwapPangoSushiDeployed.address,
            flashSwapPangoSushiDeployed.interface,
            flashSwapPangoSushiDeployed.signer
        )
        // }
    } else {
        // if (swapFrom === ContractOptions.SUSHI_SWAP) {
        //     const FlashSwapSushiPangoArtifact = await artifacts.readArtifact('FlashSwapSushiPango')
        //     flashSwapContact = new ethers.Contract(
        //         flashSwapSushiPangoAddr,
        //         FlashSwapSushiPangoArtifact.abi,
        //         signers[0]
        //     )
        // } else if (swapFrom === ContractOptions.PANGOLIN) {
        //     const FlashSwapPangolinSushiArtifact = await artifacts.readArtifact(
        //         'FlashSwapPangolinSushi'
        //     )
        //     flashSwapContact = new ethers.Contract(
        //         flashSwapPangolinSushiAddr,
        //         FlashSwapPangolinSushiArtifact.abi,
        //         signers[0]
        //     )
        // }
    }

    const IUniswapV2PairArtifact = await artifacts.readArtifact('IUniswapV2Pair')
    const IPangolinPairArtifact = await artifacts.readArtifact('IPangolinPair')

    const sushiFactoryContract = new ethers.Contract(
        sushiFactory, // Factory Address
        IUniswapV2FactoryAbi,
        signers[0]
    )

    const pangolinFactoryContract = new ethers.Contract(
        pangolinFactory, // Factory Address
        IPangolinFactoryArtifact.abi,
        signers[0]
    )

    const sushiPair = new ethers.Contract(
        await sushiFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IUniswapV2PairArtifact.abi,
        signers[0]
    )

    const pangolinPair = new ethers.Contract(
        await pangolinFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi,
        signers[0]
    )

    return {
        sushiPair,
        pangolinPair,
        flashSwapSushi,
        flashSwapPango,
    }
}

export default setupPangolinSushi
