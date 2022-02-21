import { Contract, ContractFactory } from 'ethers'
import { ethers } from 'hardhat'
import Addresses from './addresses'

const main = async (): Promise<any> => {
    const FlashSwap: ContractFactory = await ethers.getContractFactory('FlashSwap')
    const flashSwap: Contract = await FlashSwap.deploy(
        Addresses.PANGOLIN_FACTORY,
        Addresses.PANGOLIN_ROUTER
    )

    await flashSwap.deployed()
    console.log(`FlashSwap deployed to: ${flashSwap.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
