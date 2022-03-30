import { Tokens, DEX } from '../../constants'
import createAndStartArbBot from '../../createArbBot'

createAndStartArbBot(Tokens.WAVAX, Tokens.MYCOIN, DEX.PANGOLIN, DEX.SUSHISWAP)
