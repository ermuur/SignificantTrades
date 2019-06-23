import EventEmitter from 'eventemitter3'

class Exchange extends EventEmitter {
  constructor(options) {
    super()

    this.id = this.constructor.name.toLowerCase()

    this.indexedProducts = []
    this.connected = false
    this.valid = false
    this.timestamp = null
    this.price = null
    this.error = null
    this.shouldBeConnected = false
    this.reconnectionDelay = 5000

    this._pair = []

    this.options = Object.assign(
      {
        // default exchanges options
      },
      options || {}
    )

    try {
      const storage = JSON.parse(localStorage.getItem(this.id))

      if (
        storage &&
        +new Date() - storage.timestamp < 1000 * 60 * 60 * 24 * 7 &&
        (this.id !== 'okex' || storage.timestamp > 1560235687982)
      ) {
        console.info(`[${this.id}] reading stored products`)

        this.products = storage.data

        if (
          !this.products ||
          (Array.isArray(this.products) && !this.products.length) ||
          (typeof this.products === 'object' && !Object.keys(this.products).length)
        ) {
          this.products = null
        }
      } else {
        console.info(`[${this.id}] products data expired`)
      }
    } catch (error) {
      console.error(`[${this.id}] unable to retrieve stored products`, error)
    }

    this.indexProducts();
  }

  set pair(name) {
    if (!this.products || !name) {
      this._pair = []
      return
    }

    this._pair = name.split('+').map(a => {
      if (this.matchPairName && typeof this.matchPairName === 'function') {
        return this.matchPairName(a)
      } else if (Array.isArray(this.products) && this.products.indexOf(a) !== -1) {
        return a
      } else if (typeof this.products === 'object') {
        return this.products[a] || null
      } else {
        return null
      }
    }).filter(a => !!a)
  }

  get pair() {
    return this._pair[0]
  }

  get pairs() {
    return this._pair
  }

  connect(reconnection = false) {
    if (this.connected) {
      this.disconnect()
    }

    if (this.valid) {
      console.log(
        `[${this.id}] ${reconnection ? 're' : ''}connecting... (${this.pairs.join(', ')})`
      )

      this.shouldBeConnected = true

      return true
    }
  }

  disconnect() {
    clearTimeout(this.reconnectionTimeout)

    this.shouldBeConnected = false
    this.timestamp = null
    this.price = null
    this.error = null

    return true
  }

  reconnect() {
    clearTimeout(this.reconnectionTimeout)

    if (this.connected) {
      return
    }

    console.log(
      `[${this.id}] schedule reconnection (${this.reconnectionDelay} ms)`
    )

    this.reconnectionTimeout = setTimeout(() => {
      if (!this.connected) {
        this.connect(true)
      }
    }, this.reconnectionDelay)

    this.reconnectionDelay *= 2
  }

  emitOpen(event) {
    this.connected = true

    this.reconnectionDelay = 5000

    this.emit('open', event)
  }

  emitTrades(trades) {
    if (!trades || !trades.length) {
      return
    }

    const output = this.groupTrades(trades)

    this.price = output[output.length - 1].price
    this.timestamp = +new Date()

    this.emit('trades', output)
  }

  /**
   * Larges trades are often sent in the form on multiples trades
   * For example a $1000000 trade on BitMEX can be received as 20 "small" trades, registered on the same timestamp (and side)
   * groupTrades makes sure the output is a single $1000000 
   * and not 20 multiple trades which would show as multiple 100k$ in the TradeList
   *
   * @param {*} trades
   * @returns
   * @memberof Exchange
   */
  groupTrades(trades) {
    const groups = {}
    const sums = {}
    const output = []

    for (let i = 0; i < trades.length; i++) {
      const id = parseInt(trades[i][1]).toFixed() + '_' + trades[i][4] // timestamp + side

      trades[i].price = +trades[i].price;
      trades[i].size = +trades[i].size;

      if (groups[id]) {
        groups[id].price += +trades[i].price
        groups[id].size += +trades[i].size
        sums[id] += trades[i].price * trades[i].size
      } else {
        groups[id] = trades[i]

        sums[id] = trades[i].price * trades[i].size;
      }
    }

    const ids = Object.keys(groups);

    for (let i = 0; i < ids.length; i++) {
      groups[ids[i]].price = sums[ids[i]] / groups[ids[i]].size

      output.push(groups[ids[i]]);
    }

    return output
  }

