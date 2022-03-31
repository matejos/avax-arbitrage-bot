# avax-arbitrage-bot

Arbitrage bot for Avalanche DEXes - Trader Joe, Sushiswap, Pangolin

Proof of successful arbitrage on Fuji: https://testnet.snowtrace.io/tx/0xcc89201cbe0b0345f85ffa4ba26c4fcab4ea4bda4559323fc76be2cf2fdf0fff - 0.0196 wavax gain, 0.0083 avax tx cost

## Configuration
* Create .env with wallet mnemonic (see .env.example)
### To add TOKENX for arbitraging:
1) Edit **scripts/constants.ts** - add TOKENX = 'tokenx' to Tokens enum 
2) Edit **hardhat.config.ts** - add tokenx with address for the token, tokenxChainLink (tokenx must correspond to value for TOKENX from Tokens enum in previous step) for chainlink address (if existing)
3) Create arbitrage script in scripts/arb/tokenx-whatever (copy from other scripts in parent folders)
4) Add `npx hardhat run` script to package.json for the script created in previous step
5) Profit

### To add CoolDex for arbitraging:
1) Edit **hardhat.config.ts** - add addresses for CoolDex factory, CoolDex router
2) Create contract for flashswapping from CoolDex in contracts/
3) Edit **scripts/constants.ts** - edit enum DEX, FlashSwapContractNames, FactoryNamedAccounts, RouterNamedAccounts
4) Create deploy script in deploy/ for any combination of flashswap contract between CoolDex and other Dex (copy from other scripts in the folder)
5) Run `yarn deploy --network fuji/mainnet` to deploy flashswap contracts to fuji or c-chain mainnet
6) Edit **hardhat.config.ts** - add addresses for flashswap contracts deployed in previous step. Must be in the format `flashSwap<DEX1><DEX2>` where `<DEX1>` and `<DEX2>` are values for Dex1 and Dex2 from DEX enum in scripts/constants.ts
7) Create arbitrage script in scripts/arb/ in whatever tokens combinations folders you want (copy from other scripts in parent folders)
8) Add `npx hardhat run` script to package.json for the script created in previous step
9) Profit
