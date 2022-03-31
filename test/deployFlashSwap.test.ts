import hardhat from 'hardhat'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import { isLocalEnv } from '../scripts/utility'
import setupTest from './testSetup'
import deployFlashSwap from '../scripts/deployFlashSwap'
import { DEX } from '../scripts/constants'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

describe('Flashswap deploying', function () {
    let sushiFactory, sushiRouter, pangolinFactory, pangolinRouter, deployer
    beforeEach(async function () {
        if (isLocalEnv(hardhat.network.name)) {
            const { SUSHI_FACTORY, SUSHI_ROUTER, PANGO_FACTORY, PANGO_ROUTER } = await setupTest()
            sushiFactory = SUSHI_FACTORY.address
            sushiRouter = SUSHI_ROUTER.address
            pangolinFactory = PANGO_FACTORY.address
            pangolinRouter = PANGO_ROUTER.address
        }
        const namedAccounts = await hardhat.getNamedAccounts()
        deployer = namedAccounts.deployer
    })

    afterEach(function () {
        sinon.restore()
    })

    it('can deploy flashswap sushi->pangolin', async function () {
        sinon.stub(hardhat, 'getNamedAccounts').resolves({
            sushiFactory,
            pangolinRouter,
            deployer,
        })
        await deployFlashSwap(hardhat, DEX.SUSHISWAP, DEX.PANGOLIN)
    })

    it('can deploy flashswap pangolin->sushi', async function () {
        sinon.stub(hardhat, 'getNamedAccounts').resolves({
            sushiRouter,
            pangolinFactory,
            deployer,
        })
        await deployFlashSwap(hardhat, DEX.PANGOLIN, DEX.SUSHISWAP)
    })

    it('no factory address - throws readable error', async function () {
        sinon.stub(hardhat, 'getNamedAccounts').resolves({
            sushiRouter,
            deployer,
        })
        await expect(deployFlashSwap(hardhat, DEX.PANGOLIN, DEX.SUSHISWAP)).to.be.rejectedWith(
            '1st DEX factory address missing in namedAccounts!'
        )
    })

    it('no router address - throws readable error', async function () {
        sinon.stub(hardhat, 'getNamedAccounts').resolves({
            pangolinFactory,
            deployer,
        })
        await expect(deployFlashSwap(hardhat, DEX.PANGOLIN, DEX.SUSHISWAP)).to.be.rejectedWith(
            '2nd DEX router address missing in namedAccounts!'
        )
    })
})
