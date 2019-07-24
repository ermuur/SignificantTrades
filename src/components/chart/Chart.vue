<template>
  <div id="chart" class="chart">
    <Controls ref="controls" />
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
  redrawTick
} from './ticker'

import adapters from './adapters'

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
    ...mapState('settings', ['pair', 'timeframe', 'exchanges', 'series', 'seriesOptions']),
    ...mapState('app', ['actives'])
  },
  created() {
    this.onStoreMutation = this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'settings/TOGGLE_EXCHANGES_BAR':
          setTimeout(() => {
            chart.resize(this.$el.clientHeight, this.$el.clientWidth)
          })
          break
      }
    })
  },
  mounted() {
    // create chart
    createChart(this.$refs.chart, chartOptions)

    // create candlestick serie
    for (let i = 0; i < this.series.length; i++) {
      const args = [adapters[this.series[i].adapter]];

      if (this.series[i].linkedTo) {
        args.push(getSerieById(this.series[i].linkedTo))
      }

      console.log('create serie', this.series[i], args);

      createSerie.apply(this, args);
    }

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

    // unsubscribe store
    this.onStoreMutation()
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
