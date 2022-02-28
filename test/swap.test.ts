import { ethers, network } from 'hardhat'
import chai, { expect } from 'chai'
import { solidity } from 'ethereum-waffle'
import UniswapV2Pair from '../abis/IUniswapV2Pair.json'
import Addresses from '../scripts/addresses'

chai.use(solidity)

const JOE_AVAX_USDT_ADDRESS = '0x94de0b724032755Ae3fda8037db57D769A967F21'

describe('Simple swapping test', function () {
    before(async function () {
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
        this.flashSwapCF = await ethers.getContractFactory('FlashSwap')

        // Account
        const [owner] = await ethers.getSigners()
        this.owner = owner

        // Contracts
        this.flashSwap = await this.flashSwapCF.deploy(
            Addresses.JOE_FACTORY,
            Addresses.PANGOLIN_ROUTER
        )

        // Tokens
        this.wavax = await ethers.getContractAt('IWAVAX', Addresses.WAVAX)

        // Pairs
        this.joeAvaxUsdt = await ethers.getContractAt(UniswapV2Pair.abi, JOE_AVAX_USDT_ADDRESS)
    })

    describe('Proof of Concept', function () {
        it('does the swap', async function () {
            const options = {
                gasPrice: 25000000000,
                gasLimit: 1000000,
            }
            const balanceBefore = await this.wavax.balanceOf(this.owner.address)
            await this.joeAvaxUsdt.swap(
                '0',
                '1000000000000000',
                this.flashSwap.address,
                ethers.utils.toUtf8Bytes('1')
            )
            const balanceAfter = await this.wavax.balanceOf(this.owner.address)
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
