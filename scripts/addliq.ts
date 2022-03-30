import { getNamedAccounts, ethers, artifacts } from 'hardhat'
import { expandTo18Decimals } from './utility'
import UniswapV2Router02 from '../test/test-artifacts/sushiswap/UniswapV2Router02.json'
import UniswapV2Factory from '../test/test-artifacts/sushiswap/UniswapV2Factory.json'
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { DEX, FactoryNamedAccounts, RouterNamedAccounts, Tokens } from './constants'

const addLiq = async (): Promise<void> => {
    const namedAccounts = await getNamedAccounts()
    const signers = await ethers.getSigners()

    // const sushiFactoryCF = await ethers.getContractFactory('UniswapV2Factory')
    // const factory = await sushiFactoryCF.deploy(signers[0].address)
    // console.log('sushiFactory.address', factory.address)
    // const sushiFactory = await deploy('UniswapV2Factory', {
    //     from: deployer,
    //     log: true,
    //     contract: UniswapV2Factory,
    //     args: [deployer],
    // })
    // const factory = new ethers.Contract(factory.address, factory.abi, signers[0])
    const factory = new ethers.Contract(
        namedAccounts[FactoryNamedAccounts[DEX.SUSHISWAP]],
        UniswapV2Factory.abi,
        signers[0]
    )
    // const sushiRouter = await deploy('UniswapV2Router02', {
    //     from: deployer,
    //     log: true,
    //     contract: UniswapV2Router02,
    //     args: [SUSHI_FACTORY.address, WAVAX.address],
    // })
    // const sushiRouterCF = await ethers.getContractFactory('UniswapV2Router02')
    // const router = await sushiRouterCF.deploy(factory.address, namedAccounts.wavax)
    // console.log('sushiRouter.address', router.address)
    // const router = new ethers.Contract(router.address, router.abi, signers[0])
    const router = new ethers.Contract(
        namedAccounts[RouterNamedAccounts[DEX.SUSHISWAP]],
        UniswapV2Router02.abi,
        signers[0]
    )
    // console.log('paircodehash', await factory.pairCodeHash())
    const IERC20Artifact = await artifacts.readArtifact('ERC20')
    const token0 = new ethers.Contract(namedAccounts.wavax, IERC20Artifact.abi, signers[0])
    const token1 = new ethers.Contract(namedAccounts.mycoin, IERC20Artifact.abi, signers[0])

    // console.log('token0 allowance', await token0.allowance(signers[0].address, router.address))
    // console.log('token1 allowance', await token1.allowance(signers[0].address, router.address))

    // console.log('creating pair')
    // await factory.createPair(namedAccounts.wavax, namedAccounts.mycoin)

    // console.log('approving token0 for', router.address)
    // await token0.approve(router.address, expandTo18Decimals(1))
    // console.log('approving token1 for', router.address)
    // await token1.approve(router.address, expandTo18Decimals(40000))

    // const pair = new ethers.Contract(
    //     '0x56DF5E89E806C987A26029797A7d3d8E198e6451',
    //     IUniswapV2Pair.abi,
    //     signers[0]
    // )
    // console.log('token0', await pair.token0())
    // console.log('token1', await pair.token1())
    // console.log('syncing')
    // await pair.sync()

    console.log('adding liq')
    await router.addLiquidity(
        namedAccounts.wavax,
        namedAccounts.mycoin,
        expandTo18Decimals(1),
        expandTo18Decimals(40000),
        expandTo18Decimals(1),
        expandTo18Decimals(40000),
        signers[0].address,
        99999999999999
    )
    console.log('done')
}

addLiq()
