import Exchange from '../services/exchange'
import Pusher from 'pusher-js'

class Bitstamp extends Exchange {
  constructor(options) {
    super(options)

    this.id = 'bitstamp'

    this.endpoints = {
      PRODUCTS: 'https://www.bitstamp.net/api/v2/trading-pairs-info/',
      TRADES: () => `https://www.bitstamp.net/api/v2/transactions/${this.pair}`,
    }

    this.matchPairName = (pair) => {
      if (this.products.indexOf(pair) !== -1) {
        return pair.toLowerCase()
      }

      return false
    }

    this.options = Object.assign(
      {
        url: 'wss://ws.bitstamp.net',
      },
      this.options
    )
  }

  connect() {
    if (!super.connect()) return

    this.api = new WebSocket(this.getUrl())

    this.api.onmessage = (event) =>
      this.emitTrades(this.formatLiveTrades(JSON.parse(event.data)))

    this.api.onopen = (event) => {
      for (let i = 0; i < this.pairs.length; i++) {
        this.api.send(
          JSON.stringify({
            event: 'bts:subscribe',
            data: {
              channel: 'live_trades_' + this.pairs[i]
            }
          })
        )
      }

      this.emitOpen(event)
    }

    this.api.onclose = this.emitClose.bind(this)

    this.api.onerror = this.emitError.bind(this, { message: 'Websocket error' })
  }

  disconnect() {
    if (!super.disconnect()) return

    if (this.api && this.api.readyState < 2) {
      this.api.close()
    }
  }

  formatLiveTrades(json) {
    if (json.event !== 'trade') {
      return;
    }

    const trade = json.data;

    return [
      {
        exchange: this.id,
        timestamp: parseInt(trade.microtimestamp / 1000),
        price: trade.price,
        size: trade.amount,
        side: trade.type === 0 ? 'buy' : 'sell',
        pair: json.channel.substr(12)
      }
    ]
  }

  /* formatRecentsTrades(response) {
    if (response && response.length) {
      return response.map(trade => [
        this.id,
        trade.date * 1000,
        +trade.price,
        +trade.amount,
        trade.type === '1' ? 1 : 0
      ]);
    }
  } */

  formatProducts(data) {
    return data.map((a) => a.name.replace('/', ''))
  }
}

export default Bitstamp
