import 'dotenv/config'
import { ethers, getNamedAccounts } from 'hardhat'
import { Contract } from 'ethers'
import setupPangolinSushi from './setupPangolinSushi'
import executeFlashSwap from './executeFlashSwap'

// const privateKey = process.env.MNEMONIC
// const flashSwapperAddress = process.env.FLASH_SWAPPER

const runBot = async () => {
    const { sushiFactory, pangolinFactory, wavax, usdt } = await getNamedAccounts()

    const { pangolinPair, sushiPair, flashSwapPango, flashSwapSushi } = await setupPangolinSushi(
        wavax,
        usdt
    )

    // const signer = (await ethers.getSigners())[0].address
    // const Wavax = await ethers.getContractAt('IWAVAX', wavax)
    // const Usdt = await ethers.getContractAt('contracts/interfaces/IERC20.sol:IERC20', usdt)

    // console.log(`wavax before: ${await Wavax.balanceOf(signer)}`)
    // console.log(`usdt  before: ${await Usdt.balanceOf(signer)}`)
    await executeFlashSwap(pangolinPair, sushiPair, flashSwapPango.address, flashSwapSushi.address)
    // console.log(`wavax  after: ${await Wavax.balanceOf(signer)}`)
    // console.log(`usdt   after: ${await Usdt.balanceOf(signer)}`)
}

console.log('Bot started!')

runBot()
