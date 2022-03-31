// Value must correspond with xyzChainLink keys in hardhat.config.ts
export enum Tokens {
    WAVAX = 'wavax',
    JOE = 'joe',
    USDT = 'usdt',
    MYCOIN = 'mycoin',
}

// Value must correspond with flashSwapXY keys in hardhat.config.ts
export enum DEX {
    PANGOLIN = 'Pangolin',
    SUSHISWAP = 'Sushi',
    TRADERJOE = 'Joe',
}

// Name of a flashswap contract (as specified in .sol)
export const FlashSwapContractNames: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'FlashSwapPangolin',
    [DEX.SUSHISWAP]: 'FlashSwapSushi',
    [DEX.TRADERJOE]: 'FlashSwapJoe',
}

// Key of address for dex factory specified in hardhat.config.ts
export const FactoryNamedAccounts: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'pangolinFactory',
    [DEX.SUSHISWAP]: 'sushiFactory',
    [DEX.TRADERJOE]: 'joeFactory',
}

// Key of address for dex router specified in hardhat.config.ts
export const RouterNamedAccounts: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'pangolinRouter',
    [DEX.SUSHISWAP]: 'sushiRouter',
    [DEX.TRADERJOE]: 'joeRouter',
}
