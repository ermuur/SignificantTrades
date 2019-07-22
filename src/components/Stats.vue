<template>
  <div id="stats" class="stats">
    <div v-for="(value, name) in data" :key="name">{{name}} {{ value }}</div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../services/socket'
import Counter from '../utils/counter'

/** @type {Counter[]} */
const counters = []
const CUSTOM_COUNTER = {
  trades: `[stats.buyCount + stats.sellCount]`
}

export default {
  data() {
    return {
      data: Object.keys(CUSTOM_COUNTER).reduce((obj, name) => {
        obj[name] = 0
        return obj
      }, {})
    }
  },

  computed: {
    ...mapState('settings', [
      'statsPeriod',
      'statsGraphs',
      'statsGraphsTimeframe',
      'statsGraphsLength',
      'preferQuoteCurrencySize'
    ]),
    ...mapState('app', [
      'actives'
    ]),
  },
  created() {
    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'reloadExchangeState':
        case 'settings/SET_STATS_PERIOD':
        case 'settings/SET_QUOTE_AS_PREFERED_CURRENCY':
          break
      }
    })
  },
  mounted() {
    for (let name in CUSTOM_COUNTER) {
      counters.push(new Counter([0], (stats, trades) => eval(CUSTOM_COUNTER[name]), false))
      counters[counters.length - 1].name = name;
      this.data[name] = 0
    }

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
      for (let i = 0; i < counters.length; i++) {
        counters[i].onTrades(trades, stats)
        this.$set(this.data, counters[i].name, counters[i].live.join(','))
      }
    },
    onFetch(trades, from, to) {
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
