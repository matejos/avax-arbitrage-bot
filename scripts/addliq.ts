import { getNamedAccounts, ethers } from 'hardhat'
import { expandTo18Decimals } from './utility'
import JoeRouter02Artifact from '@traderjoe-xyz/core/artifacts/contracts/traderjoe/JoeRouter02.sol/JoeRouter02.json'
import { DEX, RouterNamedAccounts } from './constants'

const addLiq = async (): Promise<void> => {
    const namedAccounts = await getNamedAccounts()
    const signers = await ethers.getSigners()

    const factory = new ethers.Contract(
        namedAccounts[RouterNamedAccounts[DEX.TRADERJOE]],
        JoeRouter02Artifact.abi,
        signers[0]
    )

    console.log('adding liq')
    await factory.addLiquidity(
        namedAccounts.wavax,
        namedAccounts.mycoin,
        expandTo18Decimals(1),
        expandTo18Decimals(40000),
        expandTo18Decimals(1),
        expandTo18Decimals(40000),
        signers[0].address,
        99999999999
    )
    console.log('done')
}

addLiq()
