const Exchange = require('../exchange')
const WebSocket = require('ws')

class Kraken extends Exchange {
  constructor(options) {
    super(options)

    this.id = 'kraken'

    this.pairs = [
      'ADACAD',
      'ADAETH',
      'ADAEUR',
      'ADAUSD',
      'ADAXBT',
      'ATOMCAD',
      'ATOMETH',
      'ATOMEUR',
      'ATOMUSD',
      'ATOMXBT',
      'BCHEUR',
      'BCHUSD',
      'BCHXBT',
      'DASHEUR',
      'DASHUSD',
      'DASHXBT',
      'EOSETH',
      'EOSEUR',
      'EOSUSD',
      'EOSXBT',
      'GNOETH',
      'GNOEUR',
      'GNOUSD',
      'GNOXBT',
      'QTUMCAD',
      'QTUMETH',
      'QTUMEUR',
      'QTUMUSD',
      'QTUMXBT',
      'USDTUSD',
      'ETCETH',
      'ETCXBT',
      'ETCEUR',
      'ETCUSD',
      'ETHXBT',
      'ETHXBT.d',
      'ETHCAD',
      'ETHCAD.d',
      'ETHEUR',
      'ETHEUR.d',
      'ETHGBP',
      'ETHGBP.d',
      'ETHJPY',
      'ETHJPY.d',
      'ETHUSD',
      'ETHUSD.d',
      'LTCXBT',
      'LTCEUR',
      'LTCUSD',
      'MLNETH',
      'MLNXBT',
      'REPETH',
      'REPXBT',
      'REPEUR',
      'REPUSD',
      'XTZCAD',
      'XTZETH',
      'XTZEUR',
      'XTZUSD',
      'XTZXBT',
      'XBTCAD',
      'XBTCAD.d',
      'XBTEUR',
      'XBTEUR.d',
      'XBTGBP',
      'XBTGBP.d',
      'XBTJPY',
      'XBTJPY.d',
      'XBTUSD',
      'XBTUSD.d',
      'XDGXBT',
      'XLMXBT',
      'XLMEUR',
      'XLMUSD',
      'XMRXBT',
      'XMREUR',
      'XMRUSD',
      'XRPXBT',
      'XRPCAD',
      'XRPEUR',
      'XRPJPY',
      'XRPUSD',
      'ZECXBT',
      'ZECEUR',
      'ZECJPY',
      'ZECUSD'
    ]

    this.mapping = name => {
      name = name.trim().replace('/', '')

      if (
        this.pairs.indexOf(name) !== -1 ||
        ((name = name.replace('BTC', 'XBT')) && this.pairs.indexOf(name) !== -1)
      ) {
        if (name.indexOf('/') === -1) {
          name = name.slice(0, name.length - 3) + '/' + name.slice(name.length - 3, name.length)
        }

        return name
      }

      return false
    }

    this.options = Object.assign(
      {
        url: () => {
          return `wss://ws.kraken.com`
        }
      },
      this.options
    )
  }

  connect(pair) {
    if (!super.connect(pair)) return

    this.api = new WebSocket(this.getUrl())

    this.api.onmessage = event => this.emitData(this.format(JSON.parse(event.data)))
    this.api.onopen = event => {
      this.api.send(
        JSON.stringify({
          event: 'subscribe',
          pair: [this.pair],
          subscription: {
            name: 'trade'
          }
        })
      )

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

  format(json) {
    if (json && json[1] && json[1].length) {
      return json[1].map(trade => [trade[2] * 1000, +trade[0], +trade[1], trade[3] === 'b' ? 1 : 0])
    }

    return false
  }
}

module.exports = Kraken
