import Vue from 'vue'

import { uniqueName } from '../../utils/helpers'

export default {
  SET_PAIR(state, value) {
    state.pair = value.toString().toUpperCase()
  },
  SET_QUOTE_AS_PREFERED_CURRENCY(state, value) {
    state.preferQuoteCurrencySize = value ? true : false
  },
  SET_MAX_ROWS(state, value) {
    state.maxRows = value
  },
  SET_DECIMAL_PRECISION(state, value) {
    state.decimalPrecision = value
  },
  SET_AGGREGATION_LAG(state, value) {
    state.aggregationLag = value
  },
  TOGGLE_LOGOS(state, value) {
    state.showLogos = value ? true : false
  },
  TOGGLE_LIQUIDATIONS_ONLY(state, value) {
    state.liquidationsOnlyList = value ? true : false
  },
  SET_COUNTER_PRECISION(state, payload) {
    state.counterPrecision = value
  },
  TOGGLE_COUNTERS(state, value) {
    state.showCounters = value ? true : false
  },
  TOGGLE_CHART(state, value) {
    state.showChart = value ? true : false
  },
  TOGGLE_STATS(state, value) {
    state.showStats = value ? true : false
  },
  TOGGLE_STAT(state, { index, value }) {
    const stat = state.statsCounters[index]

    stat.enabled = value ? true : false;

    Vue.set(state.statsCounters, index, stat)
  },
  SET_STAT_PERIOD(state, { index, value }) {
    let milliseconds = parseInt(value);

    if (isNaN(milliseconds)) {
      return false
    }

    if (/[\d.]+s/.test(value)) {
      milliseconds *= 1000
    } else if (/[\d.]+h/.test(value)) {
      milliseconds *= 1000 * 60 * 60
    } else {
      milliseconds *= 1000 * 60
    }

    const stat = state.statsCounters[index]

    stat.period = milliseconds;

    Vue.set(state.statsCounters, index, stat)
  },
  SET_STAT_OUTPUT(state, { index, value }) {
    const stat = state.statsCounters[index]

    stat.output = value;

    Vue.set(state.statsCounters, index, stat)
  },
  SET_STAT_NAME(state, { index, value }) {
    const stat = state.statsCounters[index]
    const names = state.statsCounters.map(a => a.name)

    names.splice(index, 1)

    stat.name = uniqueName(value, names);

    Vue.set(state.statsCounters, index, stat)
  },
  CREATE_STAT(state) {
    state.statsCounters.push({
      name: uniqueName('COUNTER', state.statsCounters.map(a => a.name)),
      period: state.statsPeriod,
      output: 'stats.buyCount + stats.sellCount',
      enabled: false
    })
  },
  REMOVE_STAT(state, index) {
    state.statsCounters.splice(index, 1);
  },
  SET_STATS_PERIOD(state, value) {
    let milliseconds = parseInt(value);

    if (/[\d.]+s/.test(value)) {
      milliseconds *= 1000
    } else if (/[\d.]+h/.test(value)) {
      milliseconds *= 1000 * 60 * 60
    } else {
      milliseconds *= 1000 * 60
    }

    state.statsPeriod = milliseconds
  },
  TOGGLE_STATS_GRAPHS(state, value) {
    state.statsGraphs = value ? true : false;
  },
  TOGGLE_STATS_TIMEFRAME(state, value) {
    state.statsGraphsTimeframe = isNaN(+value) ? 1000 : value;
  },
  TOGGLE_STATS_LENGTH(state, value) {
    state.statsGraphsLength = isNaN(+value) ? 50 : value;
  },
  TOGGLE_INCOMPLETE_COUNTERS(state, value) {
    state.hideIncompleteCounter = value ? true : false
  },
  TOGGLE_CUMULATIVE_COUNTERS(state, value) {
    state.cumulativeCounters = value ? true : false
  },
  SET_COUNTER_VALUE(state, payload) {
    if (payload.value) {
      Vue.set(state.countersSteps, payload.index, payload.value)
    } else {
      state.countersSteps.splice(payload.index, 1)
    }

    state.countersSteps = state.countersSteps.sort((a, b) => a - b)
  },
  REPLACE_COUNTERS(state, counters) {
    state.countersSteps = counters.sort((a, b) => a - b)
  },
  TOGGLE_THRESHOLDS_TABLE(state, value) {
    state.showThresholdsAsTable = value ? true : false
  },
  SET_THRESHOLD_AMOUNT(state, payload) {
    const threshold = state.thresholds[payload.index]

    if (threshold) {
      if (typeof payload.value === 'string' && /m|k$/i.test(payload.value)) {
        if (/m$/i.test(value)) {
          threshold.amount = parseFloat(payload.value) * 1000000
        } else {
          threshold.amount = parseFloat(payload.value) * 1000
        }
      }
      threshold.amount = +payload.value

      Vue.set(state.thresholds, payload.index, threshold)
    }
  },
  SET_THRESHOLD_GIF(state, payload) {
    const threshold = state.thresholds[payload.index]

    if (threshold) {
      if (payload.value.trim().length) {
        threshold.gif = payload.value
      } else {
        payload.value = threshold.gif
        payload.isDeleted = true

        threshold.gif = null
      }

      Vue.set(state.thresholds, payload.index, threshold)
    }
  },
  SET_THRESHOLD_COLOR(state, payload) {
    const threshold = state.thresholds[payload.index]

    if (threshold) {
      threshold[payload.side] = payload.value

      Vue.set(state.thresholds, payload.index, threshold)
    }
  },
  ENABLE_EXCHANGE(state, exchange) {
    Vue.set(state.exchanges[exchange], 'disabled', false)
  },
  DISABLE_EXCHANGE(state, exchange) {
    Vue.set(state.exchanges[exchange], 'disabled', true)
  },
  SHOW_EXCHANGE(state, exchange) {
    Vue.set(state.exchanges[exchange], 'hidden', false)
  },
  HIDE_EXCHANGE(state, exchange) {
    Vue.set(state.exchanges[exchange], 'hidden', true)
  },
  TOGGLE_EXCHANGE_VISIBILITY(state, exchange) {
    Vue.set(
      state.exchanges[exchange],
      'hidden',
      state.exchanges[exchange].hidden === true ? false : true
    )
  },
  TOGGLE_SETTINGS_PANEL(state, value) {
    const index = state.settings.indexOf(value)

    if (index === -1) {
      state.settings.push(value)
    } else {
      state.settings.splice(index, 1)
    }
  },
  TOGGLE_AUDIO(state, value) {
    state.useAudio = value ? true : false
  },
  TOGGLE_WIDE_AUDIO_THRESHOLD(state, value) {
    state.audioIncludeInsignificants = value ? true : false
  },
  SET_AUDIO_VOLUME(state, value) {
    state.audioVolume = value
  },
  SET_TIMEFRAME(state, value) {
    state.timeframe = value
  },
  TOGGLE_LIQUIDATIONS(state, value) {
    state.chartLiquidations = value ? true : false
  },
  TOGGLE_CANDLESTICK(state, value) {
    state.chartCandlestick = value ? true : false
  },
  TOGGLE_VOLUME_SERIE(state, value) {
    state.chartVolume = value ? true : false
  },
  SET_VOLUME_SERIE_THRESHOLD(state, value) {
    state.chartVolumeThreshold = parseFloat(value) || 0
  },
  SET_VOLUME_BAR_OPACITY(state, value) {
    value = parseFloat(value)
    state.chartVolumeOpacity = isNaN(value) ? 1 : value
  },
  TOGGLE_VOLUME_AVERAGE(state, value) {
    state.chartVolumeAverage = value ? true : false
  },
  SET_VOLUME_AVERAGE_PERIOD(state, value) {
    state.chartVolumeAverageLength = parseInt(value) || 14
  },
  TOGGLE_PRICE_SMA(state, value) {
    state.chartSma = value ? true : false
  },
  SET_PRICE_SMA_PERIOD(state, value) {
    state.chartSmaLength = parseInt(value) || 14
  },
  TOGGLE_AUTO_CLEAR(state, value) {
    state.autoClearTrades = value ? true : false
  },
  SET_EXCHANGE_THRESHOLD(state, payload) {
    Vue.set(
      state.exchanges[payload.exchange],
      'threshold',
      +payload.threshold
    )
  },
  SET_EXCHANGE_MATCH(state, payload) {
    Vue.set(state.exchanges[payload.exchange], 'match', payload.match)
  },
  TOGGLE_EXCHANGE_CHART(state, exchange) {
    Vue.set(
      state.exchanges[exchange],
      'ohlc',
      state.exchanges[exchange].ohlc === false ? true : false
    )
  },
  SET_CHART_HEIGHT(state, value) {
    state.chartHeight = value || null
  },
  SET_CHART_RANGE(state, value) {
    state.chartRange = value
  },
  SET_WIDTH_PER_TICK(state, value) {
    state.chartCandleWidth = value
  },
  SET_CHART_PADDING(state, value) {
    state.chartPadding = value
  },
  TOGGLE_CHART_GRID(state, value) {
    state.chartGridlines = value ? true : false
  },
  SET_CHART_GRID_GAP(state, value) {
    state.chartGridlinesGap = parseInt(value) || 0
  },
  TOGGLE_CHART_AUTO_SCALE(state, value) {
    state.chartAutoScale = value ? true : false
  },
  TOGGLE_EXCHANGES_BAR(state, value) {
    state.showExchangesBar = value ? true : false
  }
}