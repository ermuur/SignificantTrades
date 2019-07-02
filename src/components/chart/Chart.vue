<template>
  <div id="chart">
    <div ref="chartCanvas" class="chart__canvas"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import socket from '../../services/socket'
import options from './options.json'

import * as TV from 'lightweight-charts'

const DEFAULT_TICK = {
  exchanges: {},
  open: null,
  high: null,
  low: null,
  close: null
}

/** @type {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function}[]} */
const activeSeries = []

/** @type {{
 * timestamp: number,
 * exchanges: {open: number, high: number, low: number, close: number}[],
 * series: {Object.<number, {
 *  value: any,
 *  updated: boolean
 * }>}
 * }} */
const currentTick = {}

export default {
  data() {
    return {
      tick: null,
      panning: false,
      fetching: false,
      showControls: false,

      /** @type {TV.IChartApi} */
      chart: null,
    }
  },
  created() {
    debugger;
  },
  mounted() {
    console.log('mounted');
    this.chart = TV.createChart(this.$refs.chartCanvas, Object.assign(serieOptions, {
      // custom chart options
    }))

    // create candlestick serie
    this.createSerie('price', this.tradeToOHLC.bind(this))

    // listen to trades
    socket.$on('trades.queued', this.onTrades)
  },
  beforeDestroy() {
    socket.$off('trades.queued', this.onTrades)

    this.clear()

    for (let id in this.activeSeries)

    this.chart.remove();
  },
  methods: {
    clear() {
      let i = activeSeries.length;

      while (i--) {
        const serie = activeSeries[i];

        if (!serie) {
          continue;
        }

        this.chart.removeSeries(serie.api);

        if (currentTick.series[serie.id]) {
          delete currentTick.series[serie.id];
        }

        activeSeries.splice(i, 1);
      }
    },

    onTrades(trades) {
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i];

        if (trade.timestamp > currentTick.timestamp + this.timeframe) {
          this.newTick(trade.timestamp);
        }

        for (let j = 0; j < activeSeries.length; j++) {
          const serie = activeSeries[j];

          this.updateTickSerie(serie, trade);
        }
      }

      this.redrawTick();
    },

    newTick(timestamp) {
      this.redrawTick();

      currentTick.timestamp = Math.floor(timestamp / this.timeframe) * this.timeframe;

      for (let i = 0; i < activeSeries.length; i++) {
        this.clearTickSerie(activeSeries[i])
      }

      currentTick.rendered = false;
    },


    /** @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function}[]} serie */
    updateTickSerie(serie, trade) {
      if (typeof serie.adapter === 'function') {
        currentTick.series[serie.id].value = serie.adapter(currentTick.series[serie.id].value, trade)
      } else if (typeof serie.adapter === 'string' && typeof trade[serie.adapter] !== 'undefined') {
        currentTick.series[serie.id].value += trade[serie.adapter];
      } else if (typeof trade[serie.id] !== 'undefined') {
        currentTick.series[serie.id].value += trade[serie.id];
      }

      currentTick.series[serie.id].rendered = false;
    },


    /** @param {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function}[]} serie */
    clearTickSerie(serie) {
      if (typeof serie.adapter === 'function') {
        currentTick.series[serie.id].value = serie.adapter(currentTick.series[serie.id].value)
      } else if (typeof serie.adapter === 'string' && typeof trade[serie.adapter] !== 'undefined') {
        currentTick.series[serie.id].value = 0;
      } else if (typeof trade[serie.id] !== 'undefined') {
        currentTick.series[serie.id].value = 0;
      }

      currentTick.series[serie.id].rendered = false;
    },

    redrawTick() {
      if (currentTick.rendered === true) {
        return;
      }

      for (let i = 0; i < activeSeries.length; i++) {
        const serieAPI = activeSeries[i].api;
        const serieData = currentTick.series[activeSeries[i].id]

        if (!serieData || serieData.value === null || serieData.rendered) {
          continue;
        }

        serieAPI.update(serieData.value)

        serieData.rendered = true;
      }

      serieData.rendered = true
    },

    createSerie(id, adapter) {
      console.log('createSerie', id, adapter);
      const serieOptions = typeof options.series[id] !== 'undefined' ? options.series[id] : {}
      const api = this.chart.addCandlestickSeries(Object.assign(serieOptions, {
      // custom serie options
      }))

      activeSeries.push({ id, api, adapter })
      currentTick.series[id] = {
        value: null,
        rendered: true
      }
    },

    tradeToOHLC(previous, trade, partial = true) {
      if (!this.currentTick) {
        this.cur
      }
    }
  },
}
</script>

<style lang="scss">
@import '../../assets/sass/variables';
</style>
