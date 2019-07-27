import Vue from 'vue'
import Axios from 'axios'

import Kraken from '../exchanges/kraken'
import Bitmex from '../exchanges/bitmex'
import Coinex from '../exchanges/coinex'
import Huobi from '../exchanges/huobi'
import Binance from '../exchanges/binance'
import Bitfinex from '../exchanges/bitfinex'
import Bitstamp from '../exchanges/bitstamp'
import Gdax from '../exchanges/gdax'
import Hitbtc from '../exchanges/hitbtc'
import Okex from '../exchanges/okex'
import Poloniex from '../exchanges/poloniex'
import Liquid from '../exchanges/liquid'
import Deribit from '../exchanges/deribit'
import Bybit from '../exchanges/bybit'

import store from '../store'

let trades = [];
let ticks = [];
let queue = [];

const emitter = new Vue({
  data() {
    return {
      API_URL: null,
      API_SUPPORTED_PAIRS: null,
      PROXY_URL: null,

      exchanges: [
        new Bitmex(),
        new Bitfinex(),
        new Binance(),
        new Bitstamp(),
        new Gdax(),
        new Poloniex(),
        new Kraken(),
        new Okex(),
        new Deribit(),
        new Huobi(),
        new Hitbtc(),
        new Coinex(),
        new Liquid(),
        new Bybit(),
      ],

      _fetchedMax: false,
      _fetchedTime: 0,
      _fetchedBytes: 0,
      _firstCloses: {},
    }
  },
  computed: {
    pair() {
      return store.state.settings.pair
    },
    timeframe() {
      return store.state.settings.timeframe
    },
    exchangesSettings() {
      return store.state.settings.exchanges
    },
    showChart() {
      return store.state.settings.showChart
    },
    chartRange() {
      return store.state.settings.chartRange
    },
    showCounters() {
      return store.state.settings.showCounters
    },
    countersSteps() {
      return store.state.settings.countersSteps
    },
    isLoading() {
      return store.state.settings.isLoading
    },
    actives() {
      return store.state.app.actives
    },
  },
  created() {
    window.getTrades = () => trades

    this.exchanges.forEach((exchange) => {
      exchange.on('trades', (trades) => {
        if (!trades || !trades.length) {
          return
        }

        queue = queue.concat(trades)

        this.$emit('trades.raw', trades)
      })

      exchange.on('open', (event) => {
        console.log(`[socket.exchange.on.open] ${exchange.id} connected`)

        this.$emit('connected', exchange.id)
      })

      exchange.on('close', (event) => {
        console.log(`[socket.exchange.on.close] ${exchange.id} closed`)

        this.$emit('disconnected', exchange.id)

        if (
          exchange.shouldBeConnected &&
          !this.exchangesSettings[exchange.id].disabled
        ) {
          exchange.reconnect(this.pair)
        }
      })

      exchange.on('match', (pair) => {
        store.commit('settings/SET_EXCHANGE_MATCH', {
          exchange: exchange.id,
          match: pair,
        })
      })

      exchange.on('error', (event) => {
        console.log(
          `[socket.exchange.on.error] ${exchange.id} reported an error`
        )
      })

      store.dispatch('app/refreshExchange', exchange.id)
    })

    if (module.hot) {
      module.hot.dispose(() => {
        console.log('disconnect all exchanges (module.hot)')
        for (let i = 0; i < this.exchanges.length; i++) {
          this.exchanges[i].disconnect()
        }

        clearTimeout(this._connectExchangesTimeout)
        clearInterval(this._processQueueInterval)
      })
    }
  },
  methods: {
    initialize() {
      console.log(`[sockets] initializing ${this.exchanges.length} exchange(s)`)

      if (process.env.API_URL) {
        this.API_URL = process.env.API_URL
        console.info(`[sockets] API_URL = ${this.API_URL}`)

        if (process.env.API_SUPPORTED_PAIRS) {
          this.API_SUPPORTED_PAIRS = process.env.API_SUPPORTED_PAIRS.map((a) =>
            a.toUpperCase()
          )
          console.info(
            `[sockets] API_SUPPORTED_PAIRS = ${this.API_SUPPORTED_PAIRS}`
          )
        }
      }

      if (process.env.PROXY_URL) {
        this.PROXY_URL = process.env.PROXY_URL
        console.info(`[sockets] PROXY_URL = ${this.PROXY_URL}`)
      }

      this._connectExchangesTimeout = setTimeout(
        this.connectExchanges.bind(this)
      )

      this._processQueueInterval = setInterval(
        this.processQueue.bind(this),
        1000
      )
    },
    connectExchanges() {
      this.disconnectExchanges()

      if (!this.pair) {
        return store.dispatch('app/showNotice', {
          id: `server_status`,
          type: 'error',
          title: `No pair`,
          message: `Type the name of the pair you want to watch in the pair section of the settings panel`,
        })
      }

      trades = queue = ticks = []
      this._fetchedMax = false

      console.log(`[socket.connect] connecting to ${this.pair}`)

      store.dispatch('app/showNotice', {
        id: `server_status`,
        type: 'info',
        title: `Loading`,
        message: `Fetching products...`,
      })

      Promise.all(
        this.exchanges.map((exchange) => exchange.validatePair(this.pair))
      ).then(() => {
        let validExchanges = this.exchanges.filter((exchange) => exchange.valid)

        if (!validExchanges.length) {
          store.dispatch('app/showNotice', {
            id: `server_status`,
            type: 'error',
            title: `No match`,
            message: `"${this.pair}" did not matched with any active pairs`,
          })

          return
        }

        store.dispatch('app/showNotice', {
          id: `server_status`,
          type: 'info',
          title: `Loading`,
          message: `${validExchanges.length} exchange(s) matched ${this.pair}`,
        })

        console.log(
          `[socket.connect] ${
            validExchanges.length
          } successfully matched with ${this.pair}`
        )

        validExchanges = validExchanges.filter(
          (exchange) => !this.exchangesSettings[exchange.id].disabled
        )

        store.dispatch('app/showNotice', {
          id: `server_status`,
          type: 'info',
          title: `Loading`,
          message: `Subscribing to ${this.pair} on ${
            validExchanges.length
          } exchange(s)`,
          delay: 1000 * 5,
        })

        console.log(
          `[socket.connect] batch connect to ${validExchanges
            .map((a) => a.id)
            .join(' / ')}`
        )

        validExchanges.forEach((exchange) => exchange.connect())
      })
    },
    disconnectExchanges() {
      console.log(`[socket.connect] disconnect exchanges asynchronously`)

      this.exchanges.forEach((exchange) => exchange.disconnect())
    },
    cleanOldData() {
      if (this.isLoading) {
        return
      }

      let requiredTimeframe = 0

      if (this.showChart && this.chartRange) {
        requiredTimeframe = Math.max(requiredTimeframe, this.chartRange * 2)
      }

      const minTimestamp =
        Math.ceil((+new Date() - requiredTimeframe) / this.timeframe) *
        this.timeframe

      console.log(
        `[socket.clean] remove trades older than ${new Date(
          minTimestamp
        ).toLocaleString()}`
      )

      let i

      for (i = 0; i < ticks.length; i++) {
        if (ticks[i].timestamp >= minTimestamp) {
          break
        }
      }

      if (i && ticks.length) {
        this._fetchedMax = false
      }

      ticks.splice(0, i)

      for (i = 0; i < trades.length; i++) {
        if (trades[i][1] > minTimestamp) {
          break
        }
      }

      trades.splice(0, i)

      this.$emit('clean', minTimestamp)
    },
    getExchangeById(id) {
      for (let exchange of this.exchanges) {
        if (exchange.id === id) {
          return exchange
        }
      }

      return null
    },
    processQueue() {
      if (!queue.length) {
        return
      }

      const output = this.compressTrades(queue)

      trades = trades.concat(output)

      const stats = this.getStatsByTrades(output)

      queue.splice(0, queue.length)

      this.$emit('trades.queued', output, stats)
    },
    getStatsByTrades(trades) {
      const stats = {
        buyCount: 0,
        buySize: 0,
        buyAmount: 0,
        sellCount: 0,
        sellSize: 0,
        sellAmount: 0,
      }

      let i = trades.length

      while (i--) {
        if (this.actives.indexOf(trades[i].exchange) === -1) {
          trades.splice(i, 1)
        } else {
          if (trades[i].side === 'buy') {
            stats.buyCount += trades[i].count || 1
            stats.buySize += trades[i].size
            stats.buyAmount += trades[i].price * trades[i].size
          } else {
            stats.sellCount += trades[i].count || 1
            stats.sellSize += trades[i].size
            stats.sellAmount += trades[i].price * trades[i].size
          }
        }
      }

      return stats
    },
    compressTrades(trades) {
      const sums = {}
      const groups = {}
      const output = []

      for (let i = 0; i < trades.length; i++) {
        if (
          trades[i].price * trades[i].size <
          store.state.settings.thresholds[0].amount
        ) {
          const id =
            Math.floor(trades[i].timestamp / 1000) * 1000 +
            trades[i].exchange +
            trades[i].side

          if (groups[id]) {
            output[groups[id]].count++
            output[groups[id]].price += +trades[i].price
            output[groups[id]].size += +trades[i].size

            sums[id] += trades[i].price * trades[i].size

            continue
          } else {
            // index of the group
            groups[id] = output.length

            // init group count
            trades[i].count = 1

            sums[id] = trades[i].price * trades[i].size
          }
        }

        output.push(trades[i])
      }

      const groupIds = Object.keys(groups)

      for (let i = 0; i < groupIds.length; i++) {
        output[groups[groupIds[i]]].price =
          sums[groupIds[i]] / output[groups[groupIds[i]]].size
      }

      return output
    },
    canFetch() {
      return (
        this.API_URL &&
        (!this.API_SUPPORTED_PAIRS ||
          this.API_SUPPORTED_PAIRS.indexOf(this.pair) !== -1)
      )
    },
    getApiUrl(from, to) {
      let url = this.API_URL

      url = url.replace(/\{from\}/, from)
      url = url.replace(/\{to\}/, to)
      url = url.replace(/\{timeframe\}/, this.timeframe)
      url = url.replace(/\{pair\}/, this.pair.toLowerCase())
      url = url.replace(/\{exchanges\}/, this.actives.join('+'))

      return url
    },
    fetchRange(range, clear = false) {
      if (clear) {
        ticks.splice(0, ticks.length)
        this._fetchedMax = false
      }

      if (this.isLoading || !this.canFetch()) {
        return Promise.resolve(null)
      }

      const now = +new Date()

      const minData = Math.min(
        trades.length ? trades[0][1] : now,
        ticks.length ? ticks[0].timestamp : now
      )

      let promise
      let from = now - range
      let to = minData

      from = Math.ceil(from / this.timeframe) * this.timeframe
      to = Math.ceil(to / this.timeframe) * this.timeframe

      console.log(
        `[socket.fetchRange] minData: ${new Date(
          minData
        ).toLocaleString()}, from: ${new Date(
          from
        ).toLocaleString()}, to: ${to}`,
        this._fetchedMax ? '(FETCHED MAX)' : ''
      )

      if (!this._fetchedMax && to - from >= 60000 && from < minData) {
        console.info(
          `[socket.fetchRange]`,
          `FETCH NEEDED\n\n\tcurrent time: ${new Date(
            now
          ).toLocaleString()}\n\tfrom: ${new Date(
            from
          ).toLocaleString()}\n\tto: ${new Date(to).toLocaleString()} (${
            trades.length
              ? 'using first trade as base'
              : 'using now for reference'
          })`
        )

        promise = this.fetchHistoricalData(from, to)
      } else {
        promise = Promise.resolve()
      }

      return promise
    },
    fetchHistoricalData(from, to) {
      const url = this.getApiUrl(from, to)

      if (this.lastFetchUrl === url) {
        return Promise.resolve()
      }

      this.lastFetchUrl = url

      store.commit('app/TOGGLE_LOADING', true)

      this.$emit('fetchStart', to - from)

      return new Promise((resolve, reject) => {
        Axios.get(url, {
          onDownloadProgress: (e) => {
            this.$emit('loadingProgress', {
              loaded: e.loaded,
              total: e.total,
              progress: e.loaded / e.total,
            })

            this._fetchedBytes += e.loaded
          },
        })
          .then((response) => {
            if (
              !response.data ||
              !response.data.format ||
              !response.data.results.length
            ) {
              return resolve()
            }

            const format = response.data.format
            let data = response.data.results

            switch (response.data.format) {
              case 'trade':
                const lengthBeforeCompression = data.length

                data = this.compressTrades(
                  data.map((a) => ({
                    exchange: a[0],
                    timestamp: +a[1],
                    price: +a[2],
                    size: +a[3],
                    side: +a[4] > 0 ? 'buy' : 'sell',
                  }))
                )

                console.log(
                  'compression result',
                  data.length,
                  '(was ',
                  lengthBeforeCompression,
                  ')'
                )

                if (!trades.length) {
                  console.log(
                    `[socket.fetch] set socket.trades (${data.length} trades)`
                  )

                  trades = data
                } else {
                  const prepend = data.filter(
                    (trade) => trade.timestamp <= trades[0].timestamp
                  )
                  const append = data.filter(
                    (trade) =>
                      trade.timestamp >=
                      trades[trades.length - 1].timestamp
                  )

                  if (prepend.length) {
                    console.log(`[fetch] prepend ${prepend.length} ticks`)
                    trades = prepend.concat(trades)
                  }

                  if (append.length) {
                    console.log(`[fetch] append ${append.length} ticks`)
                    trades = trades.concat(append)
                  }
                }
                break
              case 'tick':
                ticks = data

                if (data[0].timestamp > from) {
                  console.log('[socket.fetch] fetched max')
                  this._fetchedMax = true
                }
                break
            }

            this.$emit('historical', data.filter(a => this.actives.indexOf(a.exchange) !== -1), format, from, to)

            resolve({
              format: format,
              data: data,
              from: from,
              to: to,
            })
          })
          .catch((err) => {
            this._fetchedMax = true

            err &&
              store.dispatch('app/showNotice', {
                type: 'error',
                title: `Unable to retrieve history`,
                message:
                  err.response && err.response.data && err.response.data.error
                    ? err.response.data.error
                    : err.message,
                id: `fetch_error`,
              })

            reject()
          })
          .then(() => {
            this._fetchedTime += to - from

            this.$emit('fetchEnd', to - from)

            store.commit('app/TOGGLE_LOADING', false)
          })
      })
    },
    getCurrentTimestamp() {
      return +new Date()
    },
    getInitialPrices() {
      if (!ticks.length && !trades.length) {
        return this._firstCloses
      }

      const closesByExchanges = this.exchanges.reduce((obj, exchange) => {
        obj[exchange.id] = null

        return obj
      }, {})

      if (!Object.keys(closesByExchanges).length) {
        return closesByExchanges
      }

      let gotAllCloses = false

      for (let tick of ticks) {
        if (
          typeof closesByExchanges[tick.exchange] === 'undefined' ||
          closesByExchanges[tick.exchange]
        ) {
          continue
        }

        closesByExchanges[tick.exchange] = tick.close

        if (
          gotAllCloses ||
          !Object.keys(closesByExchanges)
            .map((id) => closesByExchanges[id])
            .filter((close) => close === null).length
        ) {
          gotAllCloses = true

          break
        }
      }

      for (let trade of trades) {
        if (
          typeof closesByExchanges[trade[0]] === 'undefined' ||
          closesByExchanges[trade[0]]
        ) {
          continue
        }

        closesByExchanges[trade[0]] = trade[2]

        if (
          gotAllCloses ||
          !Object.keys(closesByExchanges)
            .map((id) => closesByExchanges[id])
            .filter((close) => close === null).length
        ) {
          gotAllCloses = true

          break
        }
      }

      for (let exchange in closesByExchanges) {
        if (closesByExchanges[exchange] === null) {
          delete closesByExchanges[exchange]
        }
      }

      this._firstCloses = closesByExchanges

      return closesByExchanges
    },
    getTrades(from, to) {
      const now = +new Date();

      if (!to && from && from < 1E10) {
        from = now - from
      } else if (!from) {
        from = 0
      }

      to = to || now

      const activeExchanges = this.actives.slice(0, this.actives.length);

      console.log('[socket] getTrades', new Date(from).toLocaleTimeString(), new Date(to).toLocaleTimeString())

      const output = []

      for (let i = trades.length - 1; i >= 0; i--) {
        if (trades[i].timestamp < from) {
          break;
        }

        if (trades[i].timestamp < to && trades[i].timestamp > from && activeExchanges.indexOf(trades[i].exchange) !== -1) {
          output.unshift(trades[i])
        }
      }
      
      console.log('[socket] getTrades', output.length, 'out of', trades.length)

      return output;
    }
  },
})

export default emitter
