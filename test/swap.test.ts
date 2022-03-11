import { ethers, network } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import UniswapV2Pair from '../abis/IUniswapV2Pair.json'
import Addresses from '../scripts/addresses'
import { expandTo18Decimals, expandToXDecimals } from '../scripts/utility'

chai.use(solidity)

const JOE_AVAX_USDT_ADDRESS = '0x94de0b724032755Ae3fda8037db57D769A967F21'
const PANGO_AVAX_USDT_ADDRESS = '0x47fb6ab85396d593d53ba8d7bb3558ca1a4e5dcc'

describe('Simple swapping test', function () {
    beforeEach(async function () {
        // Forking test net
        await network.provider.request({
            method: 'hardhat_reset',
            params: [
                {
                    forking: {
                        jsonRpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
                        blockNumber: 6710950,
                    },
                    live: false,
                    saveDeployments: true,
                    tags: ['test', 'local'],
                },
            ],
        })

        // ABIs
        this.flashSwapJoeCF = await ethers.getContractFactory('FlashSwapJoe')
        this.flashSwapPangolinCF = await ethers.getContractFactory('FlashSwapPangolin')

        // Account
        const [owner] = await ethers.getSigners()
        this.owner = owner

        // Contracts
        this.flashSwapJoe = await this.flashSwapJoeCF.deploy(
            Addresses.JOE_FACTORY,
            Addresses.PANGOLIN_ROUTER
        )
        this.flashSwapPangolin = await this.flashSwapPangolinCF.deploy(
            Addresses.PANGOLIN_FACTORY,
            Addresses.JOE_ROUTER
        )

        // Tokens
        this.wavax = await ethers.getContractAt('IWAVAX', Addresses.WAVAX)
        this.usdt = await ethers.getContractAt('IERC20', Addresses.USDT)

        // Pairs
        this.joeUsdtAvax = await ethers.getContractAt(UniswapV2Pair.abi, JOE_AVAX_USDT_ADDRESS)
        this.pangoUsdtAvax = await ethers.getContractAt(UniswapV2Pair.abi, PANGO_AVAX_USDT_ADDRESS)
    })

    describe('Proof of Concept', function () {
        it('swap avax->usdt', async function () {
            const balanceBefore = await this.wavax.balanceOf(this.owner.address)
            await this.joeUsdtAvax.swap(
                '0',
                expandToXDecimals(10850, 13),
                this.flashSwapJoe.address,
                ethers.utils.toUtf8Bytes('1')
            )
            const balanceAfter = await this.wavax.balanceOf(this.owner.address)
            console.log('profit', (balanceAfter - balanceBefore) / 10 ** 18, 'avax')
            expect(balanceAfter).to.be.gt(balanceBefore)
        })

        it('swap usdt->avax', async function () {
            const balanceBefore = await this.usdt.balanceOf(this.owner.address)
            await this.pangoUsdtAvax.swap(
                expandToXDecimals(5423, 18),
                '0',
                this.flashSwapPangolin.address,
                ethers.utils.toUtf8Bytes('1')
            )
            const balanceAfter = await this.usdt.balanceOf(this.owner.address)
            console.log('profit', (balanceAfter - balanceBefore) / 10 ** 18, 'usdt')
            expect(balanceAfter).to.be.gt(balanceBefore)
        })
    })

    after(async function () {
        await network.provider.request({
            method: 'hardhat_reset',
            params: [],
        })
    })
})
