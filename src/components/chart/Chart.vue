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

const series = {}

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
  },
  mounted() {
    this.chart = TV.createChart(this.$refs.chartCanvas, {
      /** Width of the chart */
      // width: number;
      /** Height of the chart */
      // height: number;
      /** Structure with watermark options */
      // watermark: WatermarkOptions;
      /** Structure with layout options */
      // layout: LayoutOptions;
      /** Structure with price scale options */
      // priceScale: PriceScaleOptions;
      /** Structure with time scale options */
      // timeScale: TimeScaleOptions;
      /** Structure with crosshair options */
      // crosshair: CrosshairOptions;
      /** Structure with grid options */
      // grid: GridOptions;
      /** Structure with localization options */
      // localization: LocalizationOptions;
      /** Structure that describes scrolling behavior */
      // handleScroll: HandleScrollOptions;
      /** Structure that describes scaling behavior */
      // handleScale: HandleScaleOptions;
    })

    // create candlestick serie
    this.createSerie('price')

    // listen to trades
    socket.$on('trades.queued', this.onTrades)
  },
  beforeDestroy() {
    socket.$off('trades.queued', this.onTrades)
  },
  methods: {
    onTrades(trades) {
      for (let i = 0; i < trades.length; i++) {

      }
    },
    createSerie(id) {
      const serieOptions = typeof options.series[id] !== 'undefined' ? options.series[id] : {}

      this.series[id] = this.chart.addCandlestickSeries(Object.assign(serieOptions, {
        
      }))
    },
  },
}
