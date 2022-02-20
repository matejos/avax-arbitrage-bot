import 'dotenv/config'
import { ethers } from 'hardhat'
import UniswapV2Pair from '../abis/IUniswapV2Pair.json'
import UniswapV2Factory from '../abis/IUniswapV2Factory.json'
import PangolinFactory from '../abis/IPangolinFactory.json'
import Addresses from './addresses'
import { Contract } from 'ethers'

const privateKey = process.env.MNEMONIC
const flashSwapperAddress = process.env.FLASH_SWAPPER

const ETH_TRADE = 10
const DAI_TRADE = 3500

const runBot = async () => {
    const pangolinFactory = await ethers.getContractAt(PangolinFactory, Addresses.PANGOLIN_FACTORY)
    // const uniswapFactory = new ethers.Contract(
    //     '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    //     UniswapV2Factory.abi,
    //     wallet
    // )
    const usdtAddress = '0xF71Fa18B5401f8e0AB26f9F80ac3cdDe68C6Cdd2'
    const wavaxAddress = Addresses.WAVAX

    let pangolinAvaxUsdt: Contract
    // let uniswapAvaxUsdt

    const loadPairs = async () => {
        pangolinAvaxUsdt = await ethers.getContractAt(
            UniswapV2Pair.abi,
            await pangolinFactory.getPair(wavaxAddress, usdtAddress)
        )
        // uniswapAvaxUsdt = new ethers.Contract(
        //     await uniswapFactory.getPair(wavaxAddress, usdtAddress),
        //     UniswapV2Pair.abi,
        //     wallet
        // )
    }

    await loadPairs()
    console.log('pangolinAvaxUsdt', pangolinAvaxUsdt.address)

    const pangolinReserves = await pangolinAvaxUsdt.getReserves()
    console.log('pango', pangolinReserves)
}

console.log('Bot started!')

runBot()
