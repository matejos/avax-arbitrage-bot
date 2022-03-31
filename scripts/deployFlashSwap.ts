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

    if (!firstDexFactory) {
        throw '1st DEX factory address missing in namedAccounts!'
    } else if (!secondDexRouter) {
        throw '2nd DEX router address missing in namedAccounts!'
    }

    return await deploy(`FlashSwap${firstDex}${secondDex}`, {
        from: namedAccounts.deployer,
        contract: FlashSwapContractNames[firstDex],
        log: true,
        args: [firstDexFactory, secondDexRouter],
    })
}

export default deployFlashSwap