  toFixed(number, precision) {
    var factor = Math.pow(10, precision)
    return Math.ceil(number * factor) / factor
  }

  emitError(error) {
    this.error = error.message || 'Unknown error'

    this.emit('error')
  }

  emitClose(event) {
    this.connected = false

    this.emit('close', event)
  }

  getUrl() {
    return typeof this.options.url === 'function'
      ? this.options.url.apply(this, arguments)
      : this.options.url
  }

  formatLiveTrades(data) {
    return data
  }

  /* formatRecentsTrades(data) {
    return data;
  } */

  formatProducts(data) {
    return data
  }

  validatePair(pair) {
    this.valid = false

    if (typeof this.products === 'undefined') {
      return this.fetchProducts().then((data) => this.validatePair(pair))
    }

    if (!pair || (pair && (!(this.pair = pair) || !this.pairs.length))) {
      console.log(`[${this.id}] unknown pair ${pair}`)

      this.emit('error', new Error(`Unknown pair ${pair}`))

      this.emit('match', null)

      return Promise.resolve()
    }

    this.valid = true

    this.emit('match', this.pair)

    return Promise.resolve()
  }

  /* fetchRecentsTrades() {
    if (!this.endpoints || !this.endpoints.TRADES) {
      this.products = [];

      return Promise.resolve();
    }

    let urls = typeof this.endpoints.TRADES === 'function' ? this.endpoints.TRADES(this.pair) : this.endpoints.TRADES

    if (!Array.isArray(urls)) {
      urls = [urls];
    }

    console.log(`[${this.id}] fetching recent trades...`, urls)

    return new Promise((resolve, reject) => {
      return Promise.all(urls.map(action => {
        action = action.split('|');

        let method = action.length > 1 ? action.shift() : 'GET';
        let url = action[0];

        return fetch(`${process.env.PROXY_URL ? process.env.PROXY_URL : ''}${url}`, {method: method})
        .then(response => response.json())
        .catch(response => [])
      })).then(data => {
        console.log(`[${this.id}] received API recents trades => format trades`);

        if (data.length === 1) {
          data = data[0];
        }

        const trades = this.formatRecentsTrades(data);

        if (!trades || !trades.length) {
          return resolve();
        }

        return resolve(trades);
      });
    });
  } */

  refreshProducts() {
    localStorage.removeItem(this.id)
    this.products = null

    return this.fetchProducts()
  }

  indexProducts() {
    this.indexedProducts = []
    
    if (!this.products) {
      return
    }

    if (Array.isArray(this.products)) {
      this.indexedProducts = this.products.slice(0, this.products.length)
    } else if (typeof this.products === 'object') {
      this.indexedProducts = Object.keys(this.products)
    }
  }

  fetchProducts() {
    if (!this.endpoints || !this.endpoints.PRODUCTS) {
      this.products = []

      return Promise.resolve()
    }

    let urls =
      typeof this.endpoints.PRODUCTS === 'function'
        ? this.endpoints.PRODUCTS(this.pair)
        : this.endpoints.PRODUCTS

    if (!Array.isArray(urls)) {
      urls = [urls]
    }

    console.log(`[${this.id}] fetching products...`, urls)

    return new Promise((resolve, reject) => {
      return Promise.all(
        urls.map((action, index) => {
          action = action.split('|')

          let method = action.length > 1 ? action.shift() : 'GET'
          let url = action[0]

          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(
                fetch(
                  `${process.env.PROXY_URL ? process.env.PROXY_URL : ''}${url}`,
                  { method: method }
                )
                  .then((response) => response.json())
                  .catch((err) => {
                    console.log(err)

                    return null
                  })
              )
            }, 500)
          })
        })
      ).then((data) => {
        console.log(
          `[${this.id}] received API products response => format products`
        )

        if (data.length === 1) {
          data = data[0]
        }

        if (data) {
          this.products = this.formatProducts(data) || []

          console.log(`[${this.id}] storing products`, this.products)

          localStorage.setItem(
            this.id,
            JSON.stringify({
              timestamp: +new Date(),
              data: this.products,
            })
          )
        } else {
          this.products = null
        }

        this.indexProducts();

        resolve(this.products)
      })
    })
  }
}

export default Exchange
