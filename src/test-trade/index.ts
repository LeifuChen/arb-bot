import { makeTradeLyra } from '../actions/maketrade'
import { makeTradeDeribit } from '../actions/maketradeDeribit'
import { TokenNames } from '../constants/token'
import { reportTrade } from '../strategy'
import { Strategy } from '../types/arbConfig'
import { Instrument, OptionType, ProviderType, Underlying } from '../types/arbs'
import { LyraTradeArgs, Arb, DeribitTradeArgs } from '../types/lyra'
import printObject from '../utils/printObject'

// TEST DEFAULTS
const lyraArgs: LyraTradeArgs = {
  size: 0.01,
  market: Underlying.ETH,
  call: true,
  buy: false,
  strike: 289,
  collat: 0.01,
  base: true,
  stable: TokenNames.sUSD,
}

const buyInstrument: Instrument = {
  type: OptionType.CALL,
  askPrice: 1,
  bidPrice: 1,
  midPrice: 1,
  provider: ProviderType.DERIBIT,
  expiration: 0,
  term: '',
  strike: 1,
  id: 1, // todo hook up correct ID
}

const sellInstrument: Instrument = {
  type: OptionType.CALL,
  askPrice: 1,
  bidPrice: 1,
  midPrice: 1,
  provider: ProviderType.LYRA,
  expiration: 0,
  term: '',
  strike: 1,
  id: 1, // todo hook up correct ID
}

const arb: Arb = {
  apy: 10,
  discount: 3,
  term: 'term',
  strike: 1500,
  amount: 0.01,
  expiration: 1669554641481,
  type: OptionType.CALL,
  buy: buyInstrument,
  sell: sellInstrument,
}

const strategy: Strategy = {
  market: Underlying.ETH,
  optionTypes: [OptionType.CALL],
  maxCollat: 1,
  tradeSize: 1,
  colatPercent: 100,
  isBuyFirst: false,
  profitThreshold: 3,
  minAPY: 20,
  sellLyraOnly: false,
  spotStrikeDiff: 0,
  mostProfitableOnly: true,
}

export async function testRevertTradeLyra() {
  // test reverting the
  const result = await makeTradeLyra(lyraArgs)
  printObject(result)
  await reportTrade(arb, result, strategy, 1, true, false)

  //
  lyraArgs.buy = false
  const result2 = await makeTradeLyra(lyraArgs)

  await reportTrade(arb, result2, strategy, 1, false, true)
}

export async function testRevertTradeDeribit() {
  // leg 1
  const deribitArgs: DeribitTradeArgs = {
    amount: 1,
    instrumentName: 'ETH-30DEC22-2000-C',
    buy: true,
  }

  const result = await makeTradeDeribit(deribitArgs)
  printObject(result)
  await reportTrade(arb, result, strategy, 1, true, false)

  // leg 2

  deribitArgs.buy = false
  const result2 = await makeTradeDeribit(deribitArgs)
  await reportTrade(arb, result2, strategy, 1, false, true)
}