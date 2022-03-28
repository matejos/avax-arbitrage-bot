import { Tokens, DEX } from '../../constants'
import createAndStartArbBot from '../../createArbBot'

createAndStartArbBot(Tokens.WAVAX, Tokens.USDT, DEX.SUSHISWAP, DEX.PANGOLIN)
