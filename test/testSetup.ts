import { deployments } from 'hardhat'
import PangolinFactory from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/PangolinFactory.sol/PangolinFactory.json'
import PangolinRouter from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-periphery/PangolinRouter.sol/PangolinRouter.json'
import UniswapV2Factory from './test-artifacts/sushiswap/UniswapV2Factory.json'
import UniswapV2Router02 from './test-artifacts/sushiswap/UniswapV2Router02.json'
import { expandTo18Decimals } from '../scripts/utility'
import { Contract } from 'ethers'

export interface V2Fixture {
    WAVAX: Contract
    USDT: Contract
    PANGO_FACTORY: Contract
    SUSHI_FACTORY: Contract
    PANGO_WAVAX_USDT_PAIR: Contract
    SUSHI_WAVAX_USDT_PAIR: Contract
    PANGO_ROUTER: Contract
    SUSHI_ROUTER: Contract
    FLASH_SWAP_PANGO: Contract
    FLASH_SWAP_SUSHI: Contract
}

const setupTest = deployments.createFixture(
    async ({ deployments, getNamedAccounts, ethers }, options): Promise<V2Fixture> => {
        await deployments.fixture() // ensure you start from a fresh deployments
        const { deploy } = deployments
        const { deployer } = await getNamedAccounts()
        const signers = await ethers.getSigners()

        // Deploy tokens
        const wavax = await deploy('WAVAX', {
            from: deployer,
            log: true,
            contract: 'ExampleERC20',
            args: ['WAVAX', 'WAVAX', expandTo18Decimals(10000)],
        })
        const WAVAX = new Contract(wavax.address, wavax.abi, signers[0])

        const usdt = await deploy('USDT', {
            from: deployer,
            log: true,
            contract: 'ExampleERC20',
            args: ['Tether', 'USDT', expandTo18Decimals(1000000)],
        })
        const USDT = new Contract(usdt.address, usdt.abi, signers[0])

        // deploy Pangolin Factory
        const pangolinFactory = await deploy('PangolinFactory', {
            from: deployer,
            log: true,
            contract: PangolinFactory,
            args: [deployer],
        })
        const PANGO_FACTORY = new Contract(pangolinFactory.address, pangolinFactory.abi, signers[0])

        // deploy Sushiswap Factory
        const sushiFactory = await deploy('UniswapV2Factory', {
            from: deployer,
            log: true,
            contract: UniswapV2Factory,
            args: [deployer],
        })
        const SUSHI_FACTORY = new Contract(sushiFactory.address, sushiFactory.abi, signers[0])

        // deploy Pangolin Router
        const pangolinRouter = await deploy('PangolinRouter', {
            from: deployer,
            log: true,
            contract: PangolinRouter,
            args: [PANGO_FACTORY.address, WAVAX.address],
        })
        const PANGO_ROUTER = new Contract(pangolinRouter.address, pangolinRouter.abi, signers[0])

        // deploy Sushiswap Router
        const sushiRouter = await deploy('UniswapV2Router02', {
            from: deployer,
            log: true,
            contract: UniswapV2Router02,
            args: [SUSHI_FACTORY.address, WAVAX.address],
        })
        const SUSHI_ROUTER = new Contract(sushiRouter.address, sushiRouter.abi, signers[0])

        // create Pangolin WAVAX-USDT pair
        await PANGO_FACTORY.createPair(WAVAX.address, USDT.address)
        const PANGO_WAVAX_USDT_PAIR_ADDRESS = await PANGO_FACTORY.getPair(
            WAVAX.address,
            USDT.address
        )
        const PangoPair = await deployments.getArtifact('IPangolinPair')
        const PANGO_WAVAX_USDT_PAIR = new Contract(
            PANGO_WAVAX_USDT_PAIR_ADDRESS,
            PangoPair.abi,
            signers[1]
        )

        // create Sushiswap WAVAX-USDT pair
        await SUSHI_FACTORY.createPair(WAVAX.address, USDT.address)
        const SUSHI_WAVAX_USDT_PAIR_ADDRESS = await SUSHI_FACTORY.getPair(
            WAVAX.address,
            USDT.address
        )
        const SushiPair = await deployments.getArtifact('IUniswapV2Pair')
        const SUSHI_WAVAX_USDT_PAIR = new Contract(
            SUSHI_WAVAX_USDT_PAIR_ADDRESS,
            SushiPair.abi,
            signers[1]
        )

        // deploy Pangolin->Sushiswap FlashSwap
        const flashSwapPango = await deploy('FlashSwapPangolin', {
            from: deployer,
            log: true,
            args: [PANGO_FACTORY.address, SUSHI_ROUTER.address],
        })

        // deploy Sushiswap->Pangolin FlashSwap
        const flashSwapSushi = await deploy('FlashSwapSushi', {
            from: deployer,
            log: true,
            args: [SUSHI_FACTORY.address, PANGO_ROUTER.address],
        })

        const FLASH_SWAP_PANGO = new Contract(
            flashSwapPango.address,
            flashSwapPango.abi,
            signers[0]
        )
        const FLASH_SWAP_SUSHI = new Contract(
            flashSwapSushi.address,
            flashSwapSushi.abi,
            signers[0]
        )

        return {
            WAVAX,
            USDT,
            PANGO_FACTORY,
            SUSHI_FACTORY,
            PANGO_WAVAX_USDT_PAIR,
            SUSHI_WAVAX_USDT_PAIR,
            PANGO_ROUTER,
            SUSHI_ROUTER,
            FLASH_SWAP_PANGO,
            FLASH_SWAP_SUSHI,
        }
    }
)

export default setupTest
