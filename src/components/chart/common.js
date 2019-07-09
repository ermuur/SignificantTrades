import * as TV from 'lightweight-charts'
import options from './options.json'
export let chartOptions = options.chart
export let seriesOptions = options.series

/** @type {{id: string, api: TV.ISeriesApi<area>, adapter: string | Function}[]} */
export const activeSeries = []

/** @type {{
 * timestamp: number,
 * exchanges: {open: number, high: number, low: number, close: number}[],
 * series: {Object.<number, {
 *  value: any,
 *  updated: boolean
 * }>}
 * }} */
export const currentTick = {
  series: {},
}

/** @type {TV.IChartApi} */
export let chart = null

/**
 * Create the chart
 *
 * @param {Element} container
 * @param {Object} options
 */
export function createChart(container, options) {
  chart = window.chart = TV.createChart(container, options)
}

/**
 * Create a serie
 *
 * @param {string} id
 * @param {{type: string, options: Object, onInit: Function, onTrade: Function, onRender: Function}} adapter
 */
export function createSerie(id, adapter) {
  if (!id) {
    throw new Error(`serie id is required`)
  }

  let type = 'line'
  let options = {}

  if (adapter && typeof adapter === 'object') {
    if (adapter.type) {
      type = adapter.type
    }

    if (adapter.options) {
      options = adapter.options
    }
  } else if (typeof adapter !== 'string') {
    adapter = id
  }

  type = type.charAt(0).toUpperCase() + type.slice(1)

  // create serie
  const api = chart['add' + type + 'Series'](
    Object.assign(seriesOptions[id] || {}, options)
  )
  api.id = chart.id

  // register serie api
  activeSeries.push({ id, api, adapter })

  // create serie data layer
  currentTick.series[id] = {
    value: null,
    rendered: true,
  }

  // onInit callback
  if (typeof adapter === 'object') {
    if (typeof adapter.onInit === 'function') {
      adapter.onInit(currentTick.series[id])
    }
  }
}
