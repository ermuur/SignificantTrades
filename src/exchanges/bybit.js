const Exchange = require('../exchange');
const WebSocket = require('ws');

class Bybit extends Exchange {

	constructor(options) {
		super(options);

    this.id = 'bybit'

    this.pairs = ['BTCUSD', 'ETHUSD', 'EOSUSD', 'XRPUSD']

    this.mapping = pair => {
      if (this.pairs.indexOf(pair) !== -1) {
        return pair;
      }

      return false;
    }

    this.options = Object.assign(
      {
        url: () => {
          return `wss://stream.bybit.com/realtime`
        },
      },
      this.options
    )
  }

  connect(pair) {
    if (!super.connect(pair)) return

    this.api = new WebSocket(this.getUrl())

    this.api.onmessage = (event) =>
      this.emitData(this.format(JSON.parse(event.data)))

    this.api.onopen = (event) => {
      this.api.send(
        JSON.stringify({
          op: 'subscribe',
          args: ['trade.' + this.pair],
        })
      )

      this.emitOpen(event)
    }

    this.api.onclose = (event) => {
      this.emitClose(event)

      clearInterval(this.keepalive)
    }

    this.api.onerror = this.emitError.bind(this, { message: 'Websocket error' })
  }

  disconnect() {
    if (!super.disconnect()) return

    if (this.api && this.api.readyState < 2) {
      this.api.close()
    }
  }

  format(json) {
    if (
      !json.data ||
      !json.data.length
    ) {
      return
    }

    return json.data.map((trade) => [
      +new Date(trade.timestamp),
      +trade.price,
      trade.size / trade.price,
      trade.side === 'Buy' ? 1 : 0
    ])
  }
}

module.exports = Bybit;