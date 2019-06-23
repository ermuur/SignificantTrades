<template>
  <div id="stats" class="stats">
    <ul class="stats__items">
      <li
        v-tippy
        title="Number of trades"
      >
        <Measurement v-if="statsGraphs" ref="tradesMeasurement" :timeframe="statsGraphsTimeframe" :length="statsGraphsLength" />
        <div class="stats__label">TRADES</div>
        <div class="stats__value">
          {{ $root.formatAmount(totalOrders) }}
        </div>
      </li>
      <li
        v-tippy
        title="Average order"
      >
        <Measurement v-if="statsGraphs" ref="avgMeasurement" :timeframe="statsGraphsTimeframe" :length="statsGraphsLength" />
        <div class="stats__label">AVG</div>
        <div class="stats__value">
          <span class="icon-currency"></span>
          {{ $root.formatAmount(totalVolume / totalOrders, 2) }}
        </div>
      </li>
      <li
        v-tippy
        title="Volume delta"
      >
        <Measurement v-if="statsGraphs" ref="volDeltaMeasurement" :timeframe="statsGraphsTimeframe" :length="statsGraphsLength" />
        <div class="stats__label">VOL &Delta;</div>
        <div class="stats__value">
          <span class="icon-currency"></span>
          {{ $root.formatAmount(volDelta, 1) }}
        </div>
      </li>
      <li
        v-tippy
        title="Order delta"
      >
        <Measurement v-if="statsGraphs" ref="countDeltaMeasurement" :timeframe="statsGraphsTimeframe" :length="statsGraphsLength" />
        <div class="stats__label">TRADES &Delta;</div>
        <div class="stats__value">
          {{ $root.formatAmount(countDelta, 1) }}
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../services/socket'

import Measurement from './ui/Measurement.vue'

const stacks = []

