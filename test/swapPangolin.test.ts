import { ethers, network, getNamedAccounts } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import {
    bigNumberToNumber,
    expandTo18Decimals,
    findMaxProfit,
    isLocalEnv,
} from '../scripts/utility'
import { BigNumber, Contract } from 'ethers'
import setupTest from './testSetup'
import { ReservesType } from '../scripts/types'

chai.use(solidity)

describe('Sushilin->Pango FlashSwap', function () {
    let flashSwapPango: Contract
    let wavax: Contract
    let usdt: Contract
    let sushiWavaxUsdt: Contract
    let pangoWavaxUsdt: Contract

    beforeEach(async function () {
        if (isLocalEnv(network.name)) {
            const { WAVAX, USDT, SUSHI_WAVAX_USDT_PAIR, PANGO_WAVAX_USDT_PAIR, FLASH_SWAP_PANGO } =
                await setupTest()
            wavax = WAVAX
            usdt = USDT
            sushiWavaxUsdt = SUSHI_WAVAX_USDT_PAIR
            pangoWavaxUsdt = PANGO_WAVAX_USDT_PAIR
            flashSwapPango = FLASH_SWAP_PANGO
        }
    })

    it('swap avax->usdt', async function () {
        const { deployer, user } = await getNamedAccounts()

        // add liquidity to Pango at a rate of 1 AVAX / 100 USDT
        const pangoUSDTAmount = expandTo18Decimals(10000)
        const pangoWavaxAmount = expandTo18Decimals(100)
        await usdt.mint(deployer, pangoUSDTAmount)
        await usdt.transfer(pangoWavaxUsdt.address, pangoUSDTAmount)
        await wavax.mint(deployer, pangoWavaxAmount)
        await wavax.transfer(pangoWavaxUsdt.address, pangoWavaxAmount)
        await pangoWavaxUsdt.mint(deployer)

        // add liquidity to Sushi at a rate of 1 AVAX / 120 USDT
        const sushiUSDTAmount = expandTo18Decimals(12000)
        const sushiWavaxAmount = expandTo18Decimals(100)
        await usdt.mint(deployer, sushiUSDTAmount)
        await usdt.transfer(sushiWavaxUsdt.address, sushiUSDTAmount)
        await wavax.mint(deployer, sushiWavaxAmount)
        await wavax.transfer(sushiWavaxUsdt.address, sushiWavaxAmount)
        await sushiWavaxUsdt.mint(deployer)

        const reserves: ReservesType = {
            primaryA: pangoWavaxAmount,
            primaryB: pangoUSDTAmount,
            secondaryA: sushiWavaxAmount,
            secondaryB: sushiUSDTAmount,
        }
        const maxProfitCalc = findMaxProfit(reserves)

        const pangoPairToken0 = await pangoWavaxUsdt.token0()
        const amount0 =
            pangoPairToken0 === usdt.address ? BigNumber.from(0) : maxProfitCalc.tokenAmount
        const amount1 =
            pangoPairToken0 === usdt.address ? maxProfitCalc.tokenAmount : BigNumber.from(0)

        const balanceBefore = await wavax.balanceOf(user)

        await pangoWavaxUsdt.swap(
            amount0,
            amount1,
            flashSwapPango.address,
            ethers.utils.toUtf8Bytes('1')
        )
        const balanceAfter = await wavax.balanceOf(user)
        const profit = balanceAfter.sub(balanceBefore)
        expect(bigNumberToNumber(profit)).to.eq(0.3878458663877465) // profit of around 0.38 avax
    })

    it('swap usdt->avax', async function () {
        const { deployer, user } = await getNamedAccounts()

        // add liquidity to Pango at a rate of 1 AVAX / 120 USDT
        const pangoUSDTAmount = expandTo18Decimals(12000)
        const pangoWavaxAmount = expandTo18Decimals(100)
        await usdt.mint(deployer, pangoUSDTAmount)
        await usdt.transfer(pangoWavaxUsdt.address, pangoUSDTAmount)
        await wavax.mint(deployer, pangoWavaxAmount)
        await wavax.transfer(pangoWavaxUsdt.address, pangoWavaxAmount)
        await pangoWavaxUsdt.mint(deployer)

        // add liquidity to Sushi at a rate of 1 AVAX / 100 USDT
        const sushiUSDTAmount = expandTo18Decimals(10000)
        const sushiWavaxAmount = expandTo18Decimals(100)
        await usdt.mint(deployer, sushiUSDTAmount)
        await usdt.transfer(sushiWavaxUsdt.address, sushiUSDTAmount)
        await wavax.mint(deployer, sushiWavaxAmount)
        await wavax.transfer(sushiWavaxUsdt.address, sushiWavaxAmount)
        await sushiWavaxUsdt.mint(deployer)

        const reserves: ReservesType = {
            primaryA: pangoUSDTAmount,
            primaryB: pangoWavaxAmount,
            secondaryA: sushiUSDTAmount,
            secondaryB: sushiWavaxAmount,
        }
        const maxProfitCalc = findMaxProfit(reserves)

        const pangoPairToken0 = await pangoWavaxUsdt.token0()
        const amount0 =
            pangoPairToken0 === wavax.address ? expandTo18Decimals(0) : maxProfitCalc.tokenAmount
        const amount1 =
            pangoPairToken0 === wavax.address ? maxProfitCalc.tokenAmount : expandTo18Decimals(0)

        const balanceBefore = await usdt.balanceOf(user)
        await pangoWavaxUsdt.swap(
            amount0,
            amount1,
            flashSwapPango.address,
            ethers.utils.toUtf8Bytes('1')
        )
        const balanceAfter = await usdt.balanceOf(user)
        const profit = balanceAfter.sub(balanceBefore).div(expandTo18Decimals(1))
        expect(bigNumberToNumber(profit)).to.eq(42) // profit of around 42 usdt
    })
})
