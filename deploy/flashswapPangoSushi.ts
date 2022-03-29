import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DEX } from '../scripts/constants'
import deployFlashSwap from '../scripts/deployFlashSwap'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    await deployFlashSwap(hre, DEX.PANGOLIN, DEX.SUSHISWAP)
}

export default func
