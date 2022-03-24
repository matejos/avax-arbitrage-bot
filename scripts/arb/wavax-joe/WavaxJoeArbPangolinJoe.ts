import 'dotenv/config'
import { ethers, getNamedAccounts } from 'hardhat'
import { Contract } from 'ethers'
import setupPangolinSushi, { DEX } from '../../setupPangolinSushi'
import executeFlashSwap from '../../executeFlashSwap'

// const privateKey = process.env.MNEMONIC
// const flashSwapperAddress = process.env.FLASH_SWAPPER

const runBot = async () => {
    const { wavax, joe } = await getNamedAccounts()

    const setup = await setupPangolinSushi(wavax, joe, DEX.PANGOLIN, DEX.TRADERJOE)

    const signer = (await ethers.getSigners())[0].address
    const Wavax = await ethers.getContractAt('IWAVAX', wavax)
    const Joe = await ethers.getContractAt('contracts/interfaces/IERC20.sol:IERC20', joe)

    console.log(`wavax before: ${await Wavax.balanceOf(signer)}`)
    console.log(`joe   before: ${await Joe.balanceOf(signer)}`)
    await executeFlashSwap(setup)
    console.log(`wavax  after: ${await Wavax.balanceOf(signer)}`)
    console.log(`joe    after: ${await Joe.balanceOf(signer)}`)
}

console.log('Bot started!')

runBot()
