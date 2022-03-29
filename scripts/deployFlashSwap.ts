import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DEX, FactoryNamedAccounts, FlashSwapContractNames, RouterNamedAccounts } from './constants'

const deployFlashSwap = async function (
    hre: HardhatRuntimeEnvironment,
    firstDex: DEX,
    secondDex: DEX
) {
    const { deployments, getNamedAccounts } = hre

    const { deploy } = deployments

    const namedAccounts = await getNamedAccounts()
    const firstDexFactory = namedAccounts[FactoryNamedAccounts[firstDex]]
    const secondDexRouter = namedAccounts[RouterNamedAccounts[secondDex]]

    await deploy(`FlashSwap${firstDex}${secondDex}`, {
        from: namedAccounts.deployer,
        contract: FlashSwapContractNames[firstDex],
        log: true,
        args: [firstDexFactory, secondDexRouter],
    })
}

export default deployFlashSwap
