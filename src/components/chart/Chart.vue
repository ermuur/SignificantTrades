<template>
  <div id="chart" class="chart">
    <ChartSeries />
    <ChartControls />
    <div ref="chart" class="chart__canvas"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../../services/socket'

import {
  chartOptions,
  seriesOptions,
  currentTick,
  activeSeries,
  createChart,
  createSerie,
  getSerieById,
  chart,
} from './common'

import {
  reset,
  clear,
  populateTick,
  newTick,
  updateTickSerie,
  clearTickSerie,
  redrawTick,
} from './ticker'

import adapters from './adapters'

import ChartSeries from './ChartSeries.vue'
import ChartControls from './ChartControls.vue'

export default {
  components: {
    ChartSeries,
    ChartControls,
  },
  data() {
    return {
      tick: null,
      panning: false,
      fetching: false,
      showControls: false,
    }
  },
  computed: {
    ...mapState('settings', [
      'pair',
      'timeframe',
      'exchanges',
      'series',
      'seriesOptions',
    ]),
    ...mapState('app', ['actives']),
  },
  created() {
    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'settings/TOGGLE_EXCHANGES_BAR':
          setTimeout(() => {
            chart.resize(this.$el.clientHeight, this.$el.clientWidth)
          })
          break
        case 'settings/SET_TIMEFRAME':
          console.log('[chart] onStoreMutation SET_TIMEFRAME', mutation.payload)
          this.fetch()
          break
      }
    })
  },
  mounted() {
    // create chart
    createChart(this.$refs.chart, chartOptions)

    // create candlestick serie
    for (let i = 0; i < this.series.length; i++) {
      const args = [adapters[this.series[i].adapter]]

      if (this.series[i].linkedTo) {
        args.push(getSerieById(this.series[i].linkedTo))
      }

      console.log('create serie', this.series[i], args)

      createSerie.apply(this, args)
    }

    this.fetch()

    // listen to fetch
    socket.$on('historical', this.onFetch)

    // listen to trades
    socket.$on('trades.queued', this.onTrades)
  },
  beforeDestroy() {
    socket.$off('trades.queued', this.onTrades)
    socket.$off('historical', this.onFetch)

    // delete series
    reset()

    // delete chart
    chart.remove()

    // unsubscribe store
    this.onStoreMutation()
  },
  methods: {
    onFetch(trades) {
      clear()
      populateTick(trades)
    },

    onTrades(trades) {
      populateTick(trades)
    },

    fetch() {
      socket.fetchRange(this.timeframe * 100).then((e) => {
        if (!e) {
          // was already fetched
          console.log('was already fetched')
          this.onFetch(socket.trades)
        }
      })
    },
  },
}
</script>

<style lang="scss">
@import '../../assets/sass/variables';

.chart {
  position: relative;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__controls {
    position: absolute;
    top: 1em;
    left: 1em;
    z-index: 3;
    font-size: 12px;
  }
}
</style>
