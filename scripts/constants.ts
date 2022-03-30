export enum Tokens {
    WAVAX = 'wavax',
    JOE = 'joe',
    USDT = 'usdt',
    MYCOIN = 'mycoin',
}

export enum DEX {
    PANGOLIN = 'Pangolin',
    SUSHISWAP = 'Sushi',
    TRADERJOE = 'Joe',
}

export const FlashSwapContractNames: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'FlashSwapPangolin',
    [DEX.SUSHISWAP]: 'FlashSwapSushi',
    [DEX.TRADERJOE]: 'FlashSwapJoe',
}

export const FactoryNamedAccounts: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'pangolinFactory',
    [DEX.SUSHISWAP]: 'sushiFactory',
    [DEX.TRADERJOE]: 'joeFactory',
}

export const RouterNamedAccounts: { [key in DEX]: string } = {
    [DEX.PANGOLIN]: 'pangolinRouter',
    [DEX.SUSHISWAP]: 'sushiRouter',
    [DEX.TRADERJOE]: 'joeRouter',
}