export default {
  components: {
    Measurement
  },
  data() {
    return {
      timestamp: null,
      periodLabel: null,
      statsPrecision: 1000,
      data: {
        buyAmount: 0,
        buyCount: 0,
        sellAmount: 0,
        sellCount: 0,
      }
    }
  },

  computed: {
    totalOrders() {
      return this.data.buyCount + this.data.sellCount
    },
    totalVolume() {
      return this.data.buyAmount + this.data.sellAmount
    },
    countDelta() {
      return this.data.buyCount - this.data.sellCount
    },
    volDelta() {
      return this.data.buyAmount - this.data.sellAmount
    },
    ...mapState([
      'statsPeriod',
      'statsGraphs',
      'statsGraphsTimeframe',
      'statsGraphsLength',
      'preferQuoteCurrencySize',
      'actives'
    ]),
  },
  created() {
    const now = +new Date()

    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'reloadExchangeState':
        case 'setStatsPeriod':
        case 'toggleBaseCurrencySize':
          this.rebuildStats()
          break
      }
    })
  },
  mounted() {
    this.rebuildStats()

    socket.$on('trades.queued', this.onTrades)
    socket.$on('historical', this.onFetch)
  },
  beforeDestroy() {
    socket.$off('trades.queued', this.onTrades)
    socket.$off('historical', this.onFetch)

    clearInterval(this.statsRefreshCycleInterval)

    this.onStoreMutation()
  },
  methods: {
    onTrades(trades, stats) {
      console.log('onTrades', stats.buyCount, stats.sellCount)
      // update display
      this.buyAmount += this.preferQuoteCurrencySize ? stats.buyAmount : buySize
      this.buyCount += stats.buyCount
      this.sellAmount += this.preferQuoteCurrencySize ? stats.sellAmount : sellSize
      this.sellCount += stats.sellCount

      // update temporary data
      this.temp.buyAmount += this.preferQuoteCurrencySize ? stats.buyAmount : buySize
      this.temp.buyCount += stats.buyCount
      this.temp.sellAmount += this.preferQuoteCurrencySize ? stats.sellAmount : sellSize
      this.temp.sellCount += stats.sellCount

      this.hasTemporaryData = true
    },
    onFetch(trades, from, to) {
      const now = +new Date()

      if (to > now - this.statsPeriod) {
        this.rebuildStats()
      }
    },
    rebuildStats() {
      clearInterval(this.statsRefreshCycleInterval)

      const now = +new Date()
      
      stacks.splice(0, stacks.length)

      this.hasTemporaryData = false
      this.temp = Object.keys(this.data).reduce((obj, prop) => {
        obj[prop] = 0

        return obj
      }, {})

      console.log('rebuildStats')

      if (this.statsGraphs) {
        this.$refs.tradesMeasurement.clear();
        this.$refs.avgMeasurement.clear();
        this.$refs.volDeltaMeasurement.clear();
        this.$refs.countDeltaMeasurement.clear();
      }

      for (let i = socket.trades.length - 1; i >= 0; i--) {
        if (socket.trades[i].timestamp < now - this.statsPeriod) {
          break;
        }

        const isBuy = socket.trades[i].side === 'buy'
        const amount = socket.trades[i].size * (this.preferQuoteCurrencySize ? socket.trades[i].price : 1)

        if (stacks.length && socket.trades[i].timestamp > stacks[stacks.length - 1].timestamp) {
          console.log('update stack (stacks.length - 1) at timestamp, index', (stacks.length - 1), stacks[stacks.length - 1].timestamp, new Date(stacks[stacks.length - 1].timestamp).toLocaleTimeString())
          stacks[stacks.length - 1][isBuy ? 'buyAmount' : 'sellAmount'] += amount
          stacks[stacks.length - 1][isBuy ? 'buyCount' : 'sellCount'] += socket.trades[i].count || 1
        } else {
          console.log(`create stack with ${isBuy ? socket.trades[i].count || 1 : 0} buys + ${!isBuy ? socket.trades[i].count || 1 : 0} sells, will expire at ${new Date(now - this.statsPrecision * (stacks.length + 1) + this.statsPeriod).toLocaleTimeString()}`)
          stacks.push({
            timestamp: now - this.statsPrecision * (stacks.length + 1), // stack "from" date
            buyAmount: isBuy ? amount : 0,
            buyCount: isBuy ? socket.trades[i].count || 1 : 0,
            sellAmount: !isBuy ? amount : 0,
            sellCount: !isBuy ? socket.trades[i].count || 1 : 0
          })
        }
      }

      this.updateStats(now)

      this.statsRefreshCycleInterval = window.setInterval(
        this.updateStats.bind(this),
        500
      )
    },
    updateStats(timestamp = null) {
      const now = timestamp || +new Date()

      let buyAmount = 0
      let sellAmount = 0
      let buyCount = 0
      let sellCount = 0

      let i = stacks.length;

      if (this.hasTemporaryData) {
        console.log('has temporary data')
        if (!i || stacks[0].timestamp + this.statsPrecision < now) {
          console.log(!i ? 'no stack => create first' : `latest stack too late, need new (${new Date(stacks[0].timestamp + this.statsPrecision).toLocaleTimeString()} < ${new Date(now).toLocaleTimeString()})`, `this stack will expire at ${new Date(now + this.statsPeriod).toLocaleTimeString()}`)
          stacks.unshift({
            timestamp: now,
            buyAmount: this.temp.buyAmount,
            buyCount: this.temp.buyCount,
            sellAmount: this.temp.sellAmount,
            sellCount: this.temp.sellCount
          })
        } else {
          console.log('update latest stack')
          stacks[0].buyAmount += this.temp.buyAmount
          stacks[0].buyCount += this.temp.buyCount
          stacks[0].sellAmount += this.temp.sellAmount
          stacks[0].sellCount += this.temp.sellCount
        }

        this.temp.buyAmount = 0
        this.temp.buyCount = 0
        this.temp.sellAmount = 0
        this.temp.sellCount = 0

        this.hasTemporaryData = false
      }

      while (i--) {
        if (stacks[i].timestamp + this.statsPeriod < now) {
          console.log('stack with index' + i + 'expired', `(expiration: ${new Date(stacks[i].timestamp + this.statsPeriod).toLocaleTimeString()}) <  now (${new Date(now - this.statsPeriod).toLocaleTimeString()})`)
          stacks.splice(i, 1)
        } else {
          buyAmount += stacks[i].buyAmount
          sellAmount += stacks[i].sellAmount
          buyCount += stacks[i].buyCount
          sellCount += stacks[i].sellCount
        }
      }

      if (i !== stacks.length) {
        console.log('stats count ===', stacks.length)
      }

      this.data.buyAmount = buyAmount
      this.data.sellAmount = sellAmount
      this.data.buyCount = buyCount
      this.data.sellCount = sellCount

      if (this.statsGraphs) {
        this.$refs.tradesMeasurement.append(this.totalOrders);
        this.$refs.avgMeasurement.append(this.totalOrders ? this.totalVolume / this.totalOrders : 0);
        this.$refs.volDeltaMeasurement.append(this.volDelta);
        this.$refs.countDeltaMeasurement.append(this.countDelta);
      }
    },
  },
}
</script>

<style lang="scss">
@import '../assets/sass/variables';

.stats {
  position: relative;
  background-color: rgba(white, 0.05);

  .stats__label {
    opacity: 0.5;
    font-size: 0.6em;
    letter-spacing: 1px;
  }

  .stats__value {
    text-align: right;
    white-space: nowrap;
    font-family: 'Roboto Condensed';
    z-index: 1;
  }

  .stats__items {
    display: flex;
    align-items: center;
    list-style: none;
    padding: 0;
    margin: 0;

    > li {
      display: flex;
      align-items: center;
      flex-grow: 1;
      flex-direction: column;
      flex-basis: 0;
      position: relative;

      &:hover .measurement {
        fill: $blue;
        opacity: 1;

        ~ .stats__label {
          opacity: .5;
        }
      }
    }

    .stats__label {
      margin-top: .5rem;
      z-index: 1;
    }

    .stats__value {
      margin-bottom: .5rem;
    }

    .measurement {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;

      opacity: .25;

      stroke: none; 
      fill: white;
    }

    sup {
      font-size: 75%;
      display: none;
    }

    @media screen and (min-width: 768px) {
      sup {
        display: inline-block;
      }
    }
  }
}
</style>
