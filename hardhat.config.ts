import 'hardhat-deploy'
import { task } from 'hardhat/config'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { BigNumber } from 'ethers'
import '@nomiclabs/hardhat-waffle'
import 'dotenv/config'
import { HardhatUserConfig } from 'hardhat/types'

const accounts = {
    mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test test',
}

// When using the hardhat network, you may choose to fork Fuji or Avalanche Mainnet
// This will allow you to debug contracts using the hardhat network while keeping the current network state
// To enable forking, turn one of these booleans on, and then run your tasks/scripts using ``--network hardhat``
// For more information go to the hardhat guide
// https://hardhat.org/hardhat-network/
// https://hardhat.org/guides/mainnet-forking.html
const FORK_FUJI = true
const FORK_MAINNET = false
const forkingData = FORK_FUJI
    ? {
          url: 'https://api.avax-test.network/ext/bc/C/rpc',
          blockNumber: 7978605, // 0.1 wavax to mycoin, sushi to pangolin (projected profit 0.0196427247506822 wavax) arb:wavax-mycoin:pangolin-sushi arbed at tx 0xcc89201cbe0b0345f85ffa4ba26c4fcab4ea4bda4559323fc76be2cf2fdf0fff
      }
    : FORK_MAINNET
    ? {
          url: 'https://api.avax.network/ext/bc/C/rpc',
          //   blockNumber: 5249690, // 0.1 wavax to usdt, pangolin to sushi (projected profit 1411901118672384 wavax wei aka 0.001411901118672384 wavax)
          //   blockNumber: 5252812, // 9.33 wavax to joe, traderjoe to pangolin (projected profit 0.04496119591391282 wavax)
          //   blockNumber: 5306011, // 3.77 wavax to joe, traderjoe to pangolin (projected profit 2127691665769418 wavax wei aka 0.002127691665769418 wavax)
          //   blockNumber: 8922164, // 222 joe to wavax, Joe to Pangolin (projected profit 0.30050154058757383 joe)
      }
    : undefined

const namedAccounts = {
    deployer: {
        default: 0,
        hardhat: 0,
        fuji: 0,
        mainnet: 0,
    },
    user: {
        // Used for testing
        default: 1,
        hardhat: 1,
    },
    pangolinFactory: {
        fuji: '0xE4A575550C2b460d2307b82dCd7aFe84AD1484dd',
        mainnet: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
    },
    pangolinRouter: {
        fuji: '0x2D99ABD9008Dc933ff5c0CD271B88309593aB921',
        mainnet: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
    },
    joeFactory: {
        fuji: '0x7eeccb3028870540EEc3D88C2259506f2d34fEE0',
        mainnet: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
    },
    joeRouter: {
        fuji: '0x5db0735cf88F85E78ed742215090c465979B5006',
        mainnet: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
    },
    sushiFactory: {
        fuji: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
        mainnet: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
    },
    sushiRouter: {
        fuji: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
        mainnet: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    },
    wavax: {
        fuji: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
        mainnet: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
    mycoin: {
        fuji: '0xc6d1E00F83A37Dd6aE95755D0794FFbD077bf606',
    },
    usdt: {
        fuji: '0x320f9A00BDDFE466887A8D0390cF32e9373fFc9f',
        mainnet: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118',
    },
    joe: {
        fuji: '0x2E4828F1a2dFC54d15Ef398ee4d0BE26d7211d56',
        mainnet: '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd',
    },
    wavaxChainLink: {
        fuji: '0x5498BB86BC934c8D34FDA08E81D444153d0D06aD',
        mainnet: '0x0A77230d17318075983913bC2145DB16C7366156',
    },
    joeChainLink: {
        mainnet: '0x02D35d3a8aC3e1626d3eE09A78Dd87286F5E8e3a',
    },
    usdtChainLink: {
        fuji: '0x7898AcCC83587C3C55116c5230C17a6Cd9C71bad',
        mainnet: '0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a',
    },
    flashSwapPangolinSushi: {
        fuji: '0x6c5a72a30ab18A013307A514133144bBcac1f61d',
    },
    flashSwapSushiPangolin: {
        fuji: '0x6d13c447381ce5c3374bDA61775fc74183128F45',
    },
    flashSwapPangolinJoe: {
        fuji: '0xD919e81c5120F35C9D4A8147E2C221De5F75E69F',
    },
    flashSwapJoePangolin: {
        fuji: '0x81A1419049A6731ab52505Da86cf077d850b3fEe',
    },
}
if (FORK_MAINNET || FORK_FUJI) {
    for (const key in namedAccounts) {
        namedAccounts[key].hardhat = namedAccounts[key][FORK_MAINNET ? 'mainnet' : 'fuji']
    }
}

task('accounts', 'Prints the list of accounts', async (args, hre): Promise<void> => {
    const accounts: SignerWithAddress[] = await hre.ethers.getSigners()
    accounts.forEach((account: SignerWithAddress): void => {
        console.log(account.address)
    })
})

task('balances', 'Prints the list of AVAX account balances', async (args, hre): Promise<void> => {
    const accounts: SignerWithAddress[] = await hre.ethers.getSigners()
    for (const account of accounts) {
        const balance: BigNumber = await hre.ethers.provider.getBalance(account.address)
        console.log(`${account.address} has balance ${balance.toString()}`)
    }
})

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: '0.5.0',
            },
            {
                version: '0.5.16',
            },
            {
                version: '0.6.2',
            },
            {
                version: '0.6.4',
            },
            {
                version: '0.6.6',
            },
            {
                version: '0.6.12',
            },
            {
                version: '0.7.0',
            },
            {
                version: '0.8.0',
            },
        ],
    },
    networks: {
        hardhat: {
            gasPrice: 30000000000,
            // gasPrice: 300000000000,
            chainId: !forkingData ? 43112 : 43114,
            forking: forkingData,
        },
        local: {
            url: 'http://localhost:9650/ext/bc/C/rpc',
            gasPrice: 225000000000,
            chainId: 43112,
            accounts: [
                '0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027',
                '0x7b4198529994b0dc604278c99d153cfd069d594753d471171a1d102a10438e07',
                '0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e',
                '0x31b571bf6894a248831ff937bb49f7754509fe93bbd2517c9c73c4144c0e97dc',
                '0x6934bef917e01692b789da754a0eae31a8536eb465e7bff752ea291dad88c675',
                '0xe700bdbdbc279b808b1ec45f8c2370e4616d3a02c336e68d85d4668e08f53cff',
                '0xbbc2865b76ba28016bc2255c7504d000e046ae01934b04c694592a6276988630',
                '0xcdbfd34f687ced8c6968854f8a99ae47712c4f4183b78dcc4a903d1bfe8cbf60',
                '0x86f78c5416151fe3546dece84fda4b4b1e36089f2dbc48496faf3a950f16157c',
                '0x750839e9dbbd2a0910efe40f50b2f3b2f2f59f5580bb4b83bd8c1201cf9a010a',
            ],
        },
        fuji: {
            url: 'https://api.avax-test.network/ext/bc/C/rpc',
            gasPrice: 30000000000,
            chainId: 43113,
            accounts,
        },
        mainnet: {
            url: 'https://api.avax.network/ext/bc/C/rpc',
            gasPrice: 30000000000,
            chainId: 43114,
            accounts,
        },
    },
    namedAccounts,
}

export default config
