import Exchange from '../services/exchange'

class Binance extends Exchange {
  constructor(options) {
    super(options)

    this.id = 'binance'

    this.endpoints = {
      PRODUCTS: 'https://api.binance.com/api/v1/ticker/allPrices',
      TRADES: () =>
        `https://api.binance.com/api/v1/trades?symbol=${this.pair.toUpperCase()}`,
    }

    this.matchPairName = (pair) => {
      pair = pair.replace(/USD$/, 'USDT')

      if (this.products.indexOf(pair) !== -1) {
        return pair.toLowerCase()
      }

      return false
    }

    this.options = Object.assign(
      {
        url: () => {
          return 'wss://stream.binance.com:9443/stream?streams=' + this.pairs.map(pair => `${pair}@aggTrade`).join('/')
        },
      },
      this.options
    )
  }

  connect() {
    if (!super.connect()) return

    this.api = new WebSocket(this.getUrl())

    this.api.onmessage = (event) =>
      this.emitTrades(this.formatLiveTrades(JSON.parse(event.data)))

    this.api.onopen = this.emitOpen.bind(this)

    this.api.onclose = this.emitClose.bind(this)

    this.api.onerror = this.emitError.bind(this, { message: 'Websocket error' })
  }

  disconnect() {
    if (!super.disconnect()) return

    if (this.api && this.api.readyState < 2) {
      this.api.close()
    }
  }

  formatLiveTrades(trade) {
    if (trade && trade.data) {
      return [{
        exchange: this.id,
        timestamp: trade.data.E,
        price: +trade.data.p,
        size: +trade.data.q,
        side: trade.data.m ? 'sell' : 'buy',
        pair: trade.data.s
      }]
    }

    return false
  }

  /* formatRecentsTrades(data) {
    return data.map(trade => [
      this.id,
      trade.time,
      trade.price,
      trade.qty,
      !trade.isBuyerMaker ? 1 : 0
    ])
  } */

  formatProducts(data) {
    return data.map((a) => a.symbol)
  }
}

export default Binance
