import { Tokens, DEX } from '../../constants'
import createAndStartArbBot from '../../createArbBot'

createAndStartArbBot(Tokens.WAVAX, Tokens.JOE, DEX.PANGOLIN, DEX.TRADERJOE)
