import { ethers, network, getNamedAccounts } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import { expandTo18Decimals, findMaxProfit, isLocalEnv, ReservesType } from '../scripts/utility'
import { Contract } from 'ethers'
import setupTest from './testSetup'

chai.use(solidity)

describe('Simple swapping test', function () {
    let flashSwapSushi: Contract
    let flashSwapPango: Contract
    let wavax: Contract
    let usdt: Contract
    let pangoWavaxUsdt: Contract
    let sushiWavaxUsdt: Contract

    beforeEach(async function () {
        if (isLocalEnv(network.name)) {
            const {
                WAVAX,
                USDT,
                PANGO_WAVAX_USDT_PAIR,
                SUSHI_WAVAX_USDT_PAIR,
                FLASH_SWAP_PANGO,
                FLASH_SWAP_SUSHI,
            } = await setupTest()
            wavax = WAVAX
            usdt = USDT
            pangoWavaxUsdt = PANGO_WAVAX_USDT_PAIR
            sushiWavaxUsdt = SUSHI_WAVAX_USDT_PAIR
            flashSwapSushi = FLASH_SWAP_SUSHI
            flashSwapPango = FLASH_SWAP_PANGO
        }
    })

    describe('Proof of Concept', function () {
        it('swap avax->usdt', async function () {
            const { deployer, user } = await getNamedAccounts()

            // add liquidity to Joe at a rate of 1 AVAX / 40000 USDT
            const sushiUSDTAmount = expandTo18Decimals(40000)
            const sushiWavaxAmount = expandTo18Decimals(1)
            await usdt.mint(deployer, sushiUSDTAmount)
            await usdt.transfer(sushiWavaxUsdt.address, sushiUSDTAmount)
            await wavax.mint(deployer, sushiWavaxAmount)
            await wavax.transfer(sushiWavaxUsdt.address, sushiWavaxAmount)
            await sushiWavaxUsdt.mint(deployer)

            // add liquidity to Pango at a rate of 1 AVAX / 60000 USDT
            const pangoUSDTAmount = expandTo18Decimals(60000)
            const pangoWavaxAmount = expandTo18Decimals(1)
            await usdt.mint(deployer, pangoUSDTAmount)
            await usdt.transfer(pangoWavaxUsdt.address, pangoUSDTAmount)
            await wavax.mint(deployer, pangoWavaxAmount)
            await wavax.transfer(pangoWavaxUsdt.address, pangoWavaxAmount)
            await pangoWavaxUsdt.mint(deployer)

            const reserves: ReservesType = {
                primaryA: sushiWavaxAmount,
                primaryB: sushiUSDTAmount,
                secondaryA: pangoWavaxAmount,
                secondaryB: pangoUSDTAmount,
            }
            const maxProfitCalc = findMaxProfit(reserves)
            console.log(
                'arbitrage amount',
                ethers.utils.formatEther(maxProfitCalc.tokenAmount.toString())
            )
            console.log(
                'projected profit (excluding gas costs)',
                ethers.utils.formatEther(maxProfitCalc.profit.toString())
            )

            // Fgure out which token is which
            const sushiPairToken0 = await sushiWavaxUsdt.token0()
            // If token0 is USDT then set amount0 to  0 else set its value to 1 since its WAVAX
            const amount0 =
                sushiPairToken0 === usdt.address ? expandTo18Decimals(0) : maxProfitCalc.tokenAmount
            // If token0 is USDT then set amount1 to 1 else set its value to 0 since its USDT
            const amount1 =
                sushiPairToken0 === usdt.address ? maxProfitCalc.tokenAmount : expandTo18Decimals(0)

            const balanceBefore = await wavax.balanceOf(user)

            await sushiWavaxUsdt.swap(
                amount0,
                amount1,
                flashSwapSushi.address,
                ethers.utils.toUtf8Bytes('1')
            )
            const balanceAfter = await wavax.balanceOf(user)
            console.log('profit', (balanceAfter - balanceBefore) / 10 ** 18, 'avax')
            expect(balanceAfter).to.be.gt(balanceBefore)
        })

        it('swap usdt->avax', async function () {
            const { deployer, user } = await getNamedAccounts()

            // add liquidity to Joe at a rate of 1 AVAX / 40000 USDT
            const sushiUSDTAmount = expandTo18Decimals(40000)
            const sushiWavaxAmount = expandTo18Decimals(1)
            await usdt.mint(deployer, sushiUSDTAmount)
            await usdt.transfer(sushiWavaxUsdt.address, sushiUSDTAmount)
            await wavax.mint(deployer, sushiWavaxAmount)
            await wavax.transfer(sushiWavaxUsdt.address, sushiWavaxAmount)
            await sushiWavaxUsdt.mint(deployer)

            // add liquidity to Pango at a rate of 1 AVAX / 60000 USDT
            const pangoUSDTAmount = expandTo18Decimals(60000)
            const pangoWavaxAmount = expandTo18Decimals(1)
            await usdt.mint(deployer, pangoUSDTAmount)
            await usdt.transfer(pangoWavaxUsdt.address, pangoUSDTAmount)
            await wavax.mint(deployer, pangoWavaxAmount)
            await wavax.transfer(pangoWavaxUsdt.address, pangoWavaxAmount)
            await pangoWavaxUsdt.mint(deployer)

            const reserves: ReservesType = {
                primaryA: pangoUSDTAmount,
                primaryB: pangoWavaxAmount,
                secondaryA: sushiUSDTAmount,
                secondaryB: sushiWavaxAmount,
            }
            const maxProfitCalc = findMaxProfit(reserves)
            console.log(
                'arbitrage amount',
                ethers.utils.formatEther(maxProfitCalc.tokenAmount.toString())
            )
            console.log(
                'projected profit (excluding gas costs)',
                ethers.utils.formatEther(maxProfitCalc.profit.toString())
            )

            // Fgure out which token is which
            const sushiPairToken0 = await sushiWavaxUsdt.token0()
            // If token0 is USDT then set amount0 to  0 else set its value to 1 since its WAVAX
            const amount0 =
                sushiPairToken0 === wavax.address
                    ? expandTo18Decimals(0)
                    : maxProfitCalc.tokenAmount
            // If token0 is USDT then set amount1 to 1 else set its value to 0 since its USDT
            const amount1 =
                sushiPairToken0 === wavax.address
                    ? maxProfitCalc.tokenAmount
                    : expandTo18Decimals(0)

            const balanceBefore = await usdt.balanceOf(user)
            await pangoWavaxUsdt.swap(
                amount0,
                amount1,
                flashSwapPango.address,
                ethers.utils.toUtf8Bytes('1')
            )
            const balanceAfter = await usdt.balanceOf(user)
            console.log('profit', (balanceAfter - balanceBefore) / 10 ** 18, 'usdt')
            expect(balanceAfter).to.be.gt(balanceBefore)
        })
    })
})
