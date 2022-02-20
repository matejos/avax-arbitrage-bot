import 'dotenv/config'
import { ethers } from 'hardhat'
import UniswapV2Pair from '../abis/IUniswapV2Pair.json'
import UniswapV2Factory from '../abis/IUniswapV2Factory.json'
import Addresses from './addresses'
import { Contract } from 'ethers'

const privateKey = process.env.MNEMONIC
const flashSwapperAddress = process.env.FLASH_SWAPPER

const ETH_TRADE = 10
const DAI_TRADE = 3500

const runBot = async () => {
    const pangolinFactory = await ethers.getContractAt(
        UniswapV2Factory.abi,
        Addresses.PANGOLIN_FACTORY
    )
    const joeFactory = await ethers.getContractAt(UniswapV2Factory.abi, Addresses.JOE_FACTORY)

    const usdtAddress = Addresses.USDT
    const wavaxAddress = Addresses.WAVAX

    let pangolinAvaxUsdt: Contract
    let joeAvaxUsdt: Contract

    const loadPairs = async () => {
        pangolinAvaxUsdt = await ethers.getContractAt(
            UniswapV2Pair.abi,
            await pangolinFactory.getPair(wavaxAddress, usdtAddress)
        )
        joeAvaxUsdt = await ethers.getContractAt(
            UniswapV2Pair.abi,
            await joeFactory.getPair(wavaxAddress, usdtAddress)
        )
    }

    await loadPairs()

    const pangolinReserves = await pangolinAvaxUsdt.getReserves()
    const joeReserves = await joeAvaxUsdt.getReserves()

    const reserve0Pangolin = Number(ethers.utils.formatUnits(pangolinReserves[0], 18))
    const reserve1Pangolin = Number(ethers.utils.formatUnits(pangolinReserves[1], 18))
    const reserve0Joe = Number(ethers.utils.formatUnits(joeReserves[0], 18))
    const reserve1Joe = Number(ethers.utils.formatUnits(joeReserves[1], 18))

    console.log('pangolin reserves', { reserve0Pangolin, reserve1Pangolin })
    console.log('joe reserves', { reserve0Joe, reserve1Joe })
}

console.log('Bot started!')

runBot()
