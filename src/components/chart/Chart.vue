<template>
  <div id="chart" class="chart">
    <Controls />
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
  chart,
} from './common'

import {
  reset,
  clear,
  populateTick,
  newTick,
  updateTickSerie,
  clearTickSerie,
  redrawTick
} from './ticker'

import priceSerieAdapter from './adapters/price'

import Controls from './Controls.vue'

export default {
  components: {
    Controls
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
    ...mapState(['pair', 'timeframe', 'actives', 'exchanges'])
  },
  created() {
  },
  mounted() {
    // create chart
    createChart(this.$refs.chart, chartOptions)

    // create candlestick serie
    createSerie('price', priceSerieAdapter)

    socket.fetchRange(this.timeframe * 100)

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
  },
  methods: {
    onFetch(trades) {
      clear();
      populateTick(trades);
    },

    onTrades(trades) {
      populateTick(trades);
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
