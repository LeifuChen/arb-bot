import { RpcWebSocketClient } from 'rpc-websocket-client'
import { getDeribitUrl } from '../providers/deribit'
import {
  DERIBIT_CLIENT_ID,
  DERIBIT_CLIENT_SECRET,
  DERIBIT_TESTNET,
  DERIBIT_TESTNET_CLIENT_ID,
  DERIBIT_TESTNET_CLIENT_SECRET,
} from '../secrets'
import { ProviderType } from '../types/arbs'
import { DeribitTradeArgs, DeribitTradeResult } from '../types/lyra'
import { TradeResult } from '../types/trade'
import { defaultResult } from './maketrade'

// DOCS: https://docs.deribit.com/?javascript#private-get_settlement_history_by_currency

export enum DeribitMethods {
  PrivateBuy = '/private/buy',
  PrivateSell = '/private/sell',
  PublicAuth = '/public/auth',
}

export enum DeribitOrderType {
  Limit = 'limit',
  Market = 'market',
}

export async function authenticateAndTradeDeribit(args: DeribitTradeArgs): Promise<DeribitTradeResult | undefined> {
  const rpc = new RpcWebSocketClient()
  await rpc.connect(getDeribitUrl())
  console.log(`Deribit ${DERIBIT_TESTNET ? 'TESTNET' : ''}: Connected!`)

  const config = getAuthConfig()
  const tradeConfig = getTradeConfig(args)

  // authenticate
  await rpc
    .call(config.method, config.params)
    .then((data) => {
      console.log(data)
      console.log(`Deribit ${DERIBIT_TESTNET ? 'TESTNET' : ''}: Authenticated!`)
    })
    .catch((err) => {
      console.log(err)
    })

  // trade
  await rpc
    .call(tradeConfig.method, tradeConfig.params)
    .then((data) => {
      console.log(`Deribit ${DERIBIT_TESTNET ? 'TESTNET' : ''}: Trade!`)
      return data as DeribitTradeResult
    })
    .catch((err) => {
      console.log(err)
    })
    .finally(() => rpc.ws.close())
  return undefined
}

export const makeTradeDeribit = async (args: DeribitTradeArgs): Promise<TradeResult> => {
  const deribitResponse = await authenticateAndTradeDeribit(args)
  const isSuccess = deribitResponse?.trades ? deribitResponse?.trades?.length > 0 : false
  const trade = deribitResponse?.trades[0]

  if (!trade) {
    return defaultResult(ProviderType.DERIBIT)
  }

  const price = trade?.price * trade?.index_price

  const result: TradeResult = {
    isSuccess: isSuccess,
    pricePerOption: price,
    failReason: '',
    provider: ProviderType.DERIBIT,
    deribitResult: deribitResponse,
    lyraResult: undefined,
  }

  return result
}

export function getTradeConfig(args: DeribitTradeArgs) {
  const config = {
    method: args.buy ? DeribitMethods.PrivateBuy : DeribitMethods.PrivateSell,
    params: {
      instrument_name: args.instrumentName,
      amount: args.amount,
      type: DeribitOrderType.Market,
    },
  }
  console.log(config)
  return config
}

export function getAuthConfig() {
  const config = {
    method: DeribitMethods.PublicAuth,
    params: {
      grant_type: 'client_credentials',
      client_id: DERIBIT_TESTNET ? DERIBIT_TESTNET_CLIENT_ID : DERIBIT_CLIENT_ID,
      client_secret: DERIBIT_TESTNET ? DERIBIT_TESTNET_CLIENT_SECRET : DERIBIT_CLIENT_SECRET,
    },
  }
  return config
}
